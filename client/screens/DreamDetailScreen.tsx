import { useState, useEffect, useCallback } from "react";
import { View, StyleSheet, Pressable, TextInput, ScrollView, ActivityIndicator, RefreshControl, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";

import { ThemedText } from "@/components/ThemedText";
import { GalaxyBackground } from "@/components/GalaxyBackground";
import { Card } from "@/components/Card";
import { InviteModal } from "@/components/InviteModal";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/context/AuthContext";
import { Spacing, BorderRadius, SCROLL_BOTTOM_EXTRA } from "@/constants/theme";
import { getApiUrl } from "@/lib/query-client";

interface Dream {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  type: string;
  progress: number;
  isCompleted: boolean;
  startDate: string | null;
  targetDate: string | null;
  createdAt: string;
}

interface Task {
  id: string;
  dreamId: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  reminderDate: string | null;
  isCompleted: boolean;
  completedAt: string | null;
  order: number;
}

export default function DreamDetailScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { theme } = useTheme();
  const { token, user: currentUser } = useAuth();

  const dreamId = route.params?.dreamId;

  const [dream, setDream] = useState<Dream | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [members, setMembers] = useState<any[]>([]);

  // ✅ Universal padding that works on ALL Android devices
  // Note: headerHeight already includes status bar (insets.top) on Android
  const topPadding =
    insets.top +
    Spacing.lg +
    Spacing.xl;

  const bottomPadding = insets.bottom + SCROLL_BOTTOM_EXTRA;

  const fetchDream = useCallback(async () => {
    if (!token || !dreamId) return;

    try {
      const [dreamRes, tasksRes, membersRes] = await Promise.all([
        fetch(new URL(`/api/dreams/${dreamId}`, getApiUrl()).toString(), {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(new URL(`/api/dreams/${dreamId}/tasks`, getApiUrl()).toString(), {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(new URL(`/api/dreams/${dreamId}/members`, getApiUrl()).toString(), {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (dreamRes.ok) {
        const dreamData = await dreamRes.json();
        setDream(dreamData);
      }

      if (tasksRes.ok) {
        const tasksData = await tasksRes.json();
        setTasks(tasksData);
      }

      if (membersRes.ok) {
        const membersData = await membersRes.json();
        setMembers(membersData);
      }
    } catch (error) {
      console.error("Failed to fetch dream:", error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [token, dreamId]);

  useEffect(() => {
    fetchDream();
  }, [fetchDream]);

  const handleInvite = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowInviteModal(true);
  };

  const handleEdit = () => {
    if (!dream) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Calculate a rough duration string based on the progress/target date or default to empty
    // since we don't store duration/recurrence natively on the dream object in this schema version
    navigation.navigate("CreateDream", {
      type: dream.type,
      editDreamId: dream.id,
      dreamTitle: dream.title,
      dreamDescription: dream.description,
      dreamStartDate: dream.startDate,
      dreamTasks: tasks.map(t => ({ text: t.title, order: t.order }))
    });
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDream();
  }, [fetchDream]);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "Not set";
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getDaysRemaining = () => {
    if (!dream?.targetDate) return null;
    const target = new Date(dream.targetDate);
    const today = new Date();
    const diff = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const addTask = async () => {
    if (!newTaskTitle.trim() || !token || !dreamId) return;

    setIsAddingTask(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      const response = await fetch(new URL(`/api/dreams/${dreamId}/tasks`, getApiUrl()).toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: newTaskTitle.trim(),
          order: tasks.length,
        }),
      });

      if (response.ok) {
        setNewTaskTitle("");
        fetchDream();
      }
    } catch (error) {
      console.error("Failed to add task:", error);
    } finally {
      setIsAddingTask(false);
    }
  };

  const toggleTask = async (taskId: string) => {
    if (!token || !dreamId) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const response = await fetch(
        new URL(`/api/dreams/${dreamId}/tasks/${taskId}/toggle`, getApiUrl()).toString(),
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        const { task, dream: updatedDream } = await response.json();

        setTasks(prev => prev.map(t => t.id === taskId ? task : t));
        if (updatedDream) {
          setDream(updatedDream);
        }

        if (task.isCompleted) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      }
    } catch (error) {
      console.error("Failed to toggle task:", error);
    }
  };

  const deleteTask = async (taskId: string) => {
    if (!token || !dreamId) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      const response = await fetch(
        new URL(`/api/dreams/${dreamId}/tasks/${taskId}`, getApiUrl()).toString(),
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        fetchDream();
      }
    } catch (error) {
      console.error("Failed to delete task:", error);
    }
  };

  const daysRemaining = getDaysRemaining();
  const completedTasks = tasks.filter(t => t.isCompleted).length;
  const totalTasks = tasks.length;
  // Only the dream creator can edit or invite
  const isOwner = !!currentUser && !!dream && currentUser.id === dream.userId;

  if (isLoading) {
    return (
      <GalaxyBackground>
        <View style={[styles.loadingContainer, { paddingTop: topPadding }]}>
          <ActivityIndicator size="large" color="#A78BFA" />
        </View>
      </GalaxyBackground>
    );
  }

  if (!dream) {
    return (
      <GalaxyBackground>
        <View style={[styles.loadingContainer, { paddingTop: topPadding }]}>
          <ThemedText>Dream not found</ThemedText>
        </View>
      </GalaxyBackground>
    );
  }

  return (
    <GalaxyBackground>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: topPadding,      // ✅ Fixed for all Android
            paddingBottom: bottomPadding, // ✅ Fixed for all Android
          },
        ]}
        showsVerticalScrollIndicator={true}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#A78BFA"
          />
        }
      >
        <Animated.View entering={FadeInDown.springify()}>
          <View style={[styles.header, { justifyContent: 'flex-end' }]}>
            <View style={styles.actionButtons}>
              {isOwner && (
                <Pressable
                  style={[styles.actionButton, { flexDirection: 'row', gap: 6, paddingHorizontal: 16 }]}
                  onPress={handleEdit}
                  testID="button-edit-dream"
                >
                  <Feather name="edit-2" size={14} color="#60A5FA" />
                  <ThemedText type="small" style={{ color: "#60A5FA", fontWeight: "600" }}>Edit</ThemedText>
                </Pressable>
              )}

              {isOwner && (dream.type === "group" || dream.type === "challenge") && (
                <Pressable
                  style={[styles.actionButton, styles.inviteButton, { flexDirection: 'row', gap: 6, paddingHorizontal: 16 }]}
                  onPress={handleInvite}
                  testID="button-invite-members"
                >
                  <Feather name="user-plus" size={14} color="#22C55E" />
                  <ThemedText type="small" style={{ color: "#22C55E", fontWeight: "600" }}>Invite</ThemedText>
                </Pressable>
              )}
            </View>
          </View>

          {dream.isCompleted ? (
            <View style={[styles.completedTag, { alignSelf: 'flex-start', marginBottom: 12 }]}>
              <Feather name="check-circle" size={14} color="#22C55E" />
              <ThemedText type="small" style={styles.completedText}>COMPLETED</ThemedText>
            </View>
          ) : null}

          <ThemedText type="h2" style={styles.title}>{dream.title}</ThemedText>
          {dream.description ? (
            <ThemedText type="body" style={styles.description}>{dream.description}</ThemedText>
          ) : null}

          {members.length > 0 && dream.type !== "personal" && (
            <View style={styles.membersContainer}>
              <ThemedText type="small" style={styles.membersLabel}>MEMBERS ({members.length})</ThemedText>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.membersScroll}>
                {members.map((member: any) => (
                  <View key={member.id} style={styles.memberAvatar}>
                    {member.user?.profileImage ? (
                      /* If we had an Image component from expo-image we'd use it here, fallback to icon */
                      <Feather name="user" size={16} color="#FFFFFF" />
                    ) : (
                      <ThemedText style={styles.memberInitial}>
                        {member.user?.fullName?.charAt(0).toUpperCase() || member.user?.username?.charAt(0).toUpperCase() || "?"}
                      </ThemedText>
                    )}
                  </View>
                ))}
              </ScrollView>
            </View>
          )}
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(100).springify()}>
          <Card style={styles.progressCard}>
            <View style={styles.progressHeader}>
              <ThemedText type="h3" style={styles.progressTitle}>Progress</ThemedText>
              <ThemedText style={styles.progressPercent}>{dream.progress}%</ThemedText>
            </View>

            <View style={styles.progressBarContainer}>
              <View style={styles.progressBarBg}>
                <LinearGradient
                  colors={["#8B5CF6", "#A78BFA"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.progressBarFill, { width: `${dream.progress}%` }]}
                />
              </View>
            </View>

            <View style={styles.statsRow}>
              <View style={styles.stat}>
                <Feather name="check-square" size={16} color="#22C55E" />
                <ThemedText style={styles.statText}>
                  {completedTasks}/{totalTasks} tasks
                </ThemedText>
              </View>
              {daysRemaining !== null ? (
                <View style={styles.stat}>
                  <Feather
                    name="clock"
                    size={16}
                    color={daysRemaining < 0 ? "#EF4444" : daysRemaining < 7 ? "#F59E0B" : "#22C55E"}
                  />
                  <ThemedText style={[
                    styles.statText,
                    daysRemaining < 0 && styles.overdue
                  ]}>
                    {daysRemaining < 0
                      ? `${Math.abs(daysRemaining)} days overdue`
                      : `${daysRemaining} days left`}
                  </ThemedText>
                </View>
              ) : null}
            </View>
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(150).springify()}>
          <View style={styles.dateCards}>
            <View style={styles.dateCard}>
              <Feather name="play-circle" size={20} color="#A78BFA" />
              <View>
                <ThemedText type="small" style={styles.dateLabel}>Started</ThemedText>
                <ThemedText style={styles.dateValue}>{formatDate(dream.startDate)}</ThemedText>
              </View>
            </View>
            <View style={styles.dateCard}>
              <Feather name="flag" size={20} color="#22C55E" />
              <View>
                <ThemedText type="small" style={styles.dateLabel}>Target</ThemedText>
                <ThemedText style={styles.dateValue}>{formatDate(dream.targetDate)}</ThemedText>
              </View>
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).springify()}>
          <View style={styles.sectionHeader}>
            <ThemedText type="h3" style={styles.sectionTitle}>Milestones</ThemedText>
            <ThemedText type="small" style={styles.taskCount}>
              {completedTasks} of {totalTasks} complete
            </ThemedText>
          </View>

          <View style={styles.addTaskRow}>
            <TextInput
              style={styles.addTaskInput}
              value={newTaskTitle}
              onChangeText={setNewTaskTitle}
              placeholder="Add a new milestone..."
              placeholderTextColor="#8B7FC7"
              testID="input-add-task"
            />
            <Pressable
              style={[styles.addTaskButton, isAddingTask && styles.addTaskButtonDisabled]}
              onPress={addTask}
              disabled={isAddingTask}
              testID="button-add-milestone"
            >
              {isAddingTask ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Feather name="plus" size={20} color="#FFFFFF" />
              )}
            </Pressable>
          </View>

          {tasks.length > 0 ? (
            <View style={styles.tasksList}>
              {tasks.map((task, index) => (
                <Animated.View
                  key={task.id}
                  entering={FadeIn.delay(index * 50)}
                >
                  <Pressable
                    style={[
                      styles.taskItem,
                      task.isCompleted && styles.taskItemCompleted
                    ]}
                    onPress={() => toggleTask(task.id)}
                    testID={`task-item-${task.id}`}
                  >
                    <View style={[
                      styles.checkbox,
                      task.isCompleted && styles.checkboxChecked
                    ]}>
                      {task.isCompleted ? (
                        <Feather name="check" size={14} color="#FFFFFF" />
                      ) : null}
                    </View>

                    <View style={styles.taskContent}>
                      <ThemedText style={[
                        styles.taskTitle,
                        task.isCompleted && styles.taskTitleCompleted
                      ]}>
                        {task.title}
                      </ThemedText>
                      {task.dueDate ? (
                        <ThemedText type="small" style={styles.taskDueDate}>
                          Due: {formatDate(task.dueDate)}
                        </ThemedText>
                      ) : null}
                    </View>

                    <Pressable
                      style={styles.deleteTaskButton}
                      onPress={() => deleteTask(task.id)}
                    >
                      <Feather name="trash-2" size={16} color="#EF4444" />
                    </Pressable>
                  </Pressable>
                </Animated.View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyTasks}>
              <Feather name="list" size={40} color="#8B7FC7" />
              <ThemedText style={styles.emptyText}>No milestones yet</ThemedText>
              <ThemedText type="small" style={styles.emptySubtext}>
                Add milestones to track your progress
              </ThemedText>
            </View>
          )}
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(400).springify()}>
          <Pressable
            style={styles.addDreamButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              navigation.navigate('CreateDream', { type: dream?.type || 'personal' });
            }}
            testID="button-add-more-dreams"
          >
            <LinearGradient
              colors={["rgba(124, 58, 237, 0.2)", "rgba(168, 85, 247, 0.2)"]}
              style={styles.addDreamGradient}
            >
              <Feather name="plus-circle" size={24} color="#A78BFA" />
              <ThemedText style={styles.addDreamText}>Create Another Dream</ThemedText>
            </LinearGradient>
          </Pressable>
        </Animated.View>
      </ScrollView>

      {showInviteModal && (
        <InviteModal
          visible={showInviteModal}
          dreamId={dreamId}
          dreamTitle={dream?.title || ""}
          onClose={() => setShowInviteModal(false)}
        />
      )}

    </GalaxyBackground>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    gap: Spacing.lg,
  },
  actionButtons: {
    flexDirection: "row",
    gap: Spacing.sm,
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  actionButton: {
    height: 36,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
    backgroundColor: "rgba(45, 39, 82, 0.8)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(139, 127, 199, 0.3)",
  },
  actionButtonText: {
    color: "#60A5FA",
    marginLeft: 4,
  },
  inviteButton: {
    borderColor: "rgba(34, 197, 94, 0.3)",
  },
  membersContainer: {
    marginTop: Spacing.md,
  },
  membersLabel: {
    color: "#8B7FC7",
    marginBottom: Spacing.sm,
  },
  membersScroll: {
    gap: Spacing.xs,
  },
  memberAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(139, 127, 199, 0.3)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(45, 39, 82, 0.8)",
  },
  memberInitial: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.sm,
  },
  typeTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    backgroundColor: "rgba(167, 139, 250, 0.15)",
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  typeText: {
    color: "#A78BFA",
    fontSize: 10,
    fontWeight: "600",
  },
  completedTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    backgroundColor: "rgba(34, 197, 94, 0.15)",
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  completedText: {
    color: "#22C55E",
    fontSize: 10,
    fontWeight: "600",
  },
  title: {
    color: "#FFFFFF",
    marginBottom: Spacing.xs,
  },
  description: {
    color: "#C4B5FD",
  },
  progressCard: {
    padding: Spacing.lg,
    backgroundColor: "rgba(45, 39, 82, 0.6)",
    borderWidth: 1,
    borderColor: "rgba(139, 127, 199, 0.3)",
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  progressTitle: {
    color: "#FFFFFF",
  },
  progressPercent: {
    color: "#A78BFA",
    fontSize: 24,
    fontWeight: "700",
  },
  progressBarContainer: {
    marginBottom: Spacing.md,
  },
  progressBarBg: {
    height: 12,
    backgroundColor: "rgba(139, 127, 199, 0.2)",
    borderRadius: 6,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 6,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  stat: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  statText: {
    color: "#C4B5FD",
    fontSize: 13,
  },
  overdue: {
    color: "#EF4444",
  },
  dateCards: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  dateCard: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: "rgba(45, 39, 82, 0.6)",
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: "rgba(139, 127, 199, 0.2)",
  },
  dateLabel: {
    color: "#8B7FC7",
    fontSize: 10,
  },
  dateValue: {
    color: "#FFFFFF",
    fontSize: 13,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    color: "#FFFFFF",
  },
  taskCount: {
    color: "#8B7FC7",
  },
  addTaskRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  addTaskInput: {
    flex: 1,
    backgroundColor: "rgba(45, 39, 82, 0.6)",
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: 14,
    color: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(139, 127, 199, 0.3)",
  },
  addTaskButton: {
    backgroundColor: "#8B5CF6",
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
    width: 44,
  },
  addTaskButtonDisabled: {
    opacity: 0.6,
  },
  tasksList: {
    gap: Spacing.sm,
  },
  taskItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    backgroundColor: "rgba(45, 39, 82, 0.5)",
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: "rgba(139, 127, 199, 0.2)",
  },
  taskItemCompleted: {
    backgroundColor: "rgba(34, 197, 94, 0.1)",
    borderColor: "rgba(34, 197, 94, 0.2)",
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#8B7FC7",
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: {
    backgroundColor: "#22C55E",
    borderColor: "#22C55E",
  },
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    color: "#FFFFFF",
    fontSize: 14,
  },
  taskTitleCompleted: {
    textDecorationLine: "line-through",
    color: "#8B7FC7",
  },
  taskDueDate: {
    color: "#8B7FC7",
    marginTop: 2,
    fontSize: 11,
  },
  deleteTaskButton: {
    padding: Spacing.xs,
  },
  emptyTasks: {
    alignItems: "center",
    paddingVertical: Spacing.xl * 2,
    gap: Spacing.sm,
  },
  emptyText: {
    color: "#C4B5FD",
    fontSize: 16,
  },
  emptySubtext: {
    color: "#8B7FC7",
  },
  addDreamButton: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
  },
  addDreamGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: "rgba(167, 139, 250, 0.3)",
  },
  addDreamText: {
    color: "#A78BFA",
    fontSize: 16,
    fontWeight: "600",
  },
});
