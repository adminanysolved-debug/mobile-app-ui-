import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import ProfileScreen from "@/screens/ProfileScreen";
import ThemeScreen from "@/screens/ThemeScreen";
import WalletScreen from "@/screens/WalletScreen";
import ConnectionsScreen from "@/screens/ConnectionsScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";

export type ProfileStackParamList = {
  Profile: undefined;
  Themes: undefined;
  Wallet: undefined;
  Connections: undefined;
};

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export default function ProfileStackNavigator() {
  const screenOptions = useScreenOptions();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          headerTitle: "PERSONAL PROFILE",
        }}
      />
      <Stack.Screen
        name="Themes"
        component={ThemeScreen}
        options={{
          headerTitle: "Themes",
        }}
      />
      <Stack.Screen
        name="Wallet"
        component={WalletScreen}
        options={{
          headerTitle: "My Wallet",
        }}
      />
      <Stack.Screen
        name="Connections"
        component={ConnectionsScreen}
        options={{
          headerTitle: "Connections",
        }}
      />
    </Stack.Navigator>
  );
}
