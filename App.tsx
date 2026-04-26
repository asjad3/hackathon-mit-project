import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";

import { postFinalize } from "./src/api/finalizeClient";
import { runOnDeviceSlm } from "./src/localModel";
import {
  buildFinalizeRequest,
  buildIntentSummary,
  toCoarseContext,
  validateFinalizePayloadPrivacy,
} from "./src/privacy/coarseContext";
import type {
  DeviceSignals,
  FinalizeRequest,
  LocalModelOutput,
  SlmBackend,
} from "./src/types";

const defaultSignals = (): DeviceSignals => ({
  session_id: `sess_${Date.now().toString(36)}`,
  client_pseudonym: "demo_user",
  merchant_id: "m_101",
  merchant_name: "Cafe Luna",
  time_bucket: "lunch",
  weather_bucket: "rainy",
  area_bucket: "old_town",
  demand_bucket: "low",
  event_tags: ["local_fair"],
  location: { lat: 48.7758, lng: 9.1829, radius_m: 220 },
  movement_signature: "slow_browse",
  preference_hints: ["coffee", "warm"],
});

export default function App() {
  const [gatewayUrl, setGatewayUrl] = useState("http://10.0.2.2:8000");
  const [maxDiscount, setMaxDiscount] = useState("20");
  const [slm, setSlm] = useState<SlmBackend>("mock");
  const [signals, setSignals] = useState<DeviceSignals>(defaultSignals);
  const [localOut, setLocalOut] = useState<LocalModelOutput | null>(null);
  const [busy, setBusy] = useState(false);
  const [finalizeResult, setFinalizeResult] = useState<string | null>(null);
  const [payloadPreview, setPayloadPreview] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const coarse = useMemo(() => toCoarseContext(signals), [signals]);
  const intent = useMemo(() => buildIntentSummary(signals), [signals]);

  const runLocal = useCallback(async () => {
    setErr(null);
    setFinalizeResult(null);
    setPayloadPreview(null);
    setBusy(true);
    try {
      const cap = Math.min(80, Math.max(1, parseInt(maxDiscount, 10) || 20));
      const out = await runOnDeviceSlm(signals, cap, slm);
      setLocalOut(out);
    } catch (e) {
      setLocalOut(null);
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }, [signals, maxDiscount, slm]);

  const sendFinalize = useCallback(async () => {
    if (!localOut) {
      setErr("Run the on-device SLM first.");
      return;
    }
    setErr(null);
    setFinalizeResult(null);
    setBusy(true);
    try {
      const body: FinalizeRequest = buildFinalizeRequest(signals, localOut);
      setPayloadPreview(JSON.stringify(body, null, 2));
      const privacy = validateFinalizePayloadPrivacy(body);
      if (!privacy.ok) {
        throw new Error(
          `Blocked by privacy gate. Sensitive fields found: ${privacy.issues.join(", ")}`
        );
      }
      const res = await postFinalize(body, gatewayUrl);
      setFinalizeResult(JSON.stringify(res, null, 2));
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }, [coarse, gatewayUrl, intent, localOut, signals]);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.h1}>City Wallet — on-device SLM</Text>
        <Text style={styles.note}>
          Raw GPS & preferences never leave the device in the network payload. Only
          coarse buckets + intent + local_model_output (draft) go to
          <Text style={styles.code}> /v1/offers/finalize</Text>.
        </Text>

        <Text style={styles.h2}>Gateway (genui-mvp)</Text>
        <TextInput
          style={styles.input}
          value={gatewayUrl}
          onChangeText={setGatewayUrl}
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="http://10.0.2.2:8000 (Android) or http://192.168.x.x:8000 (device)"
        />
        <Text style={styles.muted}>
          Android emulator: 10.0.2.2:8000 · iOS sim: 127.0.0.1:8000 · same LAN for physical device
        </Text>

        <Text style={styles.h2}>On-device model</Text>
        <View style={styles.row}>
          {(["mock", "native"] as const).map((b) => (
            <Pressable
              key={b}
              onPress={() => setSlm(b)}
              style={[styles.pill, slm === b && styles.pillOn]}
            >
              <Text style={slm === b ? styles.pillTextOn : styles.pillText}>{b}</Text>
            </Pressable>
          ))}
        </View>
        <Text style={styles.muted}>
          mock = heuristics (works everywhere). native = you link llama.cpp / MLC (throws until wired).
        </Text>

        <Text style={styles.h2}>Merchant cap</Text>
        <TextInput
          style={styles.input}
          value={maxDiscount}
          onChangeText={setMaxDiscount}
          keyboardType="number-pad"
        />

        <Text style={styles.h2}>Coarse context (from device buckets)</Text>
        <Text style={styles.json}>{JSON.stringify(coarse, null, 2)}</Text>
        <Text style={styles.muted}>intent_summary: {intent}</Text>

        <Pressable style={styles.btn} onPress={runLocal} disabled={busy}>
          {busy ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnText}>1 — Run on-device SLM</Text>
          )}
        </Pressable>

        {localOut && (
          <View style={styles.card}>
            <Text style={styles.h2}>local_model_output</Text>
            <Text style={styles.json}>{JSON.stringify(localOut, null, 2)}</Text>
          </View>
        )}

        {payloadPreview && (
          <View style={styles.card}>
            <Text style={styles.h2}>Sanitized finalize payload (no raw GPS/prefs)</Text>
            <Text style={styles.json}>{payloadPreview}</Text>
          </View>
        )}

        <Pressable
          style={[styles.btn, styles.btn2]}
          onPress={sendFinalize}
          disabled={busy || !localOut}
        >
          <Text style={styles.btnText}>2 — POST finalize to gateway</Text>
        </Pressable>

        {err && <Text style={styles.err}>{err}</Text>}
        {finalizeResult && (
          <View style={styles.card}>
            <Text style={styles.h2}>Server response (GenUI, policy)</Text>
            <Text style={styles.json}>{finalizeResult}</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0b1220" },
  scroll: { padding: 16, paddingBottom: 48 },
  h1: { color: "#f8fafc", fontSize: 20, fontWeight: "700", marginBottom: 8 },
  h2: { color: "#a5b4fc", fontSize: 15, fontWeight: "600", marginTop: 16, marginBottom: 6 },
  note: { color: "#94a3b8", fontSize: 13, lineHeight: 20, marginBottom: 8 },
  muted: { color: "#64748b", fontSize: 12, marginTop: 4, marginBottom: 4, lineHeight: 18 },
  code: { fontFamily: "monospace", color: "#e2e8f0" },
  input: {
    backgroundColor: "#111827",
    borderWidth: 1,
    borderColor: "#1f2937",
    color: "#f8fafc",
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
  },
  row: { flexDirection: "row", gap: 8, marginTop: 8 },
  pill: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: "#1e293b",
    borderWidth: 1,
    borderColor: "#334155",
  },
  pillOn: { backgroundColor: "#4f46e5", borderColor: "#6366f1" },
  pillText: { color: "#e2e8f0", fontSize: 14 },
  pillTextOn: { color: "#fff", fontWeight: "600" },
  btn: {
    backgroundColor: "#4f46e5",
    padding: 14,
    borderRadius: 10,
    marginTop: 20,
    alignItems: "center",
  },
  btn2: { backgroundColor: "#059669", marginTop: 12 },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  card: {
    marginTop: 12,
    padding: 12,
    backgroundColor: "#111827",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#1f2937",
  },
  json: { color: "#e2e8f0", fontFamily: "monospace", fontSize: 11, lineHeight: 16 },
  err: { color: "#f87171", marginTop: 12, fontSize: 13 },
});
