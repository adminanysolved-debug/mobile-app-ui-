import React, { createContext, useState, useEffect, ReactNode } from "react";
import { useColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { themes as staticThemes, ThemeType, ThemeColors } from "@/constants/theme";
import { getApiUrl } from "@/lib/query-client";

interface ThemeContextType {
  currentTheme: ThemeType;
  theme: ThemeColors;
  isDark: boolean;
  setThemeById: (id: string) => void;
  purchasedThemes: string[];
  purchaseTheme: (id: string) => void;
  userCoins: number;
  setUserCoins: (coins: number) => void;
  useSystemTheme: boolean;
  setUseSystemTheme: (val: boolean) => void;
  availableThemes: ThemeType[];
}

const THEME_STORAGE_KEY = "@real_dream_theme";
const PURCHASED_THEMES_KEY = "@real_dream_purchased_themes";
const USER_COINS_KEY = "@real_dream_user_coins";
const USE_SYSTEM_THEME_KEY = "@real_dream_use_system_theme";

const defaultTheme = staticThemes.find((t) => t.id === "galaxy") || staticThemes[0];

export const ThemeContext = createContext<ThemeContextType>({
  currentTheme: defaultTheme,
  theme: defaultTheme.colors,
  isDark: true,
  setThemeById: () => {},
  purchasedThemes: [],
  purchaseTheme: () => {},
  userCoins: 2450,
  setUserCoins: () => {},
  useSystemTheme: false,
  setUseSystemTheme: () => {},
  availableThemes: staticThemes,
});

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [currentThemeId, setCurrentThemeId] = useState<string>("galaxy");
  const [purchasedThemes, setPurchasedThemes] = useState<string[]>([
    "galaxy",
    "light",
    "dark",
  ]);
  const [userCoins, setUserCoins] = useState(2450);
  const [useSystemTheme, setUseSystemTheme] = useState(false);
  const [dynamicThemes, setDynamicThemes] = useState<ThemeType[]>([]);
  const colorScheme = useColorScheme();

  useEffect(() => {
    loadStoredData();
    fetchDynamicThemes();
  }, []);

  const fetchDynamicThemes = async () => {
    try {
      const response = await fetch(`${getApiUrl()}/api/themes`);
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          // Map database themes to ThemeType
          const mapped: ThemeType[] = data.map((t: any) => {
            const dbColors = typeof t.colors === 'string' ? JSON.parse(t.colors) : t.colors;
            
            // Ensure gradient exists, fallback to [accent, purple] if missing
            const gradient = dbColors.gradient || [
              dbColors.accent || defaultTheme.colors.accent,
              dbColors.purple || defaultTheme.colors.purple
            ];

            return {
              id: t.id,
              name: t.name,
              isPremium: t.isPremium,
              price: t.price,
              colors: {
                ...defaultTheme.colors, // Use galaxy as base for missing properties
                ...dbColors,
                gradient
              },
              isDynamic: true
            };
          });
          setDynamicThemes(mapped);
        }
      }
    } catch (error) {
      console.log("Error fetching dynamic themes:", error);
    }
  };

  const loadStoredData = async () => {
    try {
      const [storedTheme, storedPurchased, storedCoins, storedSystemTheme] = await Promise.all([
        AsyncStorage.getItem(THEME_STORAGE_KEY),
        AsyncStorage.getItem(PURCHASED_THEMES_KEY),
        AsyncStorage.getItem(USER_COINS_KEY),
        AsyncStorage.getItem(USE_SYSTEM_THEME_KEY),
      ]);

      if (storedTheme) {
        setCurrentThemeId(storedTheme);
      }

      if (storedPurchased) {
        const parsed = JSON.parse(storedPurchased);
        setPurchasedThemes(["galaxy", "light", "dark", ...parsed]);
      }

      if (storedCoins) {
        setUserCoins(parseInt(storedCoins, 10));
      }

      if (storedSystemTheme) {
        setUseSystemTheme(storedSystemTheme === "true");
      }
    } catch (error) {
      console.log("Error loading theme data:", error);
    }
  };

  const setThemeById = async (id: string) => {
    const allThemes = [...staticThemes, ...dynamicThemes];
    const themeExists = allThemes.find((t) => t.id === id);
    if (!themeExists) return;

    if (themeExists.isPremium && !purchasedThemes.includes(id)) {
      return;
    }

    setCurrentThemeId(id);
    setUseSystemTheme(false); // Manually selecting disables auto system match
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, id);
      await AsyncStorage.setItem(USE_SYSTEM_THEME_KEY, "false");
    } catch (error) {
      console.log("Error saving theme:", error);
    }
  };

  const handleSetUseSystemTheme = async (val: boolean) => {
    setUseSystemTheme(val);
    try {
      await AsyncStorage.setItem(USE_SYSTEM_THEME_KEY, val.toString());
    } catch(err) {
       console.log("Error saving useSystemTheme:", err);
    }
  };

  const purchaseTheme = async (id: string) => {
    const allThemes = [...staticThemes, ...dynamicThemes];
    const themeData = allThemes.find((t) => t.id === id);
    if (!themeData || !themeData.isPremium) return;
    if (purchasedThemes.includes(id)) return;

    const price = themeData.price || 0;
    if (userCoins < price) return;

    const newCoins = userCoins - price;
    const newPurchased = [...purchasedThemes, id];

    setUserCoins(newCoins);
    setPurchasedThemes(newPurchased);

    try {
      await Promise.all([
        AsyncStorage.setItem(USER_COINS_KEY, newCoins.toString()),
        AsyncStorage.setItem(
          PURCHASED_THEMES_KEY,
          JSON.stringify(newPurchased.filter((t) => !["galaxy", "light", "dark"].includes(t)))
        ),
      ]);
    } catch (error) {
      console.log("Error saving purchase:", error);
    }
  };

  const handleSetUserCoins = async (coins: number) => {
    setUserCoins(coins);
    try {
      await AsyncStorage.setItem(USER_COINS_KEY, coins.toString());
    } catch (error) {
      console.log("Error saving coins:", error);
    }
  };

  const allThemes = [...staticThemes, ...dynamicThemes];

  // Resolve active theme based on auto-detection or manual selection
  const resolvedThemeId = useSystemTheme ? (colorScheme === "dark" ? "galaxy" : "light") : currentThemeId;
  const currentTheme = allThemes.find((t) => t.id === resolvedThemeId) || defaultTheme;
  const isDark = currentTheme.id !== "light";

  return (
    <ThemeContext.Provider
      value={{
        currentTheme,
        theme: currentTheme.colors,
        isDark,
        setThemeById,
        purchasedThemes,
        purchaseTheme,
        userCoins,
        setUserCoins: handleSetUserCoins,
        useSystemTheme,
        setUseSystemTheme: handleSetUseSystemTheme,
        availableThemes: allThemes,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}
