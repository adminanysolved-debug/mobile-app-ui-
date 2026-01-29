import { Platform } from "react-native";

export type ThemeType = {
  id: string;
  name: string;
  isPremium: boolean;
  price?: number;
  colors: ThemeColors;
};

export type ThemeColors = {
  text: string;
  textSecondary: string;
  textMuted: string;
  buttonText: string;
  tabIconDefault: string;
  tabIconSelected: string;
  link: string;
  backgroundRoot: string;
  backgroundDefault: string;
  backgroundSecondary: string;
  backgroundTertiary: string;
  border: string;
  borderLight: string;
  success: string;
  warning: string;
  error: string;
  blue: string;
  purple: string;
  yellow: string;
  green: string;
  pink: string;
  orange: string;
  indigo: string;
  accent: string;
  accentLight: string;
  gradient: [string, string];
  inputBackground: string;
};

const galaxyTheme: ThemeColors = {
  text: "#FFFFFF",
  textSecondary: "#C4B5FD",
  textMuted: "#8B7FC7",
  buttonText: "#FFFFFF",
  tabIconDefault: "#8B7FC7",
  tabIconSelected: "#A78BFA",
  link: "#C4B5FD",
  backgroundRoot: "#0D0B1E",
  backgroundDefault: "#1A1533",
  backgroundSecondary: "#2D2752",
  backgroundTertiary: "#3D3666",
  border: "#3D3666",
  borderLight: "#2D2752",
  success: "#22C55E",
  warning: "#F59E0B",
  error: "#EF4444",
  blue: "#60A5FA",
  purple: "#A78BFA",
  yellow: "#FBBF24",
  green: "#4ADE80",
  pink: "#F472B6",
  orange: "#FB923C",
  indigo: "#818CF8",
  accent: "#A78BFA",
  accentLight: "#4C1D95",
  gradient: ["#7C3AED", "#EC4899"],
  inputBackground: "#2D2752",
};

const lightTheme: ThemeColors = {
  text: "#111827",
  textSecondary: "#6B7280",
  textMuted: "#9CA3AF",
  buttonText: "#FFFFFF",
  tabIconDefault: "#6B7280",
  tabIconSelected: "#3B82F6",
  link: "#3B82F6",
  backgroundRoot: "#F3F4F6",
  backgroundDefault: "#FFFFFF",
  backgroundSecondary: "#F3F4F6",
  backgroundTertiary: "#E5E7EB",
  border: "#E5E7EB",
  borderLight: "#F3F4F6",
  success: "#22C55E",
  warning: "#F59E0B",
  error: "#EF4444",
  blue: "#3B82F6",
  purple: "#8B5CF6",
  yellow: "#EAB308",
  green: "#22C55E",
  pink: "#EC4899",
  orange: "#F97316",
  indigo: "#6366F1",
  accent: "#3B82F6",
  accentLight: "#DBEAFE",
  gradient: ["#3B82F6", "#8B5CF6"],
  inputBackground: "#F3F4F6",
};

const darkTheme: ThemeColors = {
  text: "#F3F4F6",
  textSecondary: "#9CA3AF",
  textMuted: "#6B7280",
  buttonText: "#FFFFFF",
  tabIconDefault: "#6B7280",
  tabIconSelected: "#60A5FA",
  link: "#60A5FA",
  backgroundRoot: "#0F172A",
  backgroundDefault: "#1E293B",
  backgroundSecondary: "#334155",
  backgroundTertiary: "#475569",
  border: "#334155",
  borderLight: "#1E293B",
  success: "#22C55E",
  warning: "#F59E0B",
  error: "#EF4444",
  blue: "#60A5FA",
  purple: "#A78BFA",
  yellow: "#FBBF24",
  green: "#4ADE80",
  pink: "#F472B6",
  orange: "#FB923C",
  indigo: "#818CF8",
  accent: "#60A5FA",
  accentLight: "#1E3A5F",
  gradient: ["#3B82F6", "#8B5CF6"],
  inputBackground: "#334155",
};

