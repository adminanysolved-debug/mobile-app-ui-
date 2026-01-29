import { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView, Pressable, Modal, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";

import { ThemedText } from "@/components/ThemedText";
import { GalaxyBackground } from "@/components/GalaxyBackground";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { AdBanner } from "@/components/AdBanner";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/context/AuthContext";
import { Spacing, BorderRadius } from "@/constants/theme";
import { getApiUrl } from "@/lib/query-client";

type SubscriptionTier = "free" | "bronze" | "silver" | "gold" | "platinum";

type SubscriptionPackage = {
  id: SubscriptionTier;
  name: string;
  colors: [string, string];
  price: number;
  period: string;
  features: string[];
  iconName: keyof typeof Feather.glyphMap;
};

const packages: SubscriptionPackage[] = [
  {
    id: "bronze",
    name: "BRONZE",
    colors: ["#EA580C", "#FB923C"],
    price: 4.99,
    period: "/month",
    features: ["Basic dream tracking", "5 active dreams", "Community access"],
    iconName: "award",
  },
  {
    id: "silver",
    name: "SILVER",
    colors: ["#6B7280", "#9CA3AF"],
    price: 9.99,
    period: "/month",
    features: ["Everything in Bronze", "15 active dreams", "Priority support", "Advanced analytics"],
    iconName: "star",
  },
  {
    id: "gold",
    name: "GOLD",
    colors: ["#EAB308", "#FCD34D"],
    price: 19.99,
    period: "/month",
    features: ["Everything in Silver", "Unlimited dreams", "Premium themes", "Ad-free experience"],
    iconName: "zap",
  },
  {
    id: "platinum",
    name: "PLATINUM",
    colors: ["#8B5CF6", "#A855F7"],
    price: 29.99,
    period: "/month",
    features: ["Everything in Gold", "Personal coach", "Exclusive events", "VIP badge"],
    iconName: "diamond" as any,
  },
];

export default function SubscriptionScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();
  const { token, user, refreshUser } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionTier | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [confirmPackage, setConfirmPackage] = useState<SubscriptionPackage | null>(null);

  const currentTier = user?.subscriptionTier || "free";

  const handleSelectPlan = (pkg: SubscriptionPackage) => {
    if (pkg.id === currentTier) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setConfirmPackage(pkg);
    setModalVisible(true);
  };

  const handleConfirmSubscription = async () => {
    if (!confirmPackage || !token) return;
    setIsLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    try {
      const response = await fetch(new URL('/api/subscription', getApiUrl()).toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          tier: confirmPackage.id,
        }),
      });

      if (response.ok) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setSelectedPlan(confirmPackage.id);
        if (refreshUser) {
          refreshUser();
        }
        setModalVisible(false);
      } else {
        const data = await response.json();
        alert(data.error || "Failed to subscribe");
      }
    } catch (error) {
      alert("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setConfirmPackage(null);
  };

  return (
    <GalaxyBackground>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: headerHeight + Spacing.xl,
            paddingBottom: insets.bottom + Spacing.xl,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.springify()}>
          <ThemedText type="h2" style={styles.title}>Choose Your Plan</ThemedText>
          <ThemedText type="body" style={[styles.subtitle, { color: theme.textSecondary }]}>
            Unlock premium features and achieve your dreams faster
          </ThemedText>
        </Animated.View>

        {currentTier !== "free" ? (
          <Animated.View entering={FadeInDown.delay(50).springify()}>
            <Card style={{ ...styles.currentPlanCard, backgroundColor: theme.backgroundSecondary }}>
              <Feather name="check-circle" size={24} color={theme.green} />
              <View style={styles.currentPlanInfo}>
                <ThemedText type="bodyMedium">Current Plan</ThemedText>
                <ThemedText type="h3" style={{ color: theme.link }}>
                  {currentTier.toUpperCase()}
                </ThemedText>
              </View>
            </Card>
          </Animated.View>
        ) : null}

        {packages.map((pkg, index) => (
          <Animated.View key={pkg.id} entering={FadeInDown.delay(100 + index * 50).springify()}>
            <Pressable onPress={() => handleSelectPlan(pkg)}>
              <Card
                style={{
                  ...styles.packageCard,
                  ...(currentTier === pkg.id ? { borderWidth: 2, borderColor: theme.link } : {}),
                }}
              >
                <View style={styles.packageHeader}>
                  <LinearGradient
                    colors={pkg.colors}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.packageIcon}
                  >
                    <Feather name={pkg.iconName} size={28} color="#FFFFFF" />
                  </LinearGradient>
                  <View style={styles.packageInfo}>
                    <ThemedText type="h3">{pkg.name}</ThemedText>
                    <View style={styles.priceRow}>
                      <ThemedText type="h2" style={{ color: theme.link }}>
                        ${pkg.price.toFixed(2)}
                      </ThemedText>
                      <ThemedText type="body" style={{ color: theme.textSecondary }}>
                        {pkg.period}
                      </ThemedText>
                    </View>
                  </View>
                  {currentTier === pkg.id ? (
                    <View style={[styles.currentBadge, { backgroundColor: theme.green }]}>
                      <ThemedText style={styles.currentBadgeText}>Current</ThemedText>
                    </View>
                  ) : null}
                </View>

                <View style={styles.featuresContainer}>
                  {pkg.features.map((feature, fIndex) => (
                    <View key={fIndex} style={styles.featureRow}>
                      <Feather name="check" size={18} color={theme.green} />
                      <ThemedText type="body" style={{ color: theme.text, flex: 1 }}>
                        {feature}
                      </ThemedText>
                    </View>
                  ))}
                </View>

                {currentTier !== pkg.id ? (
                  <Button
                    onPress={() => handleSelectPlan(pkg)}
                    style={styles.selectButton}
                    variant="primary"
                  >
                    Choose Plan
                  </Button>
                ) : null}
              </Card>
            </Pressable>
          </Animated.View>
        ))}

        <AdBanner variant="compact" />
      </ScrollView>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalOverlay}>
          {confirmPackage ? (
            <Animated.View
              entering={FadeIn}
              style={[styles.modalContent, { backgroundColor: theme.backgroundDefault }]}
            >
              <LinearGradient
                colors={confirmPackage.colors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.modalHeader}
              >
                <Feather name={confirmPackage.iconName} size={48} color="#FFFFFF" />
                <ThemedText style={styles.modalPlanName}>{confirmPackage.name}</ThemedText>
              </LinearGradient>

              <View style={styles.modalBody}>
                <ThemedText type="h3" style={styles.confirmTitle}>
                  Confirm Subscription
                </ThemedText>
                <ThemedText type="body" style={[styles.confirmText, { color: theme.textSecondary }]}>
                  Subscribe to {confirmPackage.name} for ${confirmPackage.price.toFixed(2)}/month?
                </ThemedText>

                <View style={styles.modalButtons}>
                  <Button
                    onPress={handleCloseModal}
                    variant="secondary"
                    style={styles.modalButton}
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                  <Button
                    onPress={handleConfirmSubscription}
                    style={styles.modalButton}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      "Subscribe"
                    )}
                  </Button>
                </View>
              </View>
            </Animated.View>
          ) : null}
        </View>
      </Modal>
    </GalaxyBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.lg,
  },
  title: {
    textAlign: "center",
    marginBottom: Spacing.xs,
  },
  subtitle: {
    textAlign: "center",
    marginBottom: Spacing.md,
  },
  currentPlanCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  currentPlanInfo: {
    flex: 1,
  },
  packageCard: {
    padding: Spacing.lg,
  },
  packageHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  packageIcon: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.lg,
  },
  packageInfo: {
    flex: 1,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: Spacing.xs,
  },
  currentBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  currentBadgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  featuresContainer: {
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  selectButton: {
    marginTop: Spacing.sm,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.xl,
  },
  modalContent: {
    width: "100%",
    borderRadius: BorderRadius.md,
    overflow: "hidden",
  },
  modalHeader: {
    alignItems: "center",
    paddingVertical: Spacing["3xl"],
  },
  modalPlanName: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "700",
    marginTop: Spacing.md,
  },
  modalBody: {
    padding: Spacing.xl,
  },
  confirmTitle: {
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  confirmText: {
    textAlign: "center",
    marginBottom: Spacing.xl,
  },
  modalButtons: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  modalButton: {
    flex: 1,
  },
});
