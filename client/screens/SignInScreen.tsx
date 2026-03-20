import { useState } from "react";
import { View, StyleSheet, Pressable, ActivityIndicator, TextInput, Image } from "react-native";
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
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/context/AuthContext";
import { Spacing, BorderRadius } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

type SignInScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, "SignIn">;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function SignInScreen({ navigation }: SignInScreenProps) {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { login, loginWithGoogle, loginWithFacebook } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isFacebookLoading, setIsFacebookLoading] = useState(false);
  const [error, setError] = useState("");

  const buttonScale = useSharedValue(1);

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const handleSignIn = async () => {
    if (!email || !password) {
      setError("Please enter your email/username and password");
      return;
    }

    setIsLoading(true);
    setError("");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const result = await login(email.trim().toLowerCase(), password);
    setIsLoading(false);

    if (!result.success) {
      setError(result.error || "Login failed");
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setError("");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate("GoogleAuth");
  };
  /*
    try {
      const result = await loginWithGoogle();
      setIsGoogleLoading(false);
      
      if (result.success) {
        navigation.replace("MainTabs");
      }else if (result.error === 'ANDROID_GOOGLE_AUTH') {
        navigation.navigate('GoogleAuth');}
      else {
        setError(result.error || "Google login failed");
      }
    } catch (err) {
      setIsGoogleLoading(false);
      setError("Google login failed");
    }
  };**/

  const handleFacebookSignIn = async () => {
    setIsFacebookLoading(true);
    setError("");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const result = await loginWithFacebook();
      setIsFacebookLoading(false);

      if (!result.success) {
        setError(result.error || "Facebook login failed");
      }
    } catch (err) {
      setIsFacebookLoading(false);
      setError("Facebook login failed");
    }
  };

  const handleForgotPassword = () => {
    navigation.navigate("ForgotPassword" as any);
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
        <View style={[styles.star, { top: "10%", left: "20%" }]} />
        <View style={[styles.star, { top: "15%", left: "80%" }]} />
        <View style={[styles.star, { top: "25%", left: "60%" }]} />
        <View style={[styles.star, { top: "8%", left: "40%" }]} />
        <View style={[styles.star, { top: "20%", left: "10%" }]} />
        <View style={[styles.starLarge, { top: "12%", left: "70%" }]} />
        <View style={[styles.starLarge, { top: "18%", left: "30%" }]} />
      </View>

      <View
        style={[
          styles.content,
          {
            paddingTop: insets.top + Spacing["3xl"],
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
            Real Dream
          </ThemedText>
          <ThemedText type="body" style={styles.subtitle}>
            Explore your subconscious
          </ThemedText>
        </View>

        <View style={styles.formSection}>
          <View style={styles.glassInput}>
            <Feather name="user" size={20} color="#8B7FC7" style={styles.inputIcon} />
            <TextInput
              style={styles.textInput}
              placeholder="Email or Username"
              placeholderTextColor="#8B7FC7"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              testID="input-email"
            />
          </View>

          <View style={styles.glassInput}>
            <Feather name="lock" size={20} color="#8B7FC7" style={styles.inputIcon} />
            <TextInput
              style={styles.textInput}
              placeholder="Enter your password"
              placeholderTextColor="#8B7FC7"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              testID="input-password"
            />
            <Pressable
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eyeButton}
              testID="button-toggle-password"
            >
              <Feather
                name={showPassword ? "eye-off" : "eye"}
                size={20}
                color="#8B7FC7"
              />
            </Pressable>
          </View>

          <Pressable style={styles.forgotButton} onPress={handleForgotPassword}>
            <ThemedText type="small" style={styles.forgotText}>
              Forgot Password?
            </ThemedText>
          </Pressable>

          {error ? (
            <ThemedText type="small" style={styles.errorText}>
              {error}
            </ThemedText>
          ) : null}

          <AnimatedPressable
            onPress={handleSignIn}
            onPressIn={handleButtonPressIn}
            onPressOut={handleButtonPressOut}
            disabled={isLoading}
            style={buttonAnimatedStyle}
            testID="button-signin"
          >
            <LinearGradient
              colors={["#7C3AED", "#A855F7", "#EC4899"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.loginButton}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <ThemedText type="body" style={styles.loginButtonText}>
                  Log In
                </ThemedText>
              )}
            </LinearGradient>
          </AnimatedPressable>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <ThemedText type="small" style={styles.dividerText}>
              Or continue with
            </ThemedText>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.socialButtons}>
            <Pressable
              onPress={handleGoogleSignIn}
              style={[styles.socialButton, styles.googleButton]}
              disabled={isGoogleLoading}
              testID="button-google-signin"
            >
              {isGoogleLoading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <ThemedText type="h3" style={styles.socialIcon}>G</ThemedText>
              )}
            </Pressable>

            <Pressable
              onPress={() => navigation.navigate("PhoneSignIn")}
              style={[styles.socialButton, styles.phoneButton]}
              testID="button-phone-signin"
            >
              <Feather name="smartphone" size={24} color="#FFFFFF" />
            </Pressable>

            <Pressable
              onPress={handleFacebookSignIn}
              style={[styles.socialButton, styles.facebookButton]}
              disabled={isFacebookLoading}
              testID="button-facebook-signin"
            >
              {isFacebookLoading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Feather name="facebook" size={24} color="#FFFFFF" />
              )}
            </Pressable>
          </View>

          <View style={styles.signUpContainer}>
            <ThemedText type="small" style={styles.signUpText}>
              Don't have an account?{" "}
            </ThemedText>
            <Pressable onPress={() => navigation.navigate("SignUp")}>
              <ThemedText type="small" style={styles.signUpLink}>
                Sign Up
              </ThemedText>
            </Pressable>
          </View>
        </View>
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
  headerSection: {
    alignItems: "center",
    marginTop: Spacing["3xl"],
    marginBottom: Spacing["3xl"],
  },
  logo: {
    width: 120,
    height: 100,
    marginBottom: Spacing.lg,
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
    flex: 1,
    justifyContent: "center",
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
  forgotButton: {
    alignSelf: "flex-end",
    marginTop: -Spacing.sm,
  },
  forgotText: {
    color: "#C4B5FD",
    fontWeight: "500",
  },
  errorText: {
    color: "#EF4444",
    textAlign: "center",
  },
  loginButton: {
    height: 56,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  loginButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 18,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: Spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(139, 127, 199, 0.3)",
  },
  dividerText: {
    color: "#8B7FC7",
    paddingHorizontal: Spacing.md,
  },
  socialButtons: {
    flexDirection: "row",
    justifyContent: "center",
    gap: Spacing.lg,
  },
  socialButton: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  googleButton: {
    backgroundColor: "#EA4335",
  },
  phoneButton: {
    backgroundColor: "#22C55E",
  },
  facebookButton: {
    backgroundColor: "#1877F2",
  },
  socialIcon: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  signUpContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: Spacing.xl,
  },
  signUpText: {
    color: "#8B7FC7",
  },
  signUpLink: {
    color: "#C4B5FD",
    fontWeight: "600",
  },
});
