import React, { useState } from "react";
import { StyleSheet } from "react-native";
import { NavigationContainer, createNavigationContainerRef } from "@react-navigation/native";

export const navigationRef = createNavigationContainerRef();
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/query-client";

import RootStackNavigator from "@/navigation/RootStackNavigator";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ThemeProvider } from "@/context/ThemeContext";
import { AuthProvider } from "@/context/AuthContext";
import { AdPopup } from "@/components/AdPopup";

export default function App() {
  const [currentRoute, setCurrentRoute] = useState<string>("Unknown");

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ThemeProvider>
            <SafeAreaProvider>
              <GestureHandlerRootView style={styles.root}>
                <KeyboardProvider>
                  <NavigationContainer
                    ref={navigationRef}
                    onReady={() => {
                      if (navigationRef.isReady()) {
                        setCurrentRoute(navigationRef.getCurrentRoute()?.name || "Unknown");
                      }
                    }}
                    onStateChange={() => {
                      if (navigationRef.isReady()) {
                        setCurrentRoute(navigationRef.getCurrentRoute()?.name || "Unknown");
                      }
                    }}
                  >
                    <RootStackNavigator />
                  </NavigationContainer>
                  <StatusBar style="auto" />
                  <AdPopup currentRoute={currentRoute} />
                </KeyboardProvider>
              </GestureHandlerRootView>
            </SafeAreaProvider>
          </ThemeProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
