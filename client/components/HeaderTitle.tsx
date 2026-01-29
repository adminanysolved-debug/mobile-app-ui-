import React from "react";
import { View, StyleSheet, Image, Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";

interface HeaderTitleProps {
  title: string;
}

export function HeaderTitle({ title }: HeaderTitleProps) {
  const { theme } = useTheme();

  return (
    <View style={styles.container}>
      <Image
        source={require("../assets/images/app-logo.png")}
        style={styles.icon}
        resizeMode="contain"
      />
      <ThemedText style={styles.title}>{title}</ThemedText>
    </View>
  );
}

export function HeaderIcons() {
  const navigation = useNavigation<any>();
  const { theme } = useTheme();

  const handlePress = (screen: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate(screen);
  };

  return (
    <View style={styles.iconsContainer}>
      <Pressable
        onPress={() => handlePress("Messages")}
        style={[styles.iconButton, { backgroundColor: theme.backgroundSecondary }]}
      >
        <Feather name="message-circle" size={20} color={theme.text} />
      </Pressable>
      <Pressable
        onPress={() => handlePress("Notifications")}
        style={[styles.iconButton, { backgroundColor: theme.backgroundSecondary }]}
      >
        <Feather name="bell" size={20} color={theme.text} />
        <View style={[styles.badge, { backgroundColor: theme.error }]}>
          <ThemedText style={styles.badgeText}>3</ThemedText>
        </View>
      </Pressable>
      <Pressable
        onPress={() => handlePress("LuckySpin")}
        style={[styles.iconButton, { backgroundColor: theme.backgroundSecondary }]}
      >
        <Feather name="gift" size={20} color={theme.yellow} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
  },
  icon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    marginRight: Spacing.sm,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
  },
  iconsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    position: "absolute",
    top: -2,
    right: -2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
  },
});
