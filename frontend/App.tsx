import 'react-native-gesture-handler';
import React from 'react';
import { StatusBar as RNStatusBar, StyleSheet, View } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import {
  useFonts as useManrope,
  Manrope_400Regular,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
} from '@expo-google-fonts/manrope';
import { JetBrainsMono_600SemiBold } from '@expo-google-fonts/jetbrains-mono';

import { RootNavigator } from '@/navigation/RootNavigator';
import { AppProvider } from '@/context/AppContext';
import { colors } from '@/theme';

const navTheme = {
  ...DefaultTheme,
  dark: true,
  colors: {
    ...DefaultTheme.colors,
    background: colors.base,
    card: colors.surface,
    text: colors.textPrimary,
    border: colors.borderSubtle,
    primary: colors.go,
    notification: colors.urgent,
  },
};

export default function App() {
  const [loaded] = useManrope({
    Manrope_400Regular,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
    JetBrainsMono_600SemiBold,
  });

  if (!loaded) {
    return <View style={styles.splash} />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppProvider>
          <RNStatusBar barStyle="light-content" backgroundColor={colors.base} />
          <NavigationContainer theme={navTheme}>
            <RootNavigator />
          </NavigationContainer>
        </AppProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: colors.base,
  },
});
