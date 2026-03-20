import React, { useState } from "react";
import { View, StyleSheet, Image, Pressable, ScrollView, Platform } from "react-native";
import {
  createDrawerNavigator,
  DrawerContentScrollView,
  DrawerItem,
} from "@react-navigation/drawer";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, { FadeIn, Layout } from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/context/AuthContext";
import { Spacing, BorderRadius } from "@/constants/theme";
import { GalaxyBackground } from "@/components/GalaxyBackground";

import HomeStackNavigator from "@/navigation/HomeStackNavigator";
import ProfileStackNavigator from "@/navigation/ProfileStackNavigator";
import SettingsStackNavigator from "@/navigation/SettingsStackNavigator";
import WalletScreen from "@/screens/WalletScreen";
import { DrawerActions } from "@react-navigation/native";
import ConnectionsScreen from "@/screens/ConnectionsScreen";
import ChampionsScreen from "@/screens/ChampionsScreen";
import VendorHubScreen from "@/screens/VendorHubScreen";
import SubscriptionScreen from "@/screens/SubscriptionScreen";
import ChangePasswordScreen from "@/screens/ChangePasswordScreen";

const Drawer = createDrawerNavigator();

function CustomDrawerContent(props: any) {
  const { theme } = useTheme();
  const { user, logout } = useAuth();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const toggleExpand = (item: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExpandedItems((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  const isExpanded = (item: string) => expandedItems.includes(item);

  const handleLogout = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    logout();
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#0D0B1E" }}>
      <DrawerContentScrollView {...props} contentContainerStyle={{ paddingTop: 0 }}>
        {/* Header - User Info */}
        <LinearGradient
            colors={["#1A1040", "#0D0B1E"]}
            style={styles.drawerHeader}
        >
          <View style={styles.userInfo}>
            <Image
              source={user?.profileImage ? { uri: user.profileImage } : require("../assets/images/app-logo.png")}
              style={styles.avatar}
            />
            <View style={styles.userText}>
              <ThemedText type="bodyMedium" style={styles.userName}>
                {user?.fullName || "Guest User"}
              </ThemedText>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                @{user?.username || "guest"}
              </ThemedText>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.drawerItems}>
          {/* Home */}
          <DrawerItemBase
            label="Home"
            icon="home"
            onPress={() => props.navigation.navigate("Home")}
            activeBackgroundColor="rgba(124, 58, 237, 0.2)"
          />

          {/* Profile Expandable */}
          <Pressable onPress={() => toggleExpand("profile")} style={styles.expandableHeader}>
            <View style={styles.headerLeft}>
              <View style={styles.iconContainer}>
                <Feather name="user" size={22} color="#C4B5FD" />
              </View>
              <ThemedText style={styles.headerLabel}>Profile</ThemedText>
            </View>
            <Feather name={isExpanded("profile") ? "chevron-up" : "chevron-down"} size={18} color="#C4B5FD" />
          </Pressable>
          {isExpanded("profile") && (
            <Animated.View entering={FadeIn} layout={Layout.springify()} style={styles.subItems}>
              <DrawerItem
                label="View Profile"
                onPress={() => props.navigation.navigate("ProfileMain")}
                labelStyle={styles.subLabel}
                inactiveTintColor="#8B7FC7"
                style={styles.subDrawerItem}
              />
              <DrawerItem
                label="Edit Profile"
                onPress={() => props.navigation.navigate("ProfileMain", { screen: 'Profile', params: { isEditing: true } })}
                labelStyle={styles.subLabel}
                inactiveTintColor="#8B7FC7"
                style={styles.subDrawerItem}
              />
              <DrawerItem
                label="Change Password"
                onPress={() => props.navigation.navigate("ChangePassword")}
                labelStyle={styles.subLabel}
                inactiveTintColor="#8B7FC7"
                style={styles.subDrawerItem}
              />
              <DrawerItem
                label="Log Out"
                onPress={handleLogout}
                labelStyle={[styles.subLabel, { color: "#EF4444" }]}
                inactiveTintColor="#EF4444"
                style={styles.subDrawerItem}
              />
            </Animated.View>
          )}

          {/* Themes */}
          <DrawerItemBase
            label="Themes"
            icon="layout"
            onPress={() => props.navigation.navigate("Themes")}
          />

          {/* Wallet */}
          <DrawerItemBase
            label="Wallet"
            icon="pocket"
            onPress={() => props.navigation.navigate("WalletMain")}
          />

          {/* Connections Expandable */}
          <Pressable onPress={() => toggleExpand("connections")} style={styles.expandableHeader}>
            <View style={styles.headerLeft}>
              <View style={styles.iconContainer}>
                <Feather name="users" size={22} color="#C4B5FD" />
              </View>
              <ThemedText style={styles.headerLabel}>Connections</ThemedText>
            </View>
            <Feather name={isExpanded("connections") ? "chevron-up" : "chevron-down"} size={18} color="#C4B5FD" />
          </Pressable>
          {isExpanded("connections") && (
            <Animated.View entering={FadeIn} layout={Layout.springify()} style={styles.subItems}>
              <DrawerItem
                label="Followers"
                onPress={() => props.navigation.navigate("ConnectionsMain", { tab: 'followers' })}
                labelStyle={styles.subLabel}
                inactiveTintColor="#8B7FC7"
                style={styles.subDrawerItem}
              />
              <DrawerItem
                label="Following"
                onPress={() => props.navigation.navigate("ConnectionsMain", { tab: 'following' })}
                labelStyle={styles.subLabel}
                inactiveTintColor="#8B7FC7"
                style={styles.subDrawerItem}
              />
              <DrawerItem
                label="Discover"
                onPress={() => props.navigation.navigate("ConnectionsMain", { tab: 'discover' })}
                labelStyle={styles.subLabel}
                inactiveTintColor="#8B7FC7"
                style={styles.subDrawerItem}
              />
            </Animated.View>
          )}

          {/* My Achievements Expandable */}
          <Pressable onPress={() => toggleExpand("achievements")} style={styles.expandableHeader}>
            <View style={styles.headerLeft}>
              <View style={styles.iconContainer}>
                <Feather name="award" size={22} color="#C4B5FD" />
              </View>
              <ThemedText style={styles.headerLabel}>My Achievements</ThemedText>
            </View>
            <Feather name={isExpanded("achievements") ? "chevron-up" : "chevron-down"} size={18} color="#C4B5FD" />
          </Pressable>
          {isExpanded("achievements") && (
            <Animated.View entering={FadeIn} layout={Layout.springify()} style={styles.subItems}>
              <DrawerItem
                label="Badges & Scores"
                onPress={() => props.navigation.navigate("ChampionsMain")}
                labelStyle={styles.subLabel}
                inactiveTintColor="#8B7FC7"
                style={styles.subDrawerItem}
              />
            </Animated.View>
          )}

          {/* Become a Vendor */}
          <DrawerItemBase
            label="Become a Vendor"
            icon="shopping-bag"
            onPress={() => props.navigation.navigate("VendorHubMain")}
          />

          {/* Subscription Package */}
          <DrawerItemBase
            label="Subscription Package"
            icon="zap"
            onPress={() => props.navigation.navigate("SubscriptionMain")}
          />
        </View>
      </DrawerContentScrollView>
      
      {/* Footer / App Version */}
      <View style={[styles.drawerFooter, { borderTopColor: theme.border }]}>
        <ThemedText type="small" style={{ color: theme.textMuted }}>
          RealDream App v3.0.0
        </ThemedText>
      </View>
    </View>
  );
}

// Helper for consistent Alignment
function DrawerItemBase({ label, icon, onPress, theme, inactiveTintColor, activeTintColor, ...props }: any) {
  return (
    <DrawerItem
      label={label}
      icon={({ color, size }) => <Feather name={icon} size={22} color={color} />}
      onPress={onPress}
      labelStyle={styles.drawerLabel}
      inactiveTintColor={inactiveTintColor || "#C4B5FD"}
      activeTintColor={activeTintColor || "#FFFFFF"}
      style={styles.drawerItemStyle}
      {...props}
    />
  );
}

import { LinearGradient } from "expo-linear-gradient";

export default function MainDrawerNavigator() {
  const { theme } = useTheme();

  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={({ navigation }) => ({
        headerLeft: (props) => {
          const state = navigation.getState();
          const routeName = state.routes[state.index].name;
          
          // Home screen gets special menu button handling in its own stack
          if (routeName === "Home") return null;

          return (
            <Pressable 
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                if (navigation.canGoBack()) {
                  navigation.goBack();
                } else {
                  navigation.navigate("Home");
                }
              }} 
              style={{ marginLeft: 16 }}
            >
              <Feather name="arrow-left" size={24} color="#C4B5FD" />
            </Pressable>
          );
        },
        headerStyle: {
          backgroundColor: "#0D0B1E",
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTintColor: "#C4B5FD",
        headerTitleStyle: {
          fontWeight: "600",
        },
        drawerStyle: {
          width: 280,
        },
        swipeEdgeWidth: 100,
      })}
    >
      <Drawer.Screen 
        name="Home" 
        component={HomeStackNavigator} 
        options={{ headerShown: false }}
      />
      <Drawer.Screen 
        name="ProfileMain" 
        component={ProfileStackNavigator} 
        options={{ headerShown: false }}
      />
      <Drawer.Screen 
        name="Themes" 
        component={SettingsStackNavigator} 
        options={{ headerTitle: "THEMES & SETTINGS" }}
      />
      <Drawer.Screen 
        name="WalletMain" 
        component={WalletScreen} 
        options={{ headerTitle: "MY WALLET" }}
      />
      <Drawer.Screen 
        name="ConnectionsMain" 
        component={ConnectionsScreen} 
        options={{ headerTitle: "CONNECTIONS" }}
      />
      <Drawer.Screen 
        name="ChampionsMain" 
        component={ChampionsScreen} 
        options={{ headerTitle: "CHAMPIONS" }}
      />
      <Drawer.Screen 
        name="VendorHubMain" 
        component={VendorHubScreen} 
        options={{ headerTitle: "VENDOR HUB" }}
      />
      <Drawer.Screen 
        name="SubscriptionMain" 
        component={SubscriptionScreen} 
        options={{ headerTitle: "SUBSCRIPTIONS" }}
      />
      <Drawer.Screen 
        name="ChangePassword" 
        component={ChangePasswordScreen} 
        options={{ headerTitle: "CHANGE PASSWORD" }}
      />
    </Drawer.Navigator>
  );
}

