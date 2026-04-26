import React from 'react';
import { StyleSheet, View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Compass, MapPin, Wallet } from 'lucide-react-native';

import { ExploreScreen } from '@/screens/ExploreScreen';
import { NearbyScreen } from '@/screens/NearbyScreen';
import { WalletScreen } from '@/screens/WalletScreen';
import { OfferScreen } from '@/screens/OfferScreen';
import { RedemptionScreen } from '@/screens/RedemptionScreen';
import { ExpiredScreen } from '@/screens/ExpiredScreen';
import { DismissedScreen } from '@/screens/DismissedScreen';
import { colors, fonts } from '@/theme';
import type { RootStackParamList, TabParamList } from './types';

const Tab = createBottomTabNavigator<TabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: colors.go,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tab.Screen
        name="Explore"
        component={ExploreScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Compass size={size} color={color} strokeWidth={2} />,
        }}
      />
      <Tab.Screen
        name="Nearby"
        component={NearbyScreen}
        options={{
          tabBarIcon: ({ color, size }) => <MapPin size={size} color={color} strokeWidth={2} />,
        }}
      />
      <Tab.Screen
        name="Wallet"
        component={WalletScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Wallet size={size} color={color} strokeWidth={2} />,
        }}
      />
    </Tab.Navigator>
  );
}

export function RootNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.base },
        animation: 'slide_from_bottom',
      }}
    >
      <Stack.Screen name="MainTabs" component={MainTabs} options={{ animation: 'fade' }} />
      <Stack.Screen name="Offer" component={OfferScreen} />
      <Stack.Screen name="Redemption" component={RedemptionScreen} options={{ animation: 'fade' }} />
      <Stack.Screen name="Expired" component={ExpiredScreen} />
      <Stack.Screen name="Dismissed" component={DismissedScreen} />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.surface,
    borderTopColor: colors.borderSubtle,
    borderTopWidth: 1,
    height: 88,
    paddingBottom: 28,
    paddingTop: 8,
  },
  tabLabel: {
    fontFamily: fonts.semibold,
    fontSize: 10,
    letterSpacing: 0.4,
  },
});
