import { useState } from "react";
import { View, StyleSheet, ScrollView, Pressable, Modal } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { themes, ThemeType } from "@/constants/theme";
import { Spacing, BorderRadius } from "@/constants/theme";

function ThemeCard({
  themeData,
  isSelected,
  isPurchased,
  onSelect,
  onPurchase,
  index,
}: {
  themeData: ThemeType;
  isSelected: boolean;
  isPurchased: boolean;
  onSelect: () => void;
  onPurchase: () => void;
  index: number;
}) {
  const { theme } = useTheme();
  const isLocked = themeData.isPremium && !isPurchased;

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 60).springify()}
      style={styles.themeCardWrapper}
    >
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          if (isLocked) {
            onPurchase();
          } else {
            onSelect();
          }
        }}
        style={[
          styles.themeCard,
          { backgroundColor: themeData.colors.backgroundDefault },
          isSelected ? { borderColor: theme.accent, borderWidth: 3 } : null,
        ]}
      >
        <LinearGradient
          colors={themeData.colors.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientPreview}
        />

        <View style={styles.themeInfo}>
          <ThemedText
            type="body"
            style={[styles.themeName, { color: themeData.colors.text }]}
          >
            {themeData.name}
          </ThemedText>

          {themeData.isPremium ? (
            isPurchased ? (
              <View style={[styles.ownedBadge, { backgroundColor: theme.success + "20" }]}>
                <Feather name="check" size={12} color={theme.success} />
                <ThemedText type="xs" style={{ color: theme.success, marginLeft: 4 }}>
                  Owned
                </ThemedText>
              </View>
            ) : (
              <View style={[styles.priceBadge, { backgroundColor: theme.accent + "20" }]}>
                <Feather name="lock" size={12} color={theme.accent} />
                <ThemedText type="xs" style={{ color: theme.accent, marginLeft: 4 }}>
                  {themeData.price} points
                </ThemedText>
              </View>
            )
          ) : (
            <View style={[styles.freeBadge, { backgroundColor: theme.success + "20" }]}>
              <ThemedText type="xs" style={{ color: theme.success }}>
                Free
              </ThemedText>
            </View>
          )}
        </View>

        {isSelected ? (
          <View style={[styles.selectedIndicator, { backgroundColor: theme.accent }]}>
            <Feather name="check" size={16} color="#FFFFFF" />
          </View>
        ) : null}

        {isLocked ? (
          <View style={styles.lockOverlay}>
            <Feather name="lock" size={24} color="#FFFFFF" />
          </View>
        ) : null}
      </Pressable>
    </Animated.View>
  );
}

