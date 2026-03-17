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
import { useSafeBottomPadding } from "@/hooks/useSafeBottomPadding";

type SubscriptionTier = "free" | "bronze" | "silver" | "gold" | "platinum" | "basic" | "pro" | "enterprise";

type SubscriptionPackage = {
  id: SubscriptionTier;
  name: string;
  colors: [string, string];
  price: number;
  period: string;
  features: string[];
  iconName: keyof typeof Feather.glyphMap;
};

const userPackages: SubscriptionPackage[] = [
  {
    id: "silver",
    name: "SILVER",
    colors: ["#6B7280", "#9CA3AF"],
    price: 0,
    period: "/year",
    features: ["10 Personal Dreams", "1 Team Dream", "3 Challenge Dreams", "Standard Support"],
    iconName: "star",
  },
  {
    id: "gold",
    name: "GOLD",
    colors: ["#EAB308", "#FCD34D"],
    price: 3.99,
    period: "/year",
    features: ["14 Personal Dreams", "3 Team Dreams", "5 Challenge Dreams", "Ad-Free Experience", "Premium Themes"],
    iconName: "zap",
  },
  {
    id: "platinum",
    name: "PLATINUM",
    colors: ["#8B5CF6", "#A855F7"],
    price: 5.99,
    period: "/year",
    features: ["20 Personal Dreams", "5 Team Dreams", "10 Challenge Dreams", "Priority Support", "All Themes Unlocked"],
    iconName: "diamond" as any,
  },
];

const vendorPackages: SubscriptionPackage[] = [
  {
    id: "basic",
    name: "BASIC VENDOR",
    colors: ["#EA580C", "#FB923C"],
    price: 9.99,
    period: "/year",
    features: ["Max 3 Marketplace Dreams", "20% Sales Commission", "Standard Vendor Dashboard"],
    iconName: "shopping-bag" as any,
  },
  {
    id: "pro",
    name: "PRO VENDOR",
    colors: ["#10B981", "#34D399"],
    price: 19.99,
    period: "/year",
    features: ["Max 8 Marketplace Dreams", "15% Sales Commission", "Advanced Analytics", "Featured Listings"],
    iconName: "briefcase" as any,
  },
  {
    id: "enterprise",
    name: "ENTERPRISE VENDOR",
    colors: ["#3B82F6", "#60A5FA"],
    price: 29.99,
    period: "/year",
    features: ["Max 15 Marketplace Dreams", "10% Sales Commission", "VIP Vendor Status", "Custom Support"],
    iconName: "globe" as any,
  },
];

export default function SubscriptionScreen() {
  const bottomPadding = useSafeBottomPadding();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();
  const { token, user, refreshUser } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionTier | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [confirmPackage, setConfirmPackage] = useState<SubscriptionPackage | null>(null);

  const currentTier = user?.subscriptionTier || "silver";
  const [activeTab, setActiveTab] = useState<"user" | "vendor">("user");

  const packages = activeTab === "user" ? userPackages : vendorPackages;

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
      const response = await fetch(new URL('/api/subscriptions/upgrade', getApiUrl()).toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          tier: confirmPackage.id,
          type: activeTab,
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
            paddingTop: insets.top + Spacing.xl,
            paddingBottom: bottomPadding,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.springify()}>
          <ThemedText type="h2" style={styles.title}>RealDream Plans</ThemedText>
          <ThemedText type="body" style={[styles.subtitle, { color: theme.textSecondary }]}>
            Choose a plan that fits your ambition
          </ThemedText>
        </Animated.View>

        <View style={styles.tabsContainer}>
          <Pressable
            onPress={() => { setActiveTab("user"); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
            style={[styles.tab, activeTab === "user" && { backgroundColor: theme.link }]}
          >
            <ThemedText style={[styles.tabText, activeTab === "user" && { color: "#FFF" }]}>User Plans</ThemedText>
          </Pressable>
          <Pressable
            onPress={() => { setActiveTab("vendor"); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
            style={[styles.tab, activeTab === "vendor" && { backgroundColor: theme.link }]}
          >
            <ThemedText style={[styles.tabText, activeTab === "vendor" && { color: "#FFF" }]}>Vendor Plans</ThemedText>
          </Pressable>
        </View>

        <View style={styles.introOfferBox}>
          <Feather name="gift" size={20} color={theme.link} />
          <ThemedText type="bodyMedium" style={{ color: theme.link }}>
            Introductory Offer: First 6 Months FREE
          </ThemedText>
        </View>

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
                        GBP {pkg.price.toFixed(2)}
                      </ThemedText>
                      <ThemedText type="body" style={{ color: theme.textSecondary }}>
                        {pkg.period}
                      </ThemedText>
                    </View>
                    <ThemedText type="xs" style={{ color: theme.green, fontWeight: '700' }}>
                      6 MONTHS FREE STARTING NOW
                    </ThemedText>
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
                  Subscribe to {confirmPackage.name}? The first 6 months are free, then GBP {confirmPackage.price.toFixed(2)}/year will apply.
                </ThemedText>

                <View style={styles.dummyCardInfo}>
                   <ThemedText type="xs" style={{ color: theme.textSecondary }}>Using dummy card 4242 ... 123 for verification</ThemedText>
                </View>

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
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: BorderRadius.md,
    padding: 4,
    marginBottom: Spacing.sm,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
  },
  tabText: {
    fontWeight: '600',
  },
  introOfferBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  dummyCardInfo: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.lg,
    alignItems: 'center',
  }
});