const oceanTheme: ThemeColors = {
  text: "#0C4A6E",
  textSecondary: "#0369A1",
  textMuted: "#7DD3FC",
  buttonText: "#FFFFFF",
  tabIconDefault: "#38BDF8",
  tabIconSelected: "#0284C7",
  link: "#0284C7",
  backgroundRoot: "#E0F2FE",
  backgroundDefault: "#F0F9FF",
  backgroundSecondary: "#BAE6FD",
  backgroundTertiary: "#7DD3FC",
  border: "#7DD3FC",
  borderLight: "#BAE6FD",
  success: "#22C55E",
  warning: "#F59E0B",
  error: "#EF4444",
  blue: "#0EA5E9",
  purple: "#8B5CF6",
  yellow: "#EAB308",
  green: "#22C55E",
  pink: "#EC4899",
  orange: "#F97316",
  indigo: "#6366F1",
  accent: "#0284C7",
  accentLight: "#BAE6FD",
  gradient: ["#0EA5E9", "#06B6D4"],
  inputBackground: "#BAE6FD",
};

const sunsetTheme: ThemeColors = {
  text: "#7C2D12",
  textSecondary: "#C2410C",
  textMuted: "#FDBA74",
  buttonText: "#FFFFFF",
  tabIconDefault: "#FB923C",
  tabIconSelected: "#EA580C",
  link: "#EA580C",
  backgroundRoot: "#FFF7ED",
  backgroundDefault: "#FFFBEB",
  backgroundSecondary: "#FED7AA",
  backgroundTertiary: "#FDBA74",
  border: "#FDBA74",
  borderLight: "#FED7AA",
  success: "#22C55E",
  warning: "#F59E0B",
  error: "#EF4444",
  blue: "#3B82F6",
  purple: "#8B5CF6",
  yellow: "#EAB308",
  green: "#22C55E",
  pink: "#EC4899",
  orange: "#F97316",
  indigo: "#6366F1",
  accent: "#EA580C",
  accentLight: "#FED7AA",
  gradient: ["#F97316", "#EF4444"],
  inputBackground: "#FED7AA",
};

const forestTheme: ThemeColors = {
  text: "#14532D",
  textSecondary: "#166534",
  textMuted: "#86EFAC",
  buttonText: "#FFFFFF",
  tabIconDefault: "#4ADE80",
  tabIconSelected: "#16A34A",
  link: "#16A34A",
  backgroundRoot: "#F0FDF4",
  backgroundDefault: "#ECFDF5",
  backgroundSecondary: "#BBF7D0",
  backgroundTertiary: "#86EFAC",
  border: "#86EFAC",
  borderLight: "#BBF7D0",
  success: "#22C55E",
  warning: "#F59E0B",
  error: "#EF4444",
  blue: "#3B82F6",
  purple: "#8B5CF6",
  yellow: "#EAB308",
  green: "#22C55E",
  pink: "#EC4899",
  orange: "#F97316",
  indigo: "#6366F1",
  accent: "#16A34A",
  accentLight: "#BBF7D0",
  gradient: ["#22C55E", "#14B8A6"],
  inputBackground: "#BBF7D0",
};

const lavenderTheme: ThemeColors = {
  text: "#4C1D95",
  textSecondary: "#6D28D9",
  textMuted: "#C4B5FD",
  buttonText: "#FFFFFF",
  tabIconDefault: "#A78BFA",
  tabIconSelected: "#7C3AED",
  link: "#7C3AED",
  backgroundRoot: "#F5F3FF",
  backgroundDefault: "#FAF5FF",
  backgroundSecondary: "#DDD6FE",
  backgroundTertiary: "#C4B5FD",
  border: "#C4B5FD",
  borderLight: "#DDD6FE",
  success: "#22C55E",
  warning: "#F59E0B",
  error: "#EF4444",
  blue: "#3B82F6",
  purple: "#8B5CF6",
  yellow: "#EAB308",
  green: "#22C55E",
  pink: "#EC4899",
  orange: "#F97316",
  indigo: "#6366F1",
  accent: "#7C3AED",
  accentLight: "#DDD6FE",
  gradient: ["#8B5CF6", "#EC4899"],
  inputBackground: "#DDD6FE",
};

