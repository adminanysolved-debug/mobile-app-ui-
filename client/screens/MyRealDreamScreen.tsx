import { View, StyleSheet, ScrollView, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useNavigation } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";

import { ThemedText } from "@/components/ThemedText";
import { GalaxyBackground } from "@/components/GalaxyBackground";
import { Card } from "@/components/Card";
import { AdBanner } from "@/components/AdBanner";
import { Spacing, BorderRadius } from "@/constants/theme";

type DreamTypeItem = {
  type: "personal" | "challenge" | "group";
  title: string;
  subtitle: string;
  description: string;
  icon: keyof typeof Feather.glyphMap;
  gradient: [string, string];
  route: string;
};

const dreamTypes: DreamTypeItem[] = [
  {
    type: "personal",
    title: "Personal Dreams",
    subtitle: "PERSONAL REALDREAM",
    description: "Set and achieve your individual goals and aspirations. Track your personal journey to success.",
    icon: "user",
    gradient: ["#3B82F6", "#60A5FA"],
    route: "PersonalDreams",
  },
  {
    type: "group",
    title: "Group Dreams",
    subtitle: "GROUP REALDREAM",
    description: "Collaborate with your team to achieve shared goals. Work together for success.",
    icon: "users",
    gradient: ["#8B5CF6", "#A855F7"],
    route: "GroupDreams",
  },
  {
    type: "challenge",
    title: "Challenges",
    subtitle: "REALDREAM CHALLENGE",
    description: "Compete with others and push your limits. Join challenges or create your own.",
    icon: "award",
    gradient: ["#EAB308", "#FCD34D"],
    route: "ChallengeDreams",
  },
];

function DreamTypeCard({ item, index }: { item: DreamTypeItem; index: number }) {
  const navigation = useNavigation<any>();

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate(item.route);
  };

  return (
    <Animated.View entering={FadeInDown.delay(index * 100).springify()}>
      <Card onPress={handlePress} style={styles.typeCard}>
        <LinearGradient
          colors={item.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.iconContainer}
        >
          <Feather name={item.icon} size={32} color="#FFFFFF" />
        </LinearGradient>
        <View style={styles.cardContent}>
          <ThemedText type="xs" style={styles.cardSubtitle}>{item.subtitle}</ThemedText>
          <ThemedText type="h3" style={styles.cardTitle}>{item.title}</ThemedText>
          <ThemedText type="small" style={styles.cardDescription}>
            {item.description}
          </ThemedText>
        </View>
        <View style={styles.arrowContainer}>
          <Feather name="chevron-right" size={24} color="#C4B5FD" />
        </View>
      </Card>
    </Animated.View>
  );
}

export default function MyRealDreamScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();

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
      >
        <Animated.View entering={FadeInDown.springify()}>
          <ThemedText type="body" style={styles.headerText}>
            Choose a dream type to get started
          </ThemedText>
        </Animated.View>

        <AdBanner />

        {dreamTypes.map((item, index) => (
          <DreamTypeCard key={item.type} item={item} index={index} />
        ))}
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
  headerText: {
    color: "#C4B5FD",
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  typeCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    backgroundColor: "rgba(45, 39, 82, 0.6)",
    borderWidth: 1,
    borderColor: "rgba(139, 127, 199, 0.2)",
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.lg,
  },
  cardContent: {
    flex: 1,
    gap: 4,
  },
  cardSubtitle: {
    color: "#8B7FC7",
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  cardTitle: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  cardDescription: {
    color: "#C4B5FD",
    marginTop: Spacing.xs,
  },
  arrowContainer: {
    marginLeft: Spacing.sm,
  },
});
