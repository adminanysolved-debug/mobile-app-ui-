import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import MyRealDreamScreen from "@/screens/MyRealDreamScreen";
import CreateDreamScreen from "@/screens/CreateDreamScreen";
import DreamDetailScreen from "@/screens/DreamDetailScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";

export type RealDreamStackParamList = {
  MyRealDream: undefined;
  CreateDream: { type?: "personal" | "challenge" | "group" };
  DreamDetail: { dreamId: string };
};

const Stack = createNativeStackNavigator<RealDreamStackParamList>();

export default function RealDreamStackNavigator() {
  const screenOptions = useScreenOptions();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="MyRealDream"
        component={MyRealDreamScreen}
        options={{
          headerTitle: "MY REALDREAM",
        }}
      />
      <Stack.Screen
        name="CreateDream"
        component={CreateDreamScreen}
        options={{
          headerTitle: "Create Dream",
        }}
      />
      <Stack.Screen
        name="DreamDetail"
        component={DreamDetailScreen}
        options={{
          headerTitle: "Dream Details",
        }}
      />
    </Stack.Navigator>
  );
}
