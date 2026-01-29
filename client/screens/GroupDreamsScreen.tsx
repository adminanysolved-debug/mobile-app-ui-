import { useState, useCallback } from "react";
import { View, StyleSheet, ScrollView, Pressable, ActivityIndicator, RefreshControl } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown } from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { GalaxyBackground } from "@/components/GalaxyBackground";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { AdBanner } from "@/components/AdBanner";
import { useAuth } from "@/context/AuthContext";
import { Spacing, BorderRadius } from "@/constants/theme";
import { getApiUrl } from "@/lib/query-client";

type Dream = {
  id: string;
  title: string;
  description?: string;
  type: "personal" | "challenge" | "group";
  progress: number;
  isCompleted: boolean;
  targetDate?: string;
  createdAt: string;
};

function DreamCard({ dream, index }: { dream: Dream; index: number }) {
  const navigation = useNavigation<any>();
  
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate("DreamDetail", { dreamId: dream.id });
  };
  
  return (
    <Animated.View entering={FadeInDown.delay(index * 100).springify()}>
      <Card style={styles.dreamCard} onPress={handlePress} testID={`dream-card-${dream.id}`}>
        <View style={styles.dreamHeader}>
          <View style={[styles.dreamIcon, { backgroundColor: "#8B5CF6" }]}>
            <Feather name="users" size={24} color="#FFFFFF" />
          </View>
          <View style={styles.dreamContent}>
            <ThemedText type="bodyMedium" style={styles.dreamTitle} numberOfLines={1}>
              {dream.title}
            </ThemedText>
            {dream.description ? (
              <ThemedText type="small" style={styles.dreamDescription} numberOfLines={2}>
                {dream.description}
              </ThemedText>
            ) : null}
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${dream.progress}%` }]} />
              </View>
              <ThemedText type="xs" style={styles.progressText}>
                {dream.progress}%
              </ThemedText>
            </View>
          </View>
          {dream.isCompleted ? (
            <View style={styles.completedBadge}>
              <Feather name="check" size={16} color="#16A34A" />
            </View>
          ) : (
            <Feather name="chevron-right" size={20} color="#8B7FC7" />
          )}
        </View>
      </Card>
    </Animated.View>
  );
}

export default function GroupDreamsScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const navigation = useNavigation<any>();
  const { token } = useAuth();
  const [dreams, setDreams] = useState<Dream[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDreams = useCallback(async () => {
    if (!token) return;
    try {
      const response = await fetch(new URL('/api/dreams?type=group', getApiUrl()).toString(), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setDreams(data.filter((d: Dream) => d.type === "group"));
      }
    } catch (error) {
      console.error('Error fetching dreams:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      fetchDreams();
    }, [fetchDreams])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchDreams();
  };

  const handleCreateDream = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate("CreateDream", { type: "group" });
  };

  return (
    <GalaxyBackground>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: headerHeight + Spacing.lg,
            paddingBottom: insets.bottom + Spacing.xl,
          },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#A78BFA" />
        }
      >
        <AdBanner variant="compact" />

        {isLoading ? (
          <ActivityIndicator size="large" color="#A78BFA" style={{ marginTop: Spacing["3xl"] }} />
        ) : dreams.length === 0 ? (
          <Animated.View entering={FadeInDown.springify()}>
            <Card style={styles.emptyCard}>
              <View style={styles.emptyIcon}>
                <Feather name="users" size={40} color="#8B5CF6" />
              </View>
              <ThemedText type="body" style={styles.emptyTitle}>No Group Dreams Yet</ThemedText>
              <ThemedText type="small" style={styles.emptyDescription}>
                Collaborate with your team by creating a group dream
              </ThemedText>
            </Card>
          </Animated.View>
        ) : (
          dreams.map((dream, idx) => (
            <DreamCard key={dream.id} dream={dream} index={idx} />
          ))
        )}

        <Animated.View entering={FadeInDown.delay(300).springify()}>
          <Button
            onPress={handleCreateDream}
            style={styles.createButton}
            testID="button-create-group-dream"
          >
            <View style={styles.createButtonContent}>
              <Feather name="plus" size={20} color="#FFFFFF" />
              <ThemedText style={styles.createButtonText}>
                CREATE GROUP DREAM
              </ThemedText>
            </View>
          </Button>
        </Animated.View>
      </ScrollView>
    </GalaxyBackground>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  dreamCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.sm,
    backgroundColor: "rgba(45, 39, 82, 0.6)",
  },
  dreamHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  dreamIcon: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  dreamContent: {
    flex: 1,
    gap: Spacing.xs,
  },
  dreamTitle: {
    color: "#FFFFFF",
  },
  dreamDescription: {
    color: "#C4B5FD",
  },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  progressBar: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(139, 127, 199, 0.3)",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
    backgroundColor: "#8B5CF6",
  },
  progressText: {
    color: "#8B7FC7",
  },
  completedBadge: {
    width: 28,
    height: 28,
    borderRadius: BorderRadius.full,
    backgroundColor: "#DCFCE7",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: Spacing.sm,
  },
  emptyCard: {
    padding: Spacing.xl,
    alignItems: "center",
    backgroundColor: "rgba(45, 39, 82, 0.6)",
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.full,
    backgroundColor: "rgba(139, 92, 246, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    color: "#FFFFFF",
    fontWeight: "600",
    marginBottom: Spacing.xs,
  },
  emptyDescription: {
    color: "#C4B5FD",
    textAlign: "center",
  },
  createButton: {
    marginTop: Spacing.lg,
  },
  createButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  createButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 14,
  },
});
