import React, { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView, TextInput, Alert, ActivityIndicator, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { GalaxyBackground } from "@/components/GalaxyBackground";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/context/AuthContext";
import { getApiUrl } from "@/lib/query-client";
import { Spacing, BorderRadius, SCROLL_BOTTOM_EXTRA } from "@/constants/theme";
import * as Haptics from "expo-haptics";

type MarketItem = {
    id: string;
    title: string;
    price: number;
    category: string;
    isPremium: boolean;
    isActive: boolean;
};

export default function VendorHubScreen() {
    const insets = useSafeAreaInsets();
    const { theme } = useTheme();
    const { token } = useAuth();

    const [items, setItems] = useState<MarketItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);

    // New Item State
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [price, setPrice] = useState("");
    const [category, setCategory] = useState("Themes");
    const [isPremium, setIsPremium] = useState(false);

    useEffect(() => {
        fetchVendorItems();
    }, []);

    const fetchVendorItems = async () => {
        try {
            const response = await fetch(new URL('/api/market', getApiUrl()).toString(), {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                // Assume API returns only user's items, or we filter on client. 
                // Or we should hit a vendor-specific endpoint if available.
                setItems(data);
            }
        } catch (error) {
            console.error("Error fetching items", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleUploadItem = async () => {
        if (!title || !price || isNaN(Number(price))) {
            Alert.alert("Error", "Please fill valid title and price.");
            return;
        }

        setIsUploading(true);
        try {
            const response = await fetch(new URL('/api/market/items', getApiUrl()).toString(), {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    title,
                    description,
                    price: Number(price),
                    category,
                    isPremium,
                    imageUrl: "" // Optional placeholder
                })
            });

            if (response.ok) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                Alert.alert("Success", "Item uploaded to marketplace!");
                setTitle("");
                setDescription("");
                setPrice("");
                fetchVendorItems();
            } else {
                const data = await response.json();
                Alert.alert("Upload Failed", data.error || "Could not upload item. Please check your tier limits.");
            }
        } catch (error) {
            console.error(error);
            Alert.alert("Error", "A network error occurred.");
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <GalaxyBackground>
            <ScrollView
                style={styles.container}
                contentContainerStyle={{ paddingBottom: insets.bottom + SCROLL_BOTTOM_EXTRA }}
            >
                <Animated.View entering={FadeInDown.springify()} style={styles.section}>
                    <ThemedText type="h2" style={{ marginBottom: Spacing.md }}>Vendor Dashboard</ThemedText>

                    <Card style={styles.uploadCard}>
                        <ThemedText type="h3" style={{ marginBottom: Spacing.md }}>Upload Market Item</ThemedText>

                        <ThemedText type="small" style={{ color: theme.textSecondary, marginBottom: 4 }}>Item Title *</ThemedText>
                        <TextInput
                            style={[styles.input, { backgroundColor: theme.backgroundSecondary, color: theme.text }]}
                            value={title}
                            onChangeText={setTitle}
                            placeholder="e.g. Neon Theme"
                            placeholderTextColor={theme.textMuted}
                        />

                        <ThemedText type="small" style={{ color: theme.textSecondary, marginBottom: 4, marginTop: Spacing.sm }}>Price (Coins) *</ThemedText>
                        <TextInput
                            style={[styles.input, { backgroundColor: theme.backgroundSecondary, color: theme.text }]}
                            value={price}
                            onChangeText={setPrice}
                            keyboardType="numeric"
                            placeholder="e.g. 500"
                            placeholderTextColor={theme.textMuted}
                        />

                        <ThemedText type="small" style={{ color: theme.textSecondary, marginBottom: 4, marginTop: Spacing.sm }}>Category</ThemedText>
                        <View style={styles.categoryRow}>
                            {["Themes", "Badges", "Customization"].map(cat => (
                                <Pressable
                                    key={cat}
                                    onPress={() => setCategory(cat)}
                                    style={[
                                        styles.categoryPill,
                                        { backgroundColor: category === cat ? theme.accent : theme.backgroundSecondary }
                                    ]}
                                >
                                    <ThemedText type="xs" style={{ color: theme.text }}>{cat}</ThemedText>
                                </Pressable>
                            ))}
                        </View>

                        <View style={[styles.premiumRow, { marginTop: Spacing.md }]}>
                            <ThemedText type="body">Premium Lock Item?</ThemedText>
                            <Pressable
                                onPress={() => setIsPremium(!isPremium)}
                                style={[
                                    styles.checkbox,
                                    { backgroundColor: isPremium ? theme.accent : "transparent", borderColor: isPremium ? theme.accent : theme.border }
                                ]}
                            >
                                {isPremium && <Feather name="check" size={16} color="#FFF" />}
                            </Pressable>
                        </View>

                        <Button
                            style={{ marginTop: Spacing.xl }}
                            onPress={handleUploadItem}
                            disabled={isUploading}
                        >
                            {isUploading ? "Uploading..." : "Upload Item"}
                        </Button>
                    </Card>
                </Animated.View>

                <Animated.View entering={FadeInDown.delay(150).springify()} style={styles.section}>
                    <ThemedText type="h3" style={{ marginBottom: Spacing.md }}>Your Market Uploads</ThemedText>
                    {isLoading ? (
                        <ActivityIndicator color={theme.link} />
                    ) : (
                        items.length > 0 ? (
                            items.map((item, idx) => (
                                <View key={item.id || idx} style={[styles.itemRow, { backgroundColor: theme.backgroundSecondary }]}>
                                    <View>
                                        <ThemedText type="bodyMedium">{item.title}</ThemedText>
                                        <ThemedText type="xs" style={{ color: theme.textSecondary }}>{item.category}</ThemedText>
                                    </View>
                                    <View style={{ alignItems: "flex-end" }}>
                                        <ThemedText type="body" style={{ color: theme.yellow, fontWeight: "bold" }}>{item.price} pts</ThemedText>
                                        {item.isPremium && <ThemedText type="xs" style={{ color: theme.accent }}>PREMIUM</ThemedText>}
                                    </View>
                                </View>
                            ))
                        ) : (
                            <ThemedText type="body" style={{ color: theme.textMuted, fontStyle: "italic" }}>
                                You haven't uploaded any items yet.
                            </ThemedText>
                        )
                    )}
                </Animated.View>

            </ScrollView>
        </GalaxyBackground>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: Spacing.lg,
    },
    section: {
        marginBottom: Spacing.xl,
    },
    uploadCard: {
        padding: Spacing.lg,
        borderRadius: BorderRadius.lg,
    },
    input: {
        height: 48,
        borderRadius: BorderRadius.md,
        paddingHorizontal: Spacing.md,
    },
    categoryRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: Spacing.sm,
    },
    categoryPill: {
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.full,
    },
    premiumRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: BorderRadius.sm,
        borderWidth: 2,
        alignItems: "center",
        justifyContent: "center",
    },
    itemRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        padding: Spacing.md,
        borderRadius: BorderRadius.sm,
        marginBottom: Spacing.sm,
    }
});
