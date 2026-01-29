import { useState, useRef, useEffect } from "react";
import { View, StyleSheet, Pressable, ActivityIndicator, TextInput, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, {
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";

import { ThemedText } from "@/components/ThemedText";
import { useAuth } from "@/context/AuthContext";
import { Spacing, BorderRadius } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

type PhoneSignInScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, "PhoneSignIn">;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function PhoneSignInScreen({ navigation }: PhoneSignInScreenProps) {
  const insets = useSafeAreaInsets();
  const { sendPhoneCode, verifyPhoneCode } = useAuth();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(0);
  
  const buttonScale = useSharedValue(1);
  const recaptchaContainerId = "recaptcha-container";

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const handleButtonPressIn = () => {
    buttonScale.value = withSpring(0.97, { damping: 15 });
  };

  const handleButtonPressOut = () => {
    buttonScale.value = withSpring(1, { damping: 15 });
  };

  const formatPhoneNumber = (text: string) => {
    const cleaned = text.replace(/[^\d+]/g, "");
    if (!cleaned.startsWith("+")) {
      return "+" + cleaned;
    }
    return cleaned;
  };

  const handleSendCode = async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      setError("Please enter a valid phone number with country code (e.g., +1234567890)");
      return;
    }

    setIsLoading(true);
    setError("");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const result = await sendPhoneCode(formatPhoneNumber(phoneNumber), recaptchaContainerId);
    setIsLoading(false);

    if (result.success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setStep("code");
      setCountdown(60);
    } else {
      setError(result.error || "Failed to send verification code");
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setError("Please enter the 6-digit verification code");
      return;
    }

    setIsLoading(true);
    setError("");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const result = await verifyPhoneCode(verificationCode);
    setIsLoading(false);

    if (result.success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      setError(result.error || "Verification failed");
    }
  };

  const handleResendCode = async () => {
    if (countdown > 0) return;
    
    setIsLoading(true);
    setError("");
    
    const result = await sendPhoneCode(formatPhoneNumber(phoneNumber), recaptchaContainerId);
    setIsLoading(false);

    if (result.success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setCountdown(60);
    } else {
      setError(result.error || "Failed to resend code");
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
            <Feather name="smartphone" size={40} color="#FFFFFF" />
          </LinearGradient>

          <ThemedText type="h2" style={styles.title}>
            {step === "phone" ? "Phone Sign In" : "Enter Code"}
          </ThemedText>
          <ThemedText type="body" style={styles.subtitle}>
            {step === "phone" 
              ? "Enter your phone number with country code"
              : `We sent a verification code to ${phoneNumber}`}
          </ThemedText>

          <View style={styles.form}>
            {step === "phone" ? (
              <Animated.View entering={FadeInUp.delay(100)}>
                <View style={styles.glassInput}>
                  <Feather name="phone" size={20} color="#8B7FC7" style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="+1234567890"
                    placeholderTextColor="#8B7FC7"
                    value={phoneNumber}
                    onChangeText={(text) => setPhoneNumber(formatPhoneNumber(text))}
                    keyboardType="phone-pad"
                    autoComplete="tel"
                    testID="input-phone-number"
                  />
                </View>
              </Animated.View>
            ) : (
              <Animated.View entering={FadeInUp.delay(100)}>
                <View style={styles.glassInput}>
                  <Feather name="key" size={20} color="#8B7FC7" style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Enter 6-digit code"
                    placeholderTextColor="#8B7FC7"
                    value={verificationCode}
                    onChangeText={(text) => setVerificationCode(text.replace(/\D/g, "").slice(0, 6))}
                    keyboardType="number-pad"
                    maxLength={6}
                    testID="input-verification-code"
                  />
                </View>
              </Animated.View>
            )}

            {error ? (
              <ThemedText type="small" style={styles.errorText}>
                {error}
              </ThemedText>
            ) : null}

            <AnimatedPressable
              onPress={step === "phone" ? handleSendCode : handleVerifyCode}
              onPressIn={handleButtonPressIn}
              onPressOut={handleButtonPressOut}
              disabled={isLoading}
              style={buttonAnimatedStyle}
              testID={step === "phone" ? "button-send-code" : "button-verify-code"}
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
                    {step === "phone" ? "Send Code" : "Verify Code"}
                  </ThemedText>
                )}
              </LinearGradient>
            </AnimatedPressable>

            {step === "code" ? (
              <View style={styles.resendContainer}>
                <Pressable
                  onPress={handleResendCode}
                  disabled={countdown > 0 || isLoading}
                  style={styles.resendButton}
                >
                  <ThemedText type="small" style={[styles.resendText, countdown > 0 && styles.resendTextDisabled]}>
                    {countdown > 0 ? `Resend code in ${countdown}s` : "Resend code"}
                  </ThemedText>
                </Pressable>
                
                <Pressable
                  onPress={() => {
                    setStep("phone");
                    setVerificationCode("");
                    setError("");
                  }}
                  style={styles.changeNumberButton}
                >
                  <ThemedText type="small" style={styles.changeNumberText}>
                    Change phone number
                  </ThemedText>
                </Pressable>
              </View>
            ) : null}
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

      {Platform.OS === "web" ? (
        <div id={recaptchaContainerId} style={{ position: "absolute", bottom: 0, left: 0 }} />
      ) : null}
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
    paddingHorizontal: Spacing.lg,
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
    letterSpacing: 1,
  },
  errorText: {
    color: "#EF4444",
    textAlign: "center",
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
  resendContainer: {
    alignItems: "center",
    gap: Spacing.sm,
  },
  resendButton: {
    padding: Spacing.sm,
  },
  resendText: {
    color: "#A855F7",
  },
  resendTextDisabled: {
    color: "#8B7FC7",
  },
  changeNumberButton: {
    padding: Spacing.sm,
  },
  changeNumberText: {
    color: "#C4B5FD",
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
