import { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView, Pressable, ActivityIndicator, RefreshControl, Modal, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";

import { ThemedText } from "@/components/ThemedText";
import { GalaxyBackground } from "@/components/GalaxyBackground";
import { Card } from "@/components/Card";
import { AdBanner } from "@/components/AdBanner";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/context/AuthContext";
import { Spacing, BorderRadius } from "@/constants/theme";
import { getApiUrl } from "@/lib/query-client";

type MarketItem = {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  price: number | null;
  imageUrl: string | null;
  userId: string;
  isActive: boolean;
};

const categoryGradients: { [key: string]: [string, string] } = {
  Badges: ["#EAB308", "#F59E0B"],
  Customization: ["#8B5CF6", "#A855F7"],
  Boosters: ["#22C55E", "#10B981"],
  Themes: ["#EC4899", "#F472B6"],
  Stickers: ["#3B82F6", "#60A5FA"],
};

const categoryIcons: { [key: string]: keyof typeof Feather.glyphMap } = {
  Badges: "award",
  Customization: "user",
  Boosters: "zap",
  Themes: "layers",
  Stickers: "star",
};

const categories = ["All", "Badges", "Customization", "Boosters", "Themes", "Stickers"];

export default function MarketScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();
  const { user, token } = useAuth();
  const [marketItems, setMarketItems] = useState<MarketItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [purchaseModalVisible, setPurchaseModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MarketItem | null>(null);
  const [isPurchasing, setIsPurchasing] = useState(false);

  const fetchMarketItems = async () => {
    try {
      const categoryParam = selectedCategory !== "All" ? `?category=${selectedCategory}` : "";
      const response = await fetch(new URL(`/api/market${categoryParam}`, getApiUrl()).toString());
      if (response.ok) {
        const data = await response.json();
        setMarketItems(data);
      }
    } catch (error) {
      console.error("Failed to fetch market items:", error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMarketItems();
  }, [selectedCategory]);

  const handleCategorySelect = (category: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedCategory(category);
  };

  const handlePurchase = (item: MarketItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedItem(item);
    setPurchaseModalVisible(true);
  };

  const confirmPurchase = async () => {
    if (!selectedItem || !token) return;
    
    setIsPurchasing(true);
    try {
      const response = await fetch(
        new URL(`/api/market/${selectedItem.id}/purchase`, getApiUrl()).toString(),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();
      
      if (response.ok) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert("Success", `You purchased ${selectedItem.title}!`);
        setPurchaseModalVisible(false);
        setSelectedItem(null);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert("Error", data.error || "Failed to purchase item");
      }
    } catch (error) {
      console.error("Purchase failed:", error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Error", "Failed to complete purchase");
    } finally {
      setIsPurchasing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchMarketItems();
  };

  const filteredItems = selectedCategory === "All" 
    ? marketItems 
    : marketItems.filter(item => item.category === selectedCategory);

  const getGradient = (category: string | null): [string, string] => {
    return categoryGradients[category || "Badges"] || ["#6B7280", "#9CA3AF"];
  };

  const getIcon = (category: string | null): keyof typeof Feather.glyphMap => {
    return categoryIcons[category || "Badges"] || "package";
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
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Animated.View entering={FadeInDown.springify()}>
          <View style={styles.balanceCard}>
            <View style={[styles.coinIcon, { backgroundColor: theme.yellow + "20" }]}>
              <Feather name="star" size={24} color={theme.yellow} />
            </View>
            <View>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                Available Balance
              </ThemedText>
              <ThemedText type="h3">{(user?.coins || 0).toLocaleString()} points</ThemedText>
            </View>
          </View>
        </Animated.View>

        <AdBanner />

        <Animated.View entering={FadeInDown.delay(100).springify()}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesContainer}
          >
            {categories.map((category) => (
              <Pressable
                key={category}
                onPress={() => handleCategorySelect(category)}
                style={[
                  styles.categoryPill,
                  selectedCategory === category
                    ? { backgroundColor: theme.accent }
                    : { backgroundColor: theme.backgroundSecondary },
                ]}
              >
                <ThemedText
                  type="small"
                  style={[
                    styles.categoryText,
                    selectedCategory === category ? { color: theme.text } : { color: theme.text },
                  ]}
                >
                  {category}
                </ThemedText>
              </Pressable>
            ))}
          </ScrollView>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).springify()}>
          <ThemedText
            type="xs"
            style={[styles.sectionLabel, { color: theme.textSecondary }]}
          >
            FEATURED ITEMS
          </ThemedText>
        </Animated.View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.link} />
          </View>
        ) : filteredItems.length > 0 ? (
          <View style={styles.itemsGrid}>
            {filteredItems.map((item, index) => (
              <Animated.View
                key={item.id}
                entering={FadeInDown.delay(200 + index * 50).springify()}
                style={styles.itemWrapper}
              >
                <Card onPress={() => handlePurchase(item)} style={styles.itemCard}>
                  <LinearGradient
                    colors={getGradient(item.category)}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.itemIcon}
                  >
                    <Feather name={getIcon(item.category)} size={28} color="#FFFFFF" />
                  </LinearGradient>
                  <ThemedText type="body" style={styles.itemName} numberOfLines={1}>
                    {item.title}
                  </ThemedText>
                  <ThemedText
                    type="xs"
                    style={{ color: theme.textSecondary, marginBottom: Spacing.sm }}
                  >
                    {item.category || "Item"}
                  </ThemedText>
                  <View style={styles.priceContainer}>
                    <Feather name="dollar-sign" size={14} color={theme.yellow} />
                    <ThemedText type="bodyMedium" style={{ color: theme.yellow }}>
                      {item.price || 0}
                    </ThemedText>
                  </View>
                </Card>
              </Animated.View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyStateContainer}>
            <View style={[styles.emptyIcon, { backgroundColor: theme.accent + "20" }]}>
              <Feather name="inbox" size={40} color={theme.accent} />
            </View>
            <ThemedText type="h3" style={styles.emptyTitle}>
              No items available
            </ThemedText>
            <ThemedText
              type="small"
              style={[styles.emptyDescription, { color: theme.textSecondary }]}
            >
              No items available in this category
            </ThemedText>
          </View>
        )}
      </ScrollView>

      <Modal
        visible={purchaseModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPurchaseModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            {selectedItem ? (
              <>
                <LinearGradient
                  colors={getGradient(selectedItem.category)}
                  style={styles.modalIcon}
                >
                  <Feather
                    name={getIcon(selectedItem.category)}
                    size={32}
                    color="#FFFFFF"
                  />
                </LinearGradient>
                <ThemedText type="h3" style={styles.modalTitle}>
                  {selectedItem.title}
                </ThemedText>
                <ThemedText
                  type="small"
                  style={[styles.modalDescription, { color: theme.textSecondary }]}
                >
                  {selectedItem.description || "No description available"}
                </ThemedText>
                <View style={styles.modalPriceContainer}>
                  <Feather name="dollar-sign" size={20} color={theme.yellow} />
                  <ThemedText type="h2" style={{ color: theme.yellow }}>
                    {selectedItem.price || 0}
                  </ThemedText>
                </View>
                <View style={styles.modalButtons}>
                  <Pressable
                    style={[styles.modalButton, styles.cancelButton]}
                    onPress={() => setPurchaseModalVisible(false)}
                    disabled={isPurchasing}
                  >
                    <ThemedText type="bodyMedium">Cancel</ThemedText>
                  </Pressable>
                  <Pressable
                    style={[styles.modalButton, { backgroundColor: theme.accent }]}
                    onPress={confirmPurchase}
                    disabled={isPurchasing}
                  >
                    {isPurchasing ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <ThemedText type="bodyMedium" style={{ color: "#FFFFFF" }}>
                        Confirm Purchase
                      </ThemedText>
                    )}
                  </Pressable>
                </View>
              </>
            ) : null}
          </View>
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
  categoriesContainer: {
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  categoryPill: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  categoryText: {
    fontWeight: "500",
  },
  sectionLabel: {
    fontWeight: "500",
    letterSpacing: 0.5,
    paddingHorizontal: Spacing.xs,
  },
  loadingContainer: {
    padding: Spacing["3xl"],
    alignItems: "center",
    justifyContent: "center",
  },
  itemsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
  },
  itemWrapper: {
    width: "47%",
  },
  itemCard: {
    alignItems: "center",
    padding: Spacing.lg,
  },
  itemIcon: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  itemName: {
    fontWeight: "600",
    textAlign: "center",
    marginBottom: Spacing.xs,
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  emptyStateContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing["3xl"],
    gap: Spacing.lg,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    fontWeight: "600",
    textAlign: "center",
  },
  emptyDescription: {
    textAlign: "center",
    maxWidth: "80%",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  modalContent: {
    width: "100%",
    maxWidth: 340,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    alignItems: "center",
  },
  modalIcon: {
    width: 72,
    height: 72,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
  },
  modalTitle: {
    fontWeight: "600",
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  modalDescription: {
    textAlign: "center",
    marginBottom: Spacing.lg,
  },
  modalPriceContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: Spacing.xl,
  },
  modalButtons: {
    flexDirection: "row",
    gap: Spacing.md,
    width: "100%",
  },
  modalButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
});
