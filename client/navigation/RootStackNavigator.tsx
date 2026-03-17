import React from "react";
import { ActivityIndicator, View } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import GoogleAuthScreen from '../screens/GoogleAuthScreen';
import MainTabNavigator from "@/navigation/MainTabNavigator";
import SignInScreen from "@/screens/SignInScreen";
import SignUpScreen from "@/screens/SignUpScreen";
import ForgotPasswordScreen from "@/screens/ForgotPasswordScreen";
import PhoneSignInScreen from "@/screens/PhoneSignInScreen";
import WallOfFameScreen from "@/screens/WallOfFameScreen";
import WalletScreen from "@/screens/WalletScreen";
import ChatScreen from "@/screens/ChatScreen";
import SubscriptionScreen from "@/screens/SubscriptionScreen";
import PaymentScreen from "@/screens/PaymentScreen";
import VendorHubScreen from "@/screens/VendorHubScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/hooks/useTheme";
import NotificationsScreen from "@/screens/NotificationsScreen"; // Apna sahi path check kar lena
import LuckySpinScreen from "@/screens/LuckySpinScreen";       // Apna sahi path check kar lena
import PublicProfileScreen from "@/screens/PublicProfileScreen";
export type RootStackParamList = {
  SignIn: undefined;
  SignUp: undefined;
  ForgotPassword: undefined;
  PhoneSignIn: undefined;
  GoogleAuth: undefined;
  MainTabs: undefined;
  WallOfFame: undefined;
  Wallet: undefined;
  Champions: undefined;
  MyRealDream: undefined;
  Market: undefined;
  Gallery: undefined;
  NewsFeed: undefined;
  Connections: undefined;
  VendorProfile: undefined;
  VendorHub: undefined;
  Subscription: undefined;
  Payment: { plan: any };
  Notifications: undefined;
  LuckySpin: undefined; // 👈 Ye line add karo
  Chat: { otherUserId: string; otherUserName: string };
  PublicProfile: { userId: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootStackNavigator() {
  const screenOptions = useScreenOptions();
  const { isAuthenticated, isLoading } = useAuth();
  const { theme } = useTheme();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.backgroundDefault }}>
        <ActivityIndicator size="large" color={theme.link} />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      {isAuthenticated ? (
        <>
          <Stack.Screen
            name="MainTabs"
            component={MainTabNavigator}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Notifications"
            component={NotificationsScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="LuckySpin"
            component={LuckySpinScreen}
            options={{ headerTitle: "Lucky Spin" }}
          />
          <Stack.Screen
            name="WallOfFame"
            component={WallOfFameScreen}
            options={{ headerTitle: "Wall of Fame" }}
          />
          <Stack.Screen
            name="Wallet"
            component={WalletScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Chat"
            component={ChatScreen}
            options={({ route }) => ({
              headerTitle: (route.params as any)?.otherUserName || "Chat",
            })}
          />
          <Stack.Screen
            name="Subscription"
            component={SubscriptionScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Payment"
            component={PaymentScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="VendorHub"
            component={VendorHubScreen}
            options={{ headerTitle: "Vendor Hub" }}
          />
          <Stack.Screen
            name="PublicProfile"
            component={PublicProfileScreen}
            options={{ headerShown: false }}
          />
        </>
      ) : (
        <>
          <Stack.Screen
            name="SignIn"
            component={SignInScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="GoogleAuth"
            component={GoogleAuthScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="SignUp"
            component={SignUpScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="ForgotPassword"
            component={ForgotPasswordScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="PhoneSignIn"
            component={PhoneSignInScreen}
            options={{ headerShown: false }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}
