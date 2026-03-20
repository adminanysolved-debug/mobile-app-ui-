import React, { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView, Pressable, ActivityIndicator, RefreshControl, Modal, Alert, TextInput } from "react-native";
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
import { Spacing, BorderRadius, SCROLL_BOTTOM_EXTRA } from "@/constants/theme";
import { getApiUrl } from "@/lib/query-client";

type MarketItem = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  price: number;
  imageUrl: string | null;
  userId: string;
  isActive: boolean;
  howToAchieve: string | null;
};

const categoryGradients: { [key: string]: [string, string] } = {
  Badges: ["#EAB308", "#F59E0B"],
  Customization: ["#8B5CF6", "#A855F7"],
  Boosters: ["#22C55E", "#10B981"],
  Themes: ["#EC4899", "#F472B6"],
  Stickers: ["#3B82F6", "#60A5FA"],
  Dream: ["#F97316", "#FB923C"],
};

const categoryIcons: { [key: string]: keyof typeof Feather.glyphMap } = {
  Badges: "award",
  Customization: "user",
  Boosters: "zap",
  Themes: "layers",
  Stickers: "star",
  Dream: "target",
};

const categories = ["All", "Dream", "Badges", "Customization", "Boosters", "Themes", "Stickers"];

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
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [purchaseHistory, setPurchaseHistory] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

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

  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [selectedDreamType, setSelectedDreamType] = useState<"personal" | "group">("personal");
  const [chatableUsers, setChatableUsers] = useState<any[]>([]);
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  useEffect(() => {
    if (purchaseModalVisible && selectedDreamType === "group" && chatableUsers.length === 0) {
      fetchChatableUsers();
    }
  }, [purchaseModalVisible, selectedDreamType]);

  const fetchChatableUsers = async () => {
    if (!token) return;
    setIsLoadingUsers(true);
    try {
      const response = await fetch(new URL('/api/connections', getApiUrl()).toString(), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        const followers = Array.isArray(data.followers) ? data.followers : [];
        const following = Array.isArray(data.following) ? data.following : [];
        const combined = [...followers, ...following];
        const unique = Array.from(new Map(combined.map(u => [u.id, u])).values());
        setChatableUsers(unique);
      }
    } catch (error) {
      console.error("Failed to fetch friends:", error);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const resetForm = () => {
    setPurchaseModalVisible(false);
    setSelectedItem(null);
    setCardNumber("4242 4242 4242 4242");
    setExpiry("12/28");
    setCvc("123");
    setSelectedDreamType("personal");
    setSelectedFriends([]);
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

  const formatCardNumber = (text: string) => {
    const cleaned = text.replace(/\s+/g, "");
    const formatted = cleaned.match(/.{1,4}/g)?.join(" ") || cleaned;
    setCardNumber(formatted.substring(0, 19));
  };

  const formatExpiry = (text: string) => {
    const cleaned = text.replace(/\//g, "");
    if (cleaned.length >= 2) {
      setExpiry(`${cleaned.substring(0, 2)}/${cleaned.substring(2, 4)}`);
    } else {
      setExpiry(cleaned);
    }
  };

  const confirmPurchase = async () => {
    if (!selectedItem || !token) return;

    if (selectedItem.category === "Dream" && selectedDreamType === "group" && selectedFriends.length === 0) {
       Alert.alert("Invite Friends", "Please select at least one friend for your Team Dream.");
       return;
    }

    setIsPurchasing(true);
    try {
      const response = await fetch(
        new URL(`/api/market/purchase/${selectedItem.id}`, getApiUrl()).toString(),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
             dreamType: selectedDreamType,
             invitedUserIds: selectedDreamType === "group" ? selectedFriends : undefined
          })
        }
      );

      const data = await response.json();

      if (response.ok) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        const successMsg = selectedItem.category === "Dream" 
          ? `Purchased! This dream has been added to your MyRealDreams list with full achievement steps.`
          : `You purchased ${selectedItem.title}!`;
        Alert.alert("Success", successMsg);
        resetForm();
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

  const handleOpenHistory = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsLoadingHistory(true);
    try {
      const response = await fetch(new URL('/api/market/history', getApiUrl()).toString(), {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        setPurchaseHistory(await response.json());
        setShowHistoryModal(true);
      }
    } catch (error) {
      console.error("Failed to load history", error);
    } finally {
      setIsLoadingHistory(false);
    }
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
            paddingTop: insets.top + Spacing.xl,
            paddingBottom: insets.bottom + SCROLL_BOTTOM_EXTRA,
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
            <View style={{ flex: 1, alignItems: "flex-end" }}>
              <Pressable
                onPress={handleOpenHistory}
                style={{ padding: Spacing.sm, backgroundColor: theme.backgroundSecondary, borderRadius: BorderRadius.md }}
              >
                {isLoadingHistory ? (
                  <ActivityIndicator size="small" color={theme.link} />
                ) : (
                  <Feather name="clock" size={20} color={theme.textSecondary} />
                )}
              </Pressable>
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
                    style={{ color: theme.textSecondary, marginBottom: 4 }}
                  >
                    {item.category || "Item"}
                  </ThemedText>
                  {item.description ? (
                    <ThemedText 
                       type="xs" 
                       style={{ color: theme.textMuted, textAlign: 'center', marginBottom: Spacing.sm }} 
                       numberOfLines={2}
                    >
                       {item.description}
                    </ThemedText>
                  ) : null}
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
          <View style={[styles.modalContent, { backgroundColor: theme.backgroundSecondary }]}>
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
                  <Feather name="star" size={20} color={theme.yellow} />
                  <ThemedText type="h2" style={{ color: theme.yellow }}>
                    {selectedItem.price || 0}
                  </ThemedText>
                </View>

                {selectedItem.category === "Dream" && (
                  <View style={{ width: '100%', marginTop: Spacing.md }}>
                    <ThemedText type="small" style={styles.label}>SELECT DREAM TYPE</ThemedText>
                    <View style={styles.typeRow}>
                       <Pressable 
                          onPress={() => setSelectedDreamType("personal")}
                          style={[styles.typeButton, selectedDreamType === "personal" && { backgroundColor: theme.accent }]}
                       >
                          <Feather name="user" size={16} color={selectedDreamType === "personal" ? "#FFF" : theme.textSecondary} />
                          <ThemedText type="xs" style={[styles.typeButtonText, selectedDreamType === "personal" && { color: "#FFF" }]}>Personal</ThemedText>
                       </Pressable>
                       <Pressable 
                          onPress={() => setSelectedDreamType("group")}
                          style={[styles.typeButton, selectedDreamType === "group" && { backgroundColor: theme.yellow }]}
                       >
                          <Feather name="users" size={16} color={selectedDreamType === "group" ? "#FFF" : theme.textSecondary} />
                          <ThemedText type="xs" style={[styles.typeButtonText, selectedDreamType === "group" && { color: "#FFF" }]}>Team</ThemedText>
                       </Pressable>
                    </View>

                    {selectedDreamType === "group" && (
                       <View style={{ marginTop: Spacing.md }}>
                          <View style={styles.labelRow}>
                             <ThemedText type="small" style={styles.label}>INVITE FRIENDS</ThemedText>
                             <ThemedText type="xs" style={styles.charCount}>{selectedFriends.length} selected</ThemedText>
                          </View>
                          {isLoadingUsers ? (
                             <ActivityIndicator color={theme.accent} style={{ marginVertical: 10 }} />
                          ) : chatableUsers.length === 0 ? (
                             <ThemedText type="xs" style={{ color: theme.textMuted, fontStyle: 'italic' }}>No connections yet.</ThemedText>
                          ) : (
                             <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: Spacing.sm, paddingVertical: 4 }}>
                                {chatableUsers.map(u => {
                                   const isSelected = selectedFriends.includes(u.id);
                                   return (
                                      <Pressable 
                                         key={u.id}
                                         onPress={() => {
                                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                            setSelectedFriends(prev => isSelected ? prev.filter(id => id !== u.id) : [...prev, u.id]);
                                         }}
                                         style={[styles.friendChip, isSelected && { backgroundColor: theme.yellow + '20', borderColor: theme.yellow }]}
                                      >
                                         <ThemedText type="xs" style={{ color: isSelected ? theme.yellow : theme.textSecondary }}>{u.username}</ThemedText>
                                         {isSelected && <Feather name="check" size={10} color={theme.yellow} />}
                                      </Pressable>
                                   );
                                })}
                             </ScrollView>
                          )}
                       </View>
                    )}
                  </View>
                )}

                {/* Dummy Credit Card Form */}
                <View style={[styles.cardForm, { backgroundColor: theme.background, borderColor: theme.border }]}>
                  <ThemedText type="small" style={{ color: theme.textSecondary, marginBottom: Spacing.xs }}>Card Number</ThemedText>
                  <TextInput
                    style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundSecondary }]}
                    placeholder="0000 0000 0000 0000"
                    placeholderTextColor={theme.textMuted}
                    keyboardType="numeric"
                    value={cardNumber}
                    onChangeText={formatCardNumber}
                    maxLength={19}
                  />
                  <View style={{ flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.sm }}>
                    <View style={{ flex: 1 }}>
                      <ThemedText type="small" style={{ color: theme.textSecondary, marginBottom: Spacing.xs }}>Expiry</ThemedText>
                      <TextInput
                        style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundSecondary }]}
                        placeholder="MM/YY"
                        placeholderTextColor={theme.textMuted}
                        keyboardType="numeric"
                        value={expiry}
                        onChangeText={formatExpiry}
                        maxLength={5}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <ThemedText type="small" style={{ color: theme.textSecondary, marginBottom: Spacing.xs }}>CVC</ThemedText>
                      <TextInput
                        style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundSecondary }]}
                        placeholder="123"
                        placeholderTextColor={theme.textMuted}
                        keyboardType="numeric"
                        value={cvc}
                        onChangeText={setCvc}
                        maxLength={3}
                        secureTextEntry
                      />
                    </View>
                  </View>
                </View>

                <View style={styles.modalButtons}>
                  <Pressable
                    style={[styles.modalButton, styles.cancelButton]}
                    onPress={resetForm}
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

      {/* History Modal */}
      <Modal
        visible={showHistoryModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowHistoryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.backgroundSecondary, maxHeight: '80%' }]}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", width: "100%", marginBottom: Spacing.lg }}>
              <ThemedText type="h3">Purchase History</ThemedText>
              <Pressable onPress={() => setShowHistoryModal(false)} hitSlop={12}>
                <Feather name="x" size={24} color={theme.textSecondary} />
              </Pressable>
            </View>

            <ScrollView style={{ width: "100%" }} showsVerticalScrollIndicator={false}>
              {purchaseHistory.length === 0 ? (
                <View style={{ paddingVertical: Spacing.xl, alignItems: "center" }}>
                  <ThemedText type="body" style={{ color: theme.textMuted }}>No purchases yet.</ThemedText>
                </View>
              ) : (
                purchaseHistory.map((txn, index) => (
                  <View
                    key={txn.id || index}
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                      backgroundColor: theme.backgroundSecondary,
                      padding: Spacing.md,
                      borderRadius: BorderRadius.sm,
                      marginBottom: Spacing.sm
                    }}
                  >
                    <View>
                      <ThemedText type="body" style={{ fontWeight: "600" }}>Market Item Purchase</ThemedText>
                      <ThemedText type="xs" style={{ color: theme.textSecondary }}>{formatDateOnly(txn.createdAt)}</ThemedText>
                    </View>
                    <ThemedText type="body" style={{ color: theme.yellow, fontWeight: "700" }}>
                      -{txn.amount} pts
                    </ThemedText>
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </GalaxyBackground>
  );
}

function formatDateOnly(dateString: string) {
  if (!dateString) return "Unknown Date";
  return new Date(dateString).toLocaleDateString();
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
  label: {
    fontWeight: "600",
    color: "#A78BFA",
    marginBottom: 8,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  charCount: {
    color: "#8B7FC7",
  },
  typeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    backgroundColor: "transparent",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  typeButtonText: {
    fontWeight: "bold",
    color: "#8B7FC7",
    fontSize: 12,
  },
  friendChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(255,255,255,0.05)",
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
    width: 64,
    height: 64,
    borderRadius: BorderRadius.xl,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
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
  cardForm: {
    width: "100%",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.xl,
  },
  input: {
    height: 44,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm,
    fontSize: 14,
  }
});