export default function ThemeScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme, currentTheme, setThemeById, purchasedThemes, purchaseTheme, userCoins } =
    useTheme();
  const [purchaseModalVisible, setPurchaseModalVisible] = useState(false);
  const [selectedPurchaseTheme, setSelectedPurchaseTheme] = useState<ThemeType | null>(
    null
  );

  const freeThemes = themes.filter((t) => !t.isPremium);
  const premiumThemes = themes.filter((t) => t.isPremium);

  const handleSelectTheme = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setThemeById(id);
  };

  const handleOpenPurchase = (themeData: ThemeType) => {
    setSelectedPurchaseTheme(themeData);
    setPurchaseModalVisible(true);
  };

  const handleConfirmPurchase = () => {
    if (selectedPurchaseTheme) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      purchaseTheme(selectedPurchaseTheme.id);
      setPurchaseModalVisible(false);
      setSelectedPurchaseTheme(null);
    }
  };

  const canAfford = selectedPurchaseTheme
    ? userCoins >= (selectedPurchaseTheme.price || 0)
    : false;

  return (
    <ThemedView style={styles.container}>
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
          <View style={styles.balanceCard}>
            <View style={[styles.coinIcon, { backgroundColor: theme.yellow + "20" }]}>
              <Feather name="star" size={24} color={theme.yellow} />
            </View>
            <View>
              <ThemedText type="small" style={{ color: "#C4B5FD" }}>
                Your Balance
              </ThemedText>
              <ThemedText type="h3">{userCoins.toLocaleString()} points</ThemedText>
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(100).springify()}>
          <ThemedText type="body" style={styles.sectionTitle}>
            Free Themes
          </ThemedText>
          <View style={styles.themesGrid}>
            {freeThemes.map((t, index) => (
              <ThemeCard
                key={t.id}
                themeData={t}
                isSelected={currentTheme.id === t.id}
                isPurchased={purchasedThemes.includes(t.id)}
                onSelect={() => handleSelectTheme(t.id)}
                onPurchase={() => {}}
                index={index}
              />
            ))}
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).springify()}>
          <ThemedText type="body" style={styles.sectionTitle}>
            Premium Themes
          </ThemedText>
          <ThemedText
            type="small"
            style={[styles.sectionSubtitle, { color: "#C4B5FD" }]}
          >
            Unlock beautiful themes with your points
          </ThemedText>
          <View style={styles.themesGrid}>
            {premiumThemes.map((t, index) => (
              <ThemeCard
                key={t.id}
                themeData={t}
                isSelected={currentTheme.id === t.id}
                isPurchased={purchasedThemes.includes(t.id)}
                onSelect={() => handleSelectTheme(t.id)}
                onPurchase={() => handleOpenPurchase(t)}
                index={index + 2}
              />
            ))}
          </View>
        </Animated.View>
      </ScrollView>

      <Modal
        visible={purchaseModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPurchaseModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Animated.View
            entering={FadeIn}
            style={[styles.modalContent, { backgroundColor: theme.backgroundDefault }]}
          >
            {selectedPurchaseTheme ? (
              <>
                <LinearGradient
                  colors={selectedPurchaseTheme.colors.gradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.modalGradient}
                />

                <ThemedText type="h3" style={styles.modalTitle}>
                  Unlock {selectedPurchaseTheme.name}
                </ThemedText>

                <ThemedText
                  type="body"
                  style={[styles.modalPrice, { color: "#C4B5FD" }]}
                >
                  Price: {selectedPurchaseTheme.price} points
                </ThemedText>

                <ThemedText
                  type="small"
                  style={[
                    styles.modalBalance,
                    { color: canAfford ? theme.success : theme.error },
                  ]}
                >
                  Your balance: {userCoins} points
                </ThemedText>

                <View style={styles.modalButtons}>
                  <Button
                    variant="outline"
                    onPress={() => setPurchaseModalVisible(false)}
                    style={styles.modalButton}
                  >
                    Cancel
                  </Button>
                  <Button
                    onPress={handleConfirmPurchase}
                    disabled={!canAfford}
                    style={styles.modalButton}
                  >
                    {canAfford ? "Purchase" : "Not Enough Points"}
                  </Button>
                </View>
              </>
            ) : null}
          </Animated.View>
        </View>
      </Modal>
    </ThemedView>
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
    gap: Spacing.xl,
  },
  balanceCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    padding: Spacing.lg,
  },
  coinIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitle: {
    fontWeight: "600",
    marginBottom: Spacing.xs,
  },
  sectionSubtitle: {
    marginBottom: Spacing.md,
  },
  themesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
  },
  themeCardWrapper: {
    width: "47%",
  },
  themeCard: {
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "transparent",
  },
  gradientPreview: {
    height: 80,
  },
  themeInfo: {
    padding: Spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  themeName: {
    fontWeight: "600",
    flex: 1,
  },
  freeBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  priceBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  ownedBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  selectedIndicator: {
    position: "absolute",
    top: Spacing.sm,
    right: Spacing.sm,
    width: 28,
    height: 28,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
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
    borderRadius: BorderRadius.xl,
    overflow: "hidden",
  },
  modalGradient: {
    height: 100,
  },
  modalTitle: {
    textAlign: "center",
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  modalPrice: {
    textAlign: "center",
    marginBottom: Spacing.xs,
  },
  modalBalance: {
    textAlign: "center",
    marginBottom: Spacing.xl,
  },
  modalButtons: {
    flexDirection: "row",
    gap: Spacing.md,
    padding: Spacing.lg,
  },
  modalButton: {
    flex: 1,
  },
});
