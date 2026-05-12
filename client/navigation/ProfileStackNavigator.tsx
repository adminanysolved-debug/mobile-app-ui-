import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import ProfileScreen from "@/screens/ProfileScreen";
import WalletScreen from "@/screens/WalletScreen";
import ConnectionsScreen from "@/screens/ConnectionsScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";

export type ProfileStackParamList = {
  Profile: { isEditing?: boolean } | undefined;
  Wallet: undefined;
  Connections: undefined;
};

const Stack = createNativeStackNavigator<ProfileStackParamList>();

import { Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/hooks/useTheme";

export default function ProfileStackNavigator() {
  const screenOptions = useScreenOptions({ transparent: true });
  const { theme } = useTheme();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="Wallet"
        component={WalletScreen}
        options={{
          headerShown: false,
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
