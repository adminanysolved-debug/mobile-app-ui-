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
import { useNavigation } from "@react-navigation/native";
import { getApiUrl } from "@/lib/query-client";
import { Spacing, BorderRadius, SCROLL_BOTTOM_EXTRA } from "@/constants/theme";
import * as Haptics from "expo-haptics";

interface MarketItem {
    id: string;
    title: string;
    description: string | null;
    price: number;
    category: string;
    howToAchieve: string | null;
    isPremium: boolean;
    isActive: boolean;
};

export default function VendorHubScreen() {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<any>();
    const { theme } = useTheme();
    const { token } = useAuth();

    const [items, setItems] = useState<MarketItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);

    // New Item State
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [price, setPrice] = useState("");
    const [category, setCategory] = useState("Dream");
    const [tasks, setTasks] = useState<{ title: string; timeframe: string }[]>([{ title: "", timeframe: "1 month" }]);
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

    const handleDeleteProfile = async () => {
        Alert.alert(
            "Delete Vendor Profile?",
            "Are you sure you want to remove your vendor status? Your active marketplace items will remain but you will no longer have access to the Vendor Hub.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete Profile",
                    style: "destructive",
                    onPress: async () => {
                        setIsLoading(true);
                        try {
                            const response = await fetch(new URL('/api/vendor', getApiUrl()).toString(), {
                                method: 'DELETE',
                                headers: { Authorization: `Bearer ${token}` }
                            });

                            if (response.ok) {
                                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                                Alert.alert("Success", "Your vendor profile has been removed.");
                                // Navigation goBack simulates exiting the hub now that access is revoked
                                navigation.goBack();
                            } else {
                                const data = await response.json();
                                Alert.alert("Error", data.error || "Failed to delete vendor profile");
                            }
                        } catch (error) {
                            Alert.alert("Error", "A network error occurred.");
                        } finally {
                            setIsLoading(false);
                        }
                    }
                }
            ]
        );
    };

    const removeTask = (index: number) => {
    if (tasks.length > 1) {
      setTasks(tasks.filter((_, i) => i !== index));
    }
  };

  const handleUploadItem = async () => {
    const validTasks = tasks.filter(t => t.title.trim().length > 0);
    if (!title.trim() || !price || validTasks.length === 0) {
      Alert.alert("Required Fields", "Please provide a title, price, and at least one valid strategy task.");
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
                    howToAchieve: JSON.stringify(validTasks),
                    imageUrl: "" 
                })
            });

            if (response.ok) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                Alert.alert("Success", "Item uploaded to marketplace!");
                setTitle("");
                setDescription("");
                setPrice("");
                setTasks([{ title: "", timeframe: "1 month" }]);
                setIsPremium(false);
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
                    <Card style={styles.uploadCard}>
                        <ThemedText type="h3" style={{ marginBottom: Spacing.md }}>Upload Market Item</ThemedText>

                        <ThemedText type="small" style={{ color: theme.textSecondary, marginBottom: 4 }}>Item Title *</ThemedText>
                        <TextInput
                            style={[styles.input, { backgroundColor: theme.backgroundSecondary, color: theme.text }]}
                            value={title}
                            onChangeText={setTitle}
                            placeholder="e.g. Health Protocol"
                            placeholderTextColor={theme.textMuted}
                            maxLength={24}
                        />

                        <View style={{ marginTop: Spacing.sm }}>
                            <View style={styles.labelRow}>
                                <ThemedText type="small" style={{ color: theme.textSecondary }}>Bio / Description</ThemedText>
                                <ThemedText type="xs" style={{ color: theme.textMuted }}>{description.length}/60</ThemedText>
                            </View>
                            <TextInput
                                style={[styles.input, { backgroundColor: theme.backgroundSecondary, color: theme.text, height: 60, textAlignVertical: 'top', paddingTop: 8 }]}
                                value={description}
                                onChangeText={(val) => setDescription(val.slice(0, 60))}
                                placeholder="Describe the goal of this dream..."
                                placeholderTextColor={theme.textMuted}
                                multiline
                                maxLength={60}
                            />
                        </View>

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
                            {["Dream"].map(cat => (
                                <Pressable
                                    key={cat}
                                    onPress={() => setCategory(cat)}
                                    style={[
                                        styles.categoryPill,
                                        { backgroundColor: theme.accent }
                                    ]}
                                >
                                    <ThemedText type="xs" style={{ color: "#FFF", fontWeight: "bold" }}>{cat}</ThemedText>
                                </Pressable>
                            ))}
                        </View>

                        <View style={{ marginTop: Spacing.md }}>
                            <ThemedText type="small" style={{ color: theme.textSecondary, marginBottom: Spacing.sm }}>Dream Tasks Strategy *</ThemedText>
                            <ThemedText type="xs" style={{ color: theme.textMuted, marginBottom: Spacing.md }}>Define the actionable tasks required to achieve this Dream. Users will receive these tasks upon purchase.</ThemedText>
                            
                            {tasks.map((task, index) => (
                                <View key={index} style={{ marginBottom: Spacing.md, padding: Spacing.sm, backgroundColor: theme.backgroundSecondary, borderRadius: 12, borderWidth: 1, borderColor: theme.border }}>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.xs }}>
                                        <ThemedText type="xs" style={{ color: theme.textSecondary, fontWeight: "bold" }}>Task {index + 1}</ThemedText>
                                        {tasks.length > 1 && (
                                            <Pressable onPress={() => removeTask(index)} hitSlop={10}>
                                                <Feather name="x" size={14} color={theme.textMuted} />
                                            </Pressable>
                                        )}
                                    </View>
                                    
                                    <TextInput
                                        style={[styles.input, { backgroundColor: "transparent", color: theme.text, paddingHorizontal: 0, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: theme.border, borderRadius: 0, marginBottom: 8 }]}
                                        value={task.title}
                                        onChangeText={(val) => {
                                            const updated = [...tasks];
                                            updated[index].title = val;
                                            setTasks(updated);
                                        }}
                                        placeholder="e.g. Meditate for 10 minutes"
                                        placeholderTextColor={theme.textMuted}
                                    />
                                    
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
                                        <Feather name="clock" size={12} color={theme.textMuted} />
                                        <TextInput
                                            style={{ flex: 1, color: theme.text, fontSize: 12, paddingVertical: 4 }}
                                            value={task.timeframe}
                                            onChangeText={(val) => {
                                                const updated = [...tasks];
                                                updated[index].timeframe = val;
                                                setTasks(updated);
                                            }}
                                            placeholder="Timeframe (e.g. 1 week)"
                                            placeholderTextColor={theme.textMuted}
                                        />
                                    </View>
                                </View>
                            ))}

                            <Pressable 
                                onPress={() => setTasks([...tasks, { title: "", timeframe: "1 month" }])}
                                style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, alignSelf: 'flex-start', paddingVertical: Spacing.xs, paddingHorizontal: Spacing.sm, borderRadius: 16, backgroundColor: theme.accent + '20' }}
                            >
                                <Feather name="plus" size={14} color={theme.accent} />
                                <ThemedText type="xs" style={{ color: theme.accent, fontWeight: "bold" }}>Add Another Task</ThemedText>
                            </Pressable>
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
                                        {item.description ? <ThemedText type="xs" style={{ color: theme.textMuted }}>{item.description}</ThemedText> : null}
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

                <Animated.View entering={FadeInDown.delay(200).springify()} style={[styles.section, { marginTop: Spacing.xl }]}>
                    <ThemedText type="h3" style={{ color: theme.error, marginBottom: Spacing.md }}>Danger Zone</ThemedText>
                    <Card style={[styles.uploadCard, { borderColor: `${theme.error}40`, borderWidth: 1 }] as any}>
                        <ThemedText type="body" style={{ color: theme.textSecondary, marginBottom: Spacing.lg }}>
                            Revoke your vendor privileges and return to a standard account.
                        </ThemedText>
                        <Pressable
                            style={{
                                backgroundColor: `${theme.error}20`,
                                paddingVertical: Spacing.md,
                                borderRadius: BorderRadius.md,
                                alignItems: "center",
                                justifyContent: "center"
                            }}
                            onPress={handleDeleteProfile}
                        >
                            <ThemedText type="bodyMedium" style={{ color: theme.error }}>Delete Vendor Profile</ThemedText>
                        </Pressable>
                    </Card>
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
    textArea: {
        height: 100,
        paddingTop: Spacing.md,
        textAlignVertical: "top",
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
        alignItems: "center",
        padding: Spacing.md,
        borderRadius: BorderRadius.md,
        marginBottom: Spacing.sm
    },
    labelRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    }
});
