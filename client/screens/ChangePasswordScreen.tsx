import { useState } from "react";
import { View, StyleSheet, Image, Pressable, ScrollView, Platform, TextInput, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown, useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";

import { ThemedText } from "@/components/ThemedText";
import { useAuth } from "@/context/AuthContext";
import { Spacing, BorderRadius } from "@/constants/theme";
import { GalaxyBackground } from "@/components/GalaxyBackground";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function ChangePasswordScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { changePassword } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const buttonScale = useSharedValue(1);

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const handleButtonPressIn = () => {
    buttonScale.value = withSpring(0.97, { damping: 15 });
  };

  const handleButtonPressOut = () => {
    buttonScale.value = withSpring(1, { damping: 15 });
  };

  const handleChange = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("Please fill in all fields");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters");
      return;
    }

    setIsLoading(true);
    setError("");
    setSuccess("");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const result = await changePassword(currentPassword, newPassword);
    setIsLoading(false);

    if (result.success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSuccess("Password successfully updated");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => navigation.goBack(), 2000);
    } else {
      setError(result.error || "Failed to update password");
    }
  };

  return (
    <GalaxyBackground>
      <View
        style={[
          styles.content,
          {
            paddingTop: Spacing.xl,
            paddingBottom: insets.bottom + Spacing.xl,
          },
        ]}
      >

        <Animated.View entering={FadeInDown.springify()} style={styles.formContainer}>
          <ThemedText type="h2" style={styles.title}>
            Change Password
          </ThemedText>
          <ThemedText type="body" style={styles.subtitle}>
            Enter your current password and your new password below
          </ThemedText>

          <View style={styles.form}>
            <View style={styles.glassInput}>
              <Feather name="lock" size={20} color="#8B7FC7" style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="Current Password"
                placeholderTextColor="#8B7FC7"
                value={currentPassword}
                onChangeText={setCurrentPassword}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>

            <View style={styles.glassInput}>
              <Feather name="shield" size={20} color="#8B7FC7" style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="New Password"
                placeholderTextColor="#8B7FC7"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>

            <View style={styles.glassInput}>
              <Feather name="shield" size={20} color="#8B7FC7" style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="Confirm New Password"
                placeholderTextColor="#8B7FC7"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>

            {error ? (
              <ThemedText type="small" style={styles.errorText}>
                {error}
              </ThemedText>
            ) : null}

            {success ? (
              <View style={styles.successContainer}>
                <Feather name="check-circle" size={20} color="#22C55E" />
                <ThemedText type="small" style={styles.successText}>
                  {success}
                </ThemedText>
              </View>
            ) : null}

            <AnimatedPressable
              onPress={handleChange}
              onPressIn={handleButtonPressIn}
              onPressOut={handleButtonPressOut}
              disabled={isLoading}
              style={buttonAnimatedStyle}
            >
              <LinearGradient
                colors={["#7C3AED", "#A855F7", "#EC4899"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.submitButton}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <ThemedText type="body" style={styles.submitButtonText}>
                    Update Password
                  </ThemedText>
                )}
              </LinearGradient>
            </AnimatedPressable>
          </View>
        </Animated.View>
      </View>
    </GalaxyBackground>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
  },
  backButton: {
    marginBottom: Spacing.xl,
  },
  formContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    color: "#C4B5FD",
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  subtitle: {
    color: "#8B7FC7",
    textAlign: "center",
    marginBottom: Spacing["2xl"],
  },
  form: {
    width: "100%",
    gap: Spacing.lg,
  },
  glassInput: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(45, 39, 82, 0.6)",
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: "rgba(139, 127, 199, 0.3)",
    paddingHorizontal: Spacing.lg,
    height: 56,
  },
  inputIcon: {
    marginRight: Spacing.md,
  },
  textInput: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 16,
    height: "100%",
  },
  errorText: {
    color: "#EF4444",
    textAlign: "center",
  },
  successContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    backgroundColor: "rgba(34, 197, 94, 0.1)",
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
  },
  successText: {
    color: "#22C55E",
    textAlign: "center",
    flex: 1,
  },
  submitButton: {
    height: 56,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    marginTop: Spacing.md,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 18,
  },
});