const styles = StyleSheet.create({
  drawerHeader: {
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: "rgba(124, 58, 237, 0.5)",
  },
  userText: {
    marginLeft: 15,
  },
  userName: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  drawerItems: {
    paddingHorizontal: 10,
  },
  drawerLabel: {
    fontSize: 16,
    fontWeight: "500",
    marginLeft: 0, // Reset margin
  },
  drawerItemStyle: {
    marginVertical: 2,
    marginHorizontal: 8,
    borderRadius: BorderRadius.md,
  },
  subDrawerItem: {
    marginVertical: 0,
    marginHorizontal: 8,
  },
  expandableHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginVertical: 2,
    marginHorizontal: 8,
    borderRadius: BorderRadius.md,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  iconContainer: {
    width: 24,
    alignItems: "center",
    marginRight: 32,
  },
  headerLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: "#C4B5FD",
  },
  subItems: {
    marginLeft: 44,
    backgroundColor: "rgba(139, 127, 199, 0.05)",
    borderLeftWidth: 1,
    borderLeftColor: "rgba(139, 127, 199, 0.2)",
    marginBottom: 8,
  },
  subLabel: {
    fontSize: 14,
    fontWeight: "400",
    marginLeft: -10,
  },
  drawerFooter: {
    padding: 20,
    alignItems: "center",
    borderTopWidth: 1,
  },
});
