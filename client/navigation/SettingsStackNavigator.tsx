import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import SettingsScreen from "@/screens/SettingsScreen";
import SubscriptionScreen from "@/screens/SubscriptionScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";

import ThemeScreen from "@/screens/ThemeScreen";

export type SettingsStackParamList = {
  Settings: undefined;
  Subscription: undefined;
  Themes: undefined;
};

const Stack = createNativeStackNavigator<SettingsStackParamList>();

import { Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/hooks/useTheme";

export default function SettingsStackNavigator() {
  const screenOptions = useScreenOptions();
  const { theme } = useTheme();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="Subscription"
        component={SubscriptionScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="Themes"
        component={ThemeScreen}
        options={{
          headerTitle: "THEMES",
        }}
      />
    </Stack.Navigator>
  );
}
