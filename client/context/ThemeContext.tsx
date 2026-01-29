import React, { createContext, useState, useEffect, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { themes, ThemeType, ThemeColors } from "@/constants/theme";

interface ThemeContextType {
  currentTheme: ThemeType;
  theme: ThemeColors;
  isDark: boolean;
  setThemeById: (id: string) => void;
  purchasedThemes: string[];
  purchaseTheme: (id: string) => void;
  userCoins: number;
  setUserCoins: (coins: number) => void;
}

const THEME_STORAGE_KEY = "@real_dream_theme";
const PURCHASED_THEMES_KEY = "@real_dream_purchased_themes";
const USER_COINS_KEY = "@real_dream_user_coins";

const defaultTheme = themes.find((t) => t.id === "galaxy") || themes[0];

export const ThemeContext = createContext<ThemeContextType>({
  currentTheme: defaultTheme,
  theme: defaultTheme.colors,
  isDark: true,
  setThemeById: () => {},
  purchasedThemes: [],
  purchaseTheme: () => {},
  userCoins: 2450,
  setUserCoins: () => {},
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

  useEffect(() => {
    loadStoredData();
  }, []);

  const loadStoredData = async () => {
    try {
      const [storedTheme, storedPurchased, storedCoins] = await Promise.all([
        AsyncStorage.getItem(THEME_STORAGE_KEY),
        AsyncStorage.getItem(PURCHASED_THEMES_KEY),
        AsyncStorage.getItem(USER_COINS_KEY),
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
    } catch (error) {
      console.log("Error loading theme data:", error);
    }
  };

  const setThemeById = async (id: string) => {
    const themeExists = themes.find((t) => t.id === id);
    if (!themeExists) return;

    if (themeExists.isPremium && !purchasedThemes.includes(id)) {
      return;
    }

    setCurrentThemeId(id);
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, id);
    } catch (error) {
      console.log("Error saving theme:", error);
    }
  };

  const purchaseTheme = async (id: string) => {
    const themeData = themes.find((t) => t.id === id);
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

  const currentTheme = themes.find((t) => t.id === currentThemeId) || defaultTheme;
  const isDark =
    currentThemeId === "galaxy" || currentThemeId === "dark" || currentThemeId === "midnight";

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
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}
