# Guide: Creating Custom Themes for RealDream App

This document explains how to create new themes and add them to the mobile app seamlessly through the Admin Panel.

## 1. Overview
The RealDream app's theming system uses dynamic JSON-based styling. The app fetches themes from the backend server, allowing you to create and deploy new themes instantly without needing to release an app store update or modify React Native source code directly (like `client/constants/theme.ts`).

Each theme in the database (`themes` table) consists of:
- **Name**: The display name of the theme (e.g., "Midnight", "Ocean").
- **isPremium**: A flag indicating whether the theme requires users to purchase it.
- **Price**: If premium, the amount of coins/currency required to unlock it.
- **isActive**: Whether the theme is currently enabled and visible to end-users.
- **Colors**: A structured JSON object defining the semantic color tokens to be injected into the app.

## 2. Adding a Theme via Admin Panel
1. Access the **Admin Web Panel** (`admin-system/admin-web`).
2. Navigate to the **Theme Management** page.
3. Click to Add a New Theme or fill out the theme creation form.
4. Input the basic details (`name`, check `isPremium` if applicable, and set a `price`).
5. Specify the Theme Colors. This is the most crucial part! You must provide valid hex codes.
6. **Save** the theme. Setting `isActive` to true ensures that it will immediately sync down to the app's Theme settings.

## 3. The `colors` JSON Structure
When defining the colors for a theme in the admin panel, you must provide a fully populated JSON structure. Missing fields may cause UI components to render transparent or throw errors.

Here is the exact structure that the mobile app (`ThemeColors` type) expects:

```json
{
  "text": "#E2E8F0",
  "textSecondary": "#94A3B8",
  "textMuted": "#475569",
  "buttonText": "#FFFFFF",
  "tabIconDefault": "#64748B",
  "tabIconSelected": "#818CF8",
  "link": "#818CF8",
  "backgroundRoot": "#020617",
  "backgroundDefault": "#0F172A",
  "backgroundSecondary": "#1E293B",
  "backgroundTertiary": "#334155",
  "border": "#334155",
  "borderLight": "#1E293B",
  "success": "#22C55E",
  "warning": "#F59E0B",
  "error": "#EF4444",
  "blue": "#60A5FA",
  "purple": "#A78BFA",
  "yellow": "#FBBF24",
  "green": "#4ADE80",
  "pink": "#F472B6",
  "orange": "#FB923C",
  "indigo": "#818CF8",
  "accent": "#818CF8",
  "accentLight": "#312E81",
  "gradient": ["#6366F1", "#8B5CF6"],
  "inputBackground": "#1E293B"
}
```

### Token Definitions

**Backgrounds:**
- **backgroundRoot**: The absolute base layer (full screen background).
- **backgroundDefault**: The primary background for content cards/sections.
- **backgroundSecondary / Tertiary**: Elevated layers, modals, flyouts, nested cards.

**Typography & Interaction:**
- **text**: Primary contrast color (usually near white/black).
- **textSecondary / textMuted**: Subdued elements, dates, captions.
- **accent / accentLight**: Your brand's main color for primary buttons, toggles, highlight states.
- **tabIconDefault / tabIconSelected**: Unselected vs active states in the bottom app bar.

**Special Purpose:**
- **gradient**: **Must** be a JSON array containing exactly two strings (hex codes). Used heavily as a premium vibe visual across buttons or headers.
- **inputBackground**: Background color for TextInputs. Needs sufficient contrast against the text color.
- **success, warning, error**: Semantic alerts and validation feedback.

## 4. How the App Reflects It
1. The app stores an active theme state in its `ThemeContext`.
2. When the app initializes or the user opens the "Themes" screen (`client/screens/ThemeScreen.tsx`), it fetches the `themes` table from the API.
3. If a user purchases or selects your newly created theme, the Context broadcasts the new `colors` object to all custom hooks (like `useTheme`).
4. Reusable components (e.g., `ThemedView`, `ThemedText`) and styling hooks instantly repaint using the retrieved JSON without requiring a restart.
