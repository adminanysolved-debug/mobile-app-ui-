import { useState, useEffect, useRef, useCallback } from "react";
import { View, StyleSheet, FlatList, TextInput, Pressable, ActivityIndicator, KeyboardAvoidingView, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { RouteProp } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";

import { ThemedText } from "@/components/ThemedText";
import { GalaxyBackground } from "@/components/GalaxyBackground";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/context/AuthContext";
import { Spacing, BorderRadius } from "@/constants/theme";
import { getApiUrl } from "@/lib/query-client";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

type ChatScreenRouteProp = RouteProp<RootStackParamList, "Chat">;

type Message = {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  isRead: boolean;
  createdAt: string;
};

export default function ChatScreen({ route }: any) {
  const { otherUserId, otherUserName, conversationId } = route.params;
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();
  const { user, token } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Build deterministic room ID from both user IDs
  const roomId = conversationId || [user?.id, otherUserId].sort().join("_");

  const fetchMessages = useCallback(async () => {
    try {
      const response = await fetch(
        new URL(`/api/messages/${otherUserId}`, getApiUrl()).toString(),
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.ok) {
        const data = await response.json();
        setMessages(data);
      }
    } catch (error) {
      console.error("Failed to fetch messages:", error);
    } finally {
      setIsLoading(false);
    }
  }, [otherUserId, token]);

  const connectWS = useCallback(() => {
    if (!token || !user?.id) return;
    const apiUrl = getApiUrl();
    const wsUrl = apiUrl.replace(/^http/, "ws");
    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        // Authenticate
        ws.send(JSON.stringify({ type: "auth", token }));
        // Join room
        ws.send(JSON.stringify({ type: "join", conversationId: roomId }));
        setIsConnected(true);
      };

      ws.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data);
          if (msg.type === "message") {
            setMessages(prev => {
              // Avoid duplicates
              if (prev.some(m => m.id === msg.id)) return prev;
              return [...prev, {
                id: msg.id,
                senderId: msg.senderId,
                receiverId: msg.senderId === user.id ? otherUserId : user.id,
                content: msg.content,
                isRead: false,
                createdAt: msg.createdAt,
              }];
            });
            setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
          }
        } catch {}
      };

      ws.onclose = () => {
        setIsConnected(false);
        // Auto-reconnect after 3s
        reconnectTimer.current = setTimeout(connectWS, 3000);
      };

      ws.onerror = () => {
        ws.close();
      };
    } catch (e) {
      console.error("[WS] Connection failed:", e);
    }
  }, [token, user?.id, roomId, otherUserId]);

  useEffect(() => {
    fetchMessages();
    connectWS();
    return () => {
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      wsRef.current?.close();
    };
  }, [otherUserId]);



  const handleSend = async () => {
    if (!newMessage.trim() || isSending) return;

    setIsSending(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const content = newMessage.trim();
    setNewMessage("");

    // Send via WebSocket for immediate delivery to all participants
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "message", content }));
    }

    try {
      // Also persist to DB via REST API
      await fetch(new URL('/api/messages', getApiUrl()).toString(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ receiverId: otherUserId, content }),
      });
    } catch (error) {
      console.error("Failed to persist message:", error);
    } finally {
      setIsSending(false);
    }
  };



  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const isMe = item.senderId === user?.id;
    return (
      <Animated.View
        entering={FadeInDown.delay(index * 30).springify()}
        style={[
          styles.messageContainer,
          isMe ? styles.myMessage : styles.theirMessage,
        ]}
      >
        <View
          style={[
            styles.messageBubble,
            isMe
              ? { backgroundColor: "#7C3AED" }
              : { },
          ]}
        >
          <ThemedText
            type="body"
            style={{ color: "#FFFFFF" }}
          >
            {item.content}
          </ThemedText>
          <ThemedText
            type="xs"
            style={[
              styles.messageTime,
              { color: isMe ? "rgba(255,255,255,0.7)" : "#C4B5FD" },
            ]}
          >
            {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </ThemedText>
        </View>
      </Animated.View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <LinearGradient
        colors={[theme.link, theme.accent]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.emptyIcon}
      >
        <Feather name="message-circle" size={32} color="#FFFFFF" />
      </LinearGradient>
      <ThemedText type="body" style={[styles.emptyText, { color: "#C4B5FD" }]}>
        No messages yet
      </ThemedText>
      <ThemedText type="small" style={{ color: "#8B7FC7" }}>
        Start the conversation with {otherUserName}
      </ThemedText>
    </View>
  );

  return (
    <GalaxyBackground>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={headerHeight}
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.link} />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            contentContainerStyle={[
              styles.messagesList,
              {
                paddingTop: insets.top + Spacing.md,
                paddingBottom: Spacing.lg,
              },
              messages.length === 0 && styles.emptyList,
            ]}
            ListEmptyComponent={renderEmptyState}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
            showsVerticalScrollIndicator={false}
          />
        )}

        <View
          style={[
            styles.inputContainer,
            {
              backgroundColor: "#0D0B1E",
              paddingBottom: insets.bottom > 0 ? insets.bottom : Spacing.md,
              borderTopColor: "rgba(139, 127, 199, 0.3)",
            },
          ]}
        >
          {isConnected && (
            <View style={styles.connectedBadge}>
              <View style={styles.connectedDot} />
              <ThemedText type="xs" style={{ color: "#22C55E", fontSize: 10 }}>Live</ThemedText>
            </View>
          )}
          <TextInput
            style={[
              styles.textInput,
              { color: "#FFFFFF" },
            ]}
            placeholder="Type a message..."
            placeholderTextColor="#8B7FC7"
            value={newMessage}
            onChangeText={setNewMessage}
            multiline
            maxLength={1000}
            testID="input-chat-message"
          />
          <Pressable
            onPress={handleSend}
            disabled={isSending || !newMessage.trim()}
            style={[
              styles.sendButton,
              { backgroundColor: newMessage.trim() ? "#7C3AED" : "rgba(45, 39, 82, 0.6)" },
            ]}
            testID="button-send-message"
          >
            {isSending ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Feather
                name="send"
                size={20}
                color={newMessage.trim() ? "#FFFFFF" : "#C4B5FD"}
              />
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </GalaxyBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  messagesList: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  emptyList: {
    flex: 1,
    justifyContent: "center",
  },
  emptyState: {
    alignItems: "center",
    gap: Spacing.md,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.sm,
  },
  emptyText: {
    fontWeight: "500",
  },
  messageContainer: {
    marginBottom: Spacing.sm,
    maxWidth: "80%",
  },
  myMessage: {
    alignSelf: "flex-end",
  },
  theirMessage: {
    alignSelf: "flex-start",
  },
  messageBubble: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  messageTime: {
    marginTop: Spacing.xs,
    alignSelf: "flex-end",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    gap: Spacing.sm,
  },
  textInput: {
    flex: 1,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    maxHeight: 100,
    fontSize: 16,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  connectedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    position: "absolute",
    top: -22,
    right: Spacing.lg,
    backgroundColor: "rgba(34, 197, 94, 0.15)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: "rgba(34, 197, 94, 0.3)",
  },
  connectedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#22C55E",
  },
});