const roseTheme: ThemeColors = {
  text: "#881337",
  textSecondary: "#BE185D",
  textMuted: "#FBCFE8",
  buttonText: "#FFFFFF",
  tabIconDefault: "#F472B6",
  tabIconSelected: "#DB2777",
  link: "#DB2777",
  backgroundRoot: "#FDF2F8",
  backgroundDefault: "#FFF1F2",
  backgroundSecondary: "#FECDD3",
  backgroundTertiary: "#FBCFE8",
  border: "#FBCFE8",
  borderLight: "#FECDD3",
  success: "#22C55E",
  warning: "#F59E0B",
  error: "#EF4444",
  blue: "#3B82F6",
  purple: "#8B5CF6",
  yellow: "#EAB308",
  green: "#22C55E",
  pink: "#EC4899",
  orange: "#F97316",
  indigo: "#6366F1",
  accent: "#DB2777",
  accentLight: "#FECDD3",
  gradient: ["#EC4899", "#F43F5E"],
  inputBackground: "#FECDD3",
};

const midnightTheme: ThemeColors = {
  text: "#E2E8F0",
  textSecondary: "#94A3B8",
  textMuted: "#475569",
  buttonText: "#FFFFFF",
  tabIconDefault: "#64748B",
  tabIconSelected: "#818CF8",
  link: "#818CF8",
  backgroundRoot: "#020617",
  backgroundDefault: "#0F172A",
  backgroundSecondary: "#1E293B",
  backgroundTertiary: "#334155",
  border: "#334155",
  borderLight: "#1E293B",
  success: "#22C55E",
  warning: "#F59E0B",
  error: "#EF4444",
  blue: "#60A5FA",
  purple: "#A78BFA",
  yellow: "#FBBF24",
  green: "#4ADE80",
  pink: "#F472B6",
  orange: "#FB923C",
  indigo: "#818CF8",
  accent: "#818CF8",
  accentLight: "#312E81",
  gradient: ["#6366F1", "#8B5CF6"],
  inputBackground: "#1E293B",
};

export const themes: ThemeType[] = [
  { id: "galaxy", name: "Galaxy", isPremium: false, colors: galaxyTheme },
  { id: "light", name: "Light", isPremium: false, colors: lightTheme },
  { id: "dark", name: "Dark", isPremium: false, colors: darkTheme },
  { id: "ocean", name: "Ocean", isPremium: true, price: 99, colors: oceanTheme },
  { id: "sunset", name: "Sunset", isPremium: true, price: 99, colors: sunsetTheme },
  { id: "forest", name: "Forest", isPremium: true, price: 149, colors: forestTheme },
  { id: "lavender", name: "Lavender", isPremium: true, price: 149, colors: lavenderTheme },
  { id: "rose", name: "Rose", isPremium: true, price: 199, colors: roseTheme },
  { id: "midnight", name: "Midnight", isPremium: true, price: 199, colors: midnightTheme },
];

export const Colors = {
  light: lightTheme,
  dark: darkTheme,
  galaxy: galaxyTheme,
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 32,
  "4xl": 40,
  "5xl": 48,
  inputHeight: 52,
  buttonHeight: 56,
};

export const BorderRadius = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  "2xl": 32,
  "3xl": 40,
  full: 9999,
};

export const Typography = {
  h1: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: "700" as const,
  },
  h2: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: "700" as const,
  },
  h3: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: "600" as const,
  },
  h4: {
    fontSize: 18,
    lineHeight: 26,
    fontWeight: "600" as const,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "400" as const,
  },
  bodyMedium: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "500" as const,
  },
  small: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "400" as const,
  },
  xs: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "400" as const,
  },
  link: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "400" as const,
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: "system-ui",
    serif: "ui-serif",
    rounded: "ui-rounded",
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded:
      "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
