import React, { useState, useEffect } from "react";
import { Modal, View, StyleSheet, Image, Pressable, Linking, Dimensions, Platform } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import Animated, { FadeIn, FadeOut, ZoomIn } from "react-native-reanimated";
import { Video, ResizeMode } from "expo-av";

interface ActiveAd {
    id: string;
    imageUrl: string;
    targetUrl?: string;
    isActive: boolean;
    type: 'image' | 'video';
    targetScreens: string;
}

export function AdPopup({ currentRoute }: { currentRoute: string }) {
  const [visible, setVisible] = useState(false);
  const [lastAdId, setLastAdId] = useState<string | null>(null);

  const { data: ad, isLoading, isError } = useQuery<ActiveAd | null>({
    queryKey: ["api", "ads", "active"],
    staleTime: 0, 
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    if (ad && ad.isActive && currentRoute) {
      if (currentRoute === 'Payment') return;

      const isTargeted = ad.targetScreens === '*' || (ad.targetScreens || '').split(',').includes(currentRoute);
      
      if (isTargeted && lastAdId !== ad.id) {
        console.log("Showing ad on targeted screen:", currentRoute);
        const timer = setTimeout(() => {
          setVisible(true);
          setLastAdId(ad.id);
        }, 1500);
        return () => clearTimeout(timer);
      }
    }
  }, [ad, currentRoute, lastAdId]);

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setVisible(false);
  };

  const handlePress = () => {
    if (ad?.targetUrl) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Linking.openURL(ad.targetUrl);
      handleClose();
    }
  };

  if (!ad || !ad.isActive || !visible) return null;

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
             {ad.type === 'video' ? (
                <Video
                    source={{ uri: ad.imageUrl }}
                    style={styles.image}
                    resizeMode={ResizeMode.COVER}
                    shouldPlay
                    isLooping
                    isMuted={false}
                />
             ) : (
                <Image 
                    source={{ uri: ad.imageUrl }} 
                    style={styles.image}
                    resizeMode="cover"
                />
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
  }
});
