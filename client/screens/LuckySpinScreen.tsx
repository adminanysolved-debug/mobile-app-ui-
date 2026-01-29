import { useState, useEffect } from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
  withSpring,
  Easing,
  runOnJS,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/context/AuthContext";
import { Spacing, BorderRadius } from "@/constants/theme";
import { getApiUrl } from "@/lib/query-client";

const prizes = [
  { value: 10, label: "10 Points", color: "#3B82F6" },
  { value: 25, label: "25 Points", color: "#22C55E" },
  { value: 50, label: "50 Points", color: "#EAB308" },
  { value: 100, label: "100 Points", color: "#8B5CF6" },
  { value: 200, label: "200 Points", color: "#EC4899" },
  { value: 500, label: "500 Points", color: "#F97316" },
];

export default function LuckySpinScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();
  const { token, refreshUser, user } = useAuth();
  const [isSpinning, setIsSpinning] = useState(false);
  const [lastWin, setLastWin] = useState<number | null>(null);
  const [spinsLeft, setSpinsLeft] = useState(3);
  const [error, setError] = useState("");

  const rotation = useSharedValue(0);
  const scale = useSharedValue(1);

  useEffect(() => {
    if (user) {
      const today = new Date().toDateString();
      const lastSpinDate = user.lastSpinDate ? new Date(user.lastSpinDate).toDateString() : null;
      if (lastSpinDate !== today) {
        setSpinsLeft(3);
      } else {
        setSpinsLeft(user.dailySpinsLeft || 0);
      }
    }
  }, [user]);

  const spinStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${rotation.value}deg` },
      { scale: scale.value },
    ],
  }));

  const handleWin = (prize: number) => {
    setLastWin(prize);
    refreshUser();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleSpin = async () => {
    if (isSpinning || spinsLeft <= 0 || !token) return;

    setIsSpinning(true);
    setLastWin(null);
    setError("");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const response = await fetch(new URL('/api/wallet/spin', getApiUrl()).toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      
      if (!response.ok) {
        setError(data.error || "Failed to spin");
        setIsSpinning(false);
        return;
      }

      const prize = data.prize;
      setSpinsLeft(data.spinsLeft);
      const spinDegrees = 360 * 5 + Math.random() * 360;

      scale.value = withSequence(
        withTiming(1.05, { duration: 300 }),
        withTiming(1, { duration: 200 })
      );

      rotation.value = withSequence(
        withTiming(rotation.value + spinDegrees, {
          duration: 3000,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        })
      );

      setTimeout(() => {
        runOnJS(handleWin)(prize);
        runOnJS(setIsSpinning)(false);
      }, 3100);
    } catch (err) {
      setError("Network error. Please try again.");
      setIsSpinning(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <View
        style={[
          styles.content,
          {
            paddingTop: headerHeight + Spacing.xl,
            paddingBottom: insets.bottom + Spacing.xl,
          },
        ]}
      >
        <Animated.View entering={FadeInDown.springify()} style={styles.header}>
          <ThemedText type="h2" style={styles.title}>
            Lucky Spin
          </ThemedText>
          <ThemedText type="body" style={[styles.subtitle, { color: theme.textSecondary }]}>
            Spin to win points daily!
          </ThemedText>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.spinsCard}>
          <View style={[styles.spinsInfo, { backgroundColor: theme.backgroundSecondary }]}>
            <Feather name="gift" size={20} color={theme.yellow} />
            <ThemedText type="body" style={{ marginLeft: Spacing.sm }}>
              <ThemedText type="bodyMedium">{spinsLeft}</ThemedText> spins left today
            </ThemedText>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.wheelContainer}>
          <Animated.View style={[styles.wheel, spinStyle]}>
            <LinearGradient
              colors={theme.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.wheelInner}
            >
              {prizes.map((prize, index) => {
                const angle = (index * 360) / prizes.length;
                return (
                  <View
                    key={index}
                    style={[
                      styles.prizeSegment,
                      {
                        transform: [
                          { rotate: `${angle}deg` },
                          { translateY: -60 },
                        ],
                      },
                    ]}
                  >
                    <View style={[styles.prizeDot, { backgroundColor: prize.color }]}>
                      <Feather name="dollar-sign" size={16} color="#FFFFFF" />
                    </View>
                  </View>
                );
              })}
              <View style={styles.wheelCenter}>
                <Feather name="star" size={32} color={theme.yellow} />
              </View>
            </LinearGradient>
          </Animated.View>

          <View style={[styles.pointer, { borderBottomColor: theme.yellow }]} />
        </Animated.View>

        {lastWin !== null ? (
          <Animated.View
            entering={FadeInDown.springify()}
            style={[styles.winCard, { backgroundColor: theme.success + "20" }]}
          >
            <Feather name="award" size={24} color={theme.success} />
            <ThemedText type="h3" style={{ color: theme.success, marginLeft: Spacing.md }}>
              You won {lastWin} points!
            </ThemedText>
          </Animated.View>
        ) : null}

        <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.buttonContainer}>
          <Button
            onPress={handleSpin}
            disabled={isSpinning || spinsLeft <= 0}
            style={styles.spinButton}
          >
            {isSpinning ? "Spinning..." : spinsLeft > 0 ? "SPIN NOW!" : "No Spins Left"}
          </Button>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(400).springify()} style={styles.prizesGrid}>
          <ThemedText type="small" style={[styles.prizesTitle, { color: theme.textSecondary }]}>
            Possible Prizes
          </ThemedText>
          <View style={styles.prizesList}>
            {prizes.map((prize, index) => (
              <View
                key={index}
                style={[styles.prizeItem, { backgroundColor: theme.backgroundSecondary }]}
              >
                <View style={[styles.prizeColor, { backgroundColor: prize.color }]} />
                <ThemedText type="xs">{prize.label}</ThemedText>
              </View>
            ))}
          </View>
        </Animated.View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    alignItems: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  title: {
    marginBottom: Spacing.xs,
  },
  subtitle: {
    textAlign: "center",
  },
  spinsCard: {
    marginBottom: Spacing.xl,
  },
  spinsInfo: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
  },
  wheelContainer: {
    width: 220,
    height: 220,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xl,
  },
  wheel: {
    width: 200,
    height: 200,
    borderRadius: 100,
  },
  wheelInner: {
    width: "100%",
    height: "100%",
    borderRadius: 100,
    alignItems: "center",
    justifyContent: "center",
  },
  prizeSegment: {
    position: "absolute",
    alignItems: "center",
  },
  prizeDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  wheelCenter: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  pointer: {
    position: "absolute",
    top: -10,
    width: 0,
    height: 0,
    borderLeftWidth: 15,
    borderRightWidth: 15,
    borderBottomWidth: 25,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
  },
  winCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
  },
  buttonContainer: {
    width: "100%",
    marginBottom: Spacing.xl,
  },
  spinButton: {
    width: "100%",
  },
  prizesGrid: {
    width: "100%",
    alignItems: "center",
  },
  prizesTitle: {
    marginBottom: Spacing.md,
  },
  prizesList: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: Spacing.sm,
  },
  prizeItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
  },
  prizeColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
});
