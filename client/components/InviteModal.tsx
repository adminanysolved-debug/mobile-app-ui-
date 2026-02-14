import { useState, useEffect } from "react";
import { View, StyleSheet, Modal, Pressable, FlatList, ActivityIndicator } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";

import { ThemedText } from "./ThemedText";
import { Card } from "./Card";
import { Button } from "./Button";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/context/AuthContext";
import { Spacing, BorderRadius } from "@/constants/theme";
import { getApiUrl } from "@/lib/query-client";

type Connection = {
  id: string;
  username: string;
  fullName: string;
  avatar?: string;
};

interface InviteModalProps {
  visible: boolean;
  dreamId: string;
  dreamTitle: string;
  onClose: () => void;
}

export function InviteModal({ visible, dreamId, dreamTitle, onClose }: InviteModalProps) {
  const { theme } = useTheme();
  const { token } = useAuth();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (visible) {
      fetchConnections();
    }
  }, [visible]);

  const fetchConnections = async () => {
    if (!token) return;
    try {
      const response = await fetch(new URL('/api/connections', getApiUrl()).toString(), {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (response.ok) {
        const data = await response.json();
        // Combine followers and following, remove duplicates
        const allConnections = [...data.followers, ...data.following];
        const uniqueConnections = Array.from(
          new Map(allConnections.map(item => [item.id, item])).values()
        );
        setConnections(uniqueConnections);
      }
    } catch (error) {
      console.error('Error fetching connections:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSelection = (userId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };

  const handleSendInvites = async () => {
    if (selectedIds.size === 0) return;
    
    setIsSending(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    try {
      const response = await fetch(
        new URL(`/api/dreams/${dreamId}/invite`, getApiUrl()).toString(),
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ 
            userIds: Array.from(selectedIds),
            dreamTitle 
          }),
        }
      );
      
      if (response.ok) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onClose();
      }
    } catch (error) {
      console.error('Error sending invites:', error);
    } finally {
      setIsSending(false);
    }
  };

  const renderConnection = ({ item }: { item: Connection }) => {
    const isSelected = selectedIds.has(item.id);
    
    return (
      <Pressable
        style={[styles.connectionItem, isSelected && styles.connectionItemSelected]}
        onPress={() => toggleSelection(item.id)}
      >
        <LinearGradient
          colors={[theme.blue, theme.purple]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.avatar}
        >
          <ThemedText style={styles.avatarText}>
            {item.fullName?.charAt(0).toUpperCase() || "U"}
          </ThemedText>
        </LinearGradient>
        <View style={styles.userInfo}>
          <ThemedText type="bodyMedium">{item.fullName}</ThemedText>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            @{item.username}
          </ThemedText>
        </View>
        <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
          {isSelected && <Feather name="check" size={16} color="#FFFFFF" />}
        </View>
      </Pressable>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={[styles.modal, { backgroundColor: theme.backgroundDefault }]}>
          <View style={styles.header}>
            <ThemedText type="h3">Invite to Dream</ThemedText>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Feather name="x" size={24} color={theme.text} />
            </Pressable>
          </View>

          <ThemedText type="small" style={[styles.subtitle, { color: theme.textSecondary }]}>
            Select connections to invite to "{dreamTitle}"
          </ThemedText>

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#A78BFA" />
            </View>
          ) : connections.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Feather name="users" size={48} color="#8B7FC7" />
              <ThemedText style={styles.emptyText}>No connections yet</ThemedText>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                Follow others to invite them to your dreams
              </ThemedText>
            </View>
          ) : (
            <FlatList
              data={connections}
              renderItem={renderConnection}
              keyExtractor={item => item.id}
              style={styles.list}
              showsVerticalScrollIndicator={false}
            />
          )}

          <View style={styles.footer}>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              {selectedIds.size} selected
            </ThemedText>
            <Button
              onPress={handleSendInvites}
              disabled={selectedIds.size === 0 || isSending}
              style={styles.sendButton}
            >
              {isSending ? "Sending..." : `Send ${selectedIds.size} Invite${selectedIds.size !== 1 ? 's' : ''}`}
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "flex-end",
  },
  modal: {
    height: "80%",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: Spacing.xl,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  closeButton: {
    padding: Spacing.xs,
  },
  subtitle: {
    marginBottom: Spacing.lg,
  },
  list: {
    flex: 1,
  },
  connectionItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.sm,
    backgroundColor: "rgba(45, 39, 82, 0.4)",
    borderWidth: 2,
    borderColor: "transparent",
  },
  connectionItemSelected: {
    borderColor: "#22C55E",
    backgroundColor: "rgba(34, 197, 94, 0.1)",
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },
  userInfo: {
    flex: 1,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: BorderRadius.xs,
    borderWidth: 2,
    borderColor: "#8B7FC7",
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxSelected: {
    backgroundColor: "#22C55E",
    borderColor: "#22C55E",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: "rgba(139, 127, 199, 0.2)",
  },
  sendButton: {
    flex: 0,
    paddingHorizontal: Spacing.xl,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: Spacing.md,
  },
});