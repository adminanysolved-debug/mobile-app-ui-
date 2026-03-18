import React, { useState, useEffect } from "react";
import { Modal, View, StyleSheet, Image, Pressable, Linking, Dimensions, Platform } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import Animated, { FadeIn, FadeOut, ZoomIn } from "react-native-reanimated";

interface ActiveAd {
    id: string;
    image_url: string;
    target_url?: string;
    is_active: boolean;
}

export function AdPopup() {
  const [visible, setVisible] = useState(false);
  const [hasShownThisSession, setHasShownThisSession] = useState(false);

  const { data: ad } = useQuery<ActiveAd | null>({
    queryKey: ["api", "ads", "active"],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  useEffect(() => {
    if (ad && ad.is_active && !hasShownThisSession) {
      // Show ad after a 2-second delay to ensure the app is ready and user is settled
      const timer = setTimeout(() => {
        setVisible(true);
        setHasShownThisSession(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [ad, hasShownThisSession]);

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setVisible(false);
  };

  const handlePress = () => {
    if (ad?.target_url) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Linking.openURL(ad.target_url);
      handleClose();
    }
  };

  if (!ad || !ad.is_active || !visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={handleClose}
    >
      <Animated.View 
        entering={FadeIn.duration(300)} 
        exiting={FadeOut.duration(200)}
        style={styles.overlay}
      >
        <Animated.View 
            entering={ZoomIn.delay(200).springify()}
            style={styles.content}
        >
          <Pressable onPress={handlePress} style={styles.imageContainer}>
             <Image 
                source={{ uri: ad.image_url }} 
                style={styles.image}
                resizeMode="cover"
             />
             {ad.target_url && (
                <View style={styles.linkIndicator}>
                    <Feather name="external-link" size={12} color="#FFFFFF" />
                    <View style={styles.linkText}>
                        <View style={styles.dot} />
                        <View style={[styles.dot, { opacity: 0.5 }]} />
                    </View>
                </View>
             )}
          </Pressable>

          <Pressable 
            style={({ pressed }) => [styles.closeButton, pressed && styles.closeButtonPressed]} 
            onPress={handleClose}
          >
            <View style={styles.closeIconContainer}>
                <Feather name="x" size={20} color="#FFFFFF" />
            </View>
          </Pressable>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const { width, height } = Dimensions.get("window");

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    width: width * 0.85,
    height: height * 0.65,
    borderRadius: 32,
    overflow: "hidden",
    backgroundColor: "#1A1040",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.5,
        shadowRadius: 30,
      },
      android: {
        elevation: 24,
      },
    }),
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  imageContainer: {
    width: "100%",
    height: "100%",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  closeButton: {
    position: "absolute",
    top: 20,
    right: 20,
    zIndex: 10,
  },
  closeButtonPressed: {
    transform: [{ scale: 0.9 }],
    opacity: 0.8,
  },
  closeIconContainer: {
    backgroundColor: "rgba(0,0,0,0.5)",
    padding: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    backdropFilter: "blur(10px)",
  },
  linkIndicator: {
    position: "absolute",
    bottom: 20,
    right: 20,
    backgroundColor: "rgba(124, 58, 237, 0.8)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  linkText: {
    flexDirection: "row",
    gap: 2,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: "#FFF",
  }
});
