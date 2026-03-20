import { useState } from "react";
import { View, StyleSheet, Pressable, ActivityIndicator, TextInput, ScrollView, Image } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";

import { ThemedText } from "@/components/ThemedText";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/context/AuthContext";
import { Spacing, BorderRadius } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

type SignUpScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, "SignUp">;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function SignUpScreen({ navigation }: SignUpScreenProps) {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { register } = useAuth();
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const buttonScale = useSharedValue(1);

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const handleSignUp = async () => {
    if (!fullName || !username || !email || !password) {
      setError("Please fill in all fields");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setIsLoading(true);
    setError("");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const result = await register({
      email: email.trim().toLowerCase(),
      username: username.trim().toLowerCase(),
      password,
      fullName: fullName.trim(),
    });
    setIsLoading(false);

    if (!result.success) {
      setError(result.error || "Registration failed");
    }
  };

  const handleButtonPressIn = () => {
    buttonScale.value = withSpring(0.97, { damping: 15 });
  };

  const handleButtonPressOut = () => {
    buttonScale.value = withSpring(1, { damping: 15 });
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#0D0B1E", "#1A1040", "#2D1B4E", "#0D0B1E"]}
        locations={[0, 0.3, 0.6, 1]}
        style={StyleSheet.absoluteFillObject}
      />

      <View style={styles.starsOverlay}>
        <View style={[styles.star, { top: "5%", left: "20%" }]} />
        <View style={[styles.star, { top: "10%", left: "80%" }]} />
        <View style={[styles.star, { top: "15%", left: "60%" }]} />
        <View style={[styles.star, { top: "3%", left: "40%" }]} />
        <View style={[styles.starLarge, { top: "8%", left: "70%" }]} />
      </View>

      <KeyboardAwareScrollViewCompat
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + Spacing["2xl"],
            paddingBottom: insets.bottom + Spacing.xl,
          },
        ]}
      >
        <View style={styles.headerSection}>
          <Image
            source={require("../assets/images/app-logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
          <ThemedText type="h1" style={styles.title}>
            Create Account
          </ThemedText>
          <ThemedText type="body" style={styles.subtitle}>
            Join Real Dream today
          </ThemedText>
        </View>

        <View style={styles.formSection}>
          <View style={styles.glassInput}>
            <Feather name="user" size={20} color="#8B7FC7" style={styles.inputIcon} />
            <TextInput
              style={styles.textInput}
              placeholder="Full Name"
              placeholderTextColor="#8B7FC7"
              value={fullName}
              onChangeText={setFullName}
              autoCapitalize="words"
              testID="input-fullname"
            />
          </View>

          <View style={styles.glassInput}>
            <Feather name="at-sign" size={20} color="#8B7FC7" style={styles.inputIcon} />
            <TextInput
              style={styles.textInput}
              placeholder="Username"
              placeholderTextColor="#8B7FC7"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              testID="input-username"
            />
          </View>

          <View style={styles.glassInput}>
            <Feather name="mail" size={20} color="#8B7FC7" style={styles.inputIcon} />
            <TextInput
              style={styles.textInput}
              placeholder="Email"
              placeholderTextColor="#8B7FC7"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              testID="input-email"
            />
          </View>

          <View style={styles.glassInput}>
            <Feather name="lock" size={20} color="#8B7FC7" style={styles.inputIcon} />
            <TextInput
              style={styles.textInput}
              placeholder="Password"
              placeholderTextColor="#8B7FC7"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              testID="input-password"
            />
            <Pressable
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eyeButton}
            >
              <Feather
                name={showPassword ? "eye-off" : "eye"}
                size={20}
                color="#8B7FC7"
              />
            </Pressable>
          </View>

          <View style={styles.glassInput}>
            <Feather name="lock" size={20} color="#8B7FC7" style={styles.inputIcon} />
            <TextInput
              style={styles.textInput}
              placeholder="Confirm Password"
              placeholderTextColor="#8B7FC7"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showPassword}
              testID="input-confirm-password"
            />
          </View>

          {error ? (
            <ThemedText type="small" style={styles.errorText}>
              {error}
            </ThemedText>
          ) : null}

          <AnimatedPressable
            onPress={handleSignUp}
            onPressIn={handleButtonPressIn}
            onPressOut={handleButtonPressOut}
            disabled={isLoading}
            style={buttonAnimatedStyle}
            testID="button-signup"
          >
            <LinearGradient
              colors={["#7C3AED", "#A855F7", "#EC4899"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.signUpButton}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <ThemedText type="body" style={styles.signUpButtonText}>
                  Sign Up
                </ThemedText>
              )}
            </LinearGradient>
          </AnimatedPressable>

          <View style={styles.signInContainer}>
            <ThemedText type="small" style={styles.signInText}>
              Already have an account?{" "}
            </ThemedText>
            <Pressable onPress={() => navigation.navigate("SignIn")}>
              <ThemedText type="small" style={styles.signInLink}>
                Sign In
              </ThemedText>
            </Pressable>
          </View>
        </View>
      </KeyboardAwareScrollViewCompat>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0D0B1E",
  },
  scrollView: {
    flex: 1,
    zIndex: 2,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
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
  headerSection: {
    alignItems: "center",
    marginBottom: Spacing["2xl"],
  },
  logo: {
    width: 100,
    height: 80,
    marginBottom: Spacing.md,
  },
  title: {
    color: "#C4B5FD",
    fontWeight: "700",
    fontStyle: "italic",
    marginBottom: Spacing.sm,
  },
  subtitle: {
    color: "#8B7FC7",
  },
  formSection: {
    gap: Spacing.lg,
  },
  glassInput: {
    flexDirection: "row",
    alignItems: "center",
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
  eyeButton: {
    padding: Spacing.xs,
  },
  errorText: {
    color: "#EF4444",
    textAlign: "center",
  },
  signUpButton: {
    height: 56,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    marginTop: Spacing.sm,
  },
  signUpButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 18,
  },
  signInContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: Spacing.lg,
  },
  signInText: {
    color: "#8B7FC7",
  },
  signInLink: {
    color: "#C4B5FD",
    fontWeight: "600",
  },
});
