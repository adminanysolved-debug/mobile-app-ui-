import { useState } from "react";
import { View, StyleSheet, Pressable, ActivityIndicator, TextInput } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";

import { ThemedText } from "@/components/ThemedText";
import { useAuth } from "@/context/AuthContext";
import { Spacing, BorderRadius } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

type ForgotPasswordScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, "ForgotPassword">;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function ForgotPasswordScreen({ navigation }: ForgotPasswordScreenProps) {
  const insets = useSafeAreaInsets();
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState("");
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

  const handleSendReset = async () => {
    if (!email) {
      setError("Please enter your email address");
      return;
    }

    setIsLoading(true);
    setError("");
    setSuccess("");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const result = await forgotPassword(email.trim().toLowerCase());
    setIsLoading(false);

    if (result.success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSuccess("Password reset link has been sent to your email. Please check your inbox and follow the instructions to reset your password.");
    } else {
      setError(result.error || "Failed to send reset email");
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#0D0B1E", "#1A1040", "#2D1B4E", "#0D0B1E"]}
        locations={[0, 0.3, 0.6, 1]}
        style={StyleSheet.absoluteFillObject}
      />
      
      <View style={styles.starsOverlay}>
        <View style={[styles.star, { top: "10%", left: "20%" }]} />
        <View style={[styles.star, { top: "15%", left: "80%" }]} />
        <View style={[styles.star, { top: "25%", left: "60%" }]} />
        <View style={[styles.starLarge, { top: "12%", left: "70%" }]} />
      </View>

      <View
        style={[
          styles.content,
          {
            paddingTop: insets.top + Spacing.xl,
            paddingBottom: insets.bottom + Spacing.xl,
          },
        ]}
      >
        <Pressable
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Feather name="arrow-left" size={24} color="#C4B5FD" />
        </Pressable>

        <Animated.View entering={FadeInDown.springify()} style={styles.formContainer}>
          <LinearGradient
            colors={["#7C3AED", "#A855F7"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.iconContainer}
          >
            <Feather name="lock" size={40} color="#FFFFFF" />
          </LinearGradient>

          <ThemedText type="h2" style={styles.title}>
            Forgot Password?
          </ThemedText>
          <ThemedText type="body" style={styles.subtitle}>
            Enter your email to receive a password reset link
          </ThemedText>

          <View style={styles.form}>
            <View style={styles.glassInput}>
              <Feather name="mail" size={20} color="#8B7FC7" style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="Enter your email"
                placeholderTextColor="#8B7FC7"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                testID="input-forgot-email"
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
              onPress={handleSendReset}
              onPressIn={handleButtonPressIn}
              onPressOut={handleButtonPressOut}
              disabled={isLoading}
              style={buttonAnimatedStyle}
              testID="button-send-reset"
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
                    Send Reset Link
                  </ThemedText>
                )}
              </LinearGradient>
            </AnimatedPressable>
          </View>

          <Pressable
            onPress={() => navigation.goBack()}
            style={styles.backToLogin}
          >
            <Feather name="arrow-left" size={16} color="#C4B5FD" />
            <ThemedText type="small" style={styles.backToLoginText}>
              Back to Sign In
            </ThemedText>
          </Pressable>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0D0B1E",
  },
  starsOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  star: {
    position: "absolute",
    width: 2,
    height: 2,
    backgroundColor: "#FFFFFF",
    borderRadius: 1,
    opacity: 0.6,
  },
  starLarge: {
    position: "absolute",
    width: 3,
    height: 3,
    backgroundColor: "#FFFFFF",
    borderRadius: 1.5,
    opacity: 0.8,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    zIndex: 2,
  },
  backButton: {
    marginBottom: Spacing.xl,
  },
  formContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xl,
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
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 18,
  },
  backToLogin: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing["2xl"],
  },
  backToLoginText: {
    color: "#C4B5FD",
    marginLeft: Spacing.xs,
  },
});
