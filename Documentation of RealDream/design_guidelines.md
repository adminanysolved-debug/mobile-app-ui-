# Real Dream App - Design Guidelines

## Overview
Real Dream is a goal-tracking and dream achievement mobile app that helps users set, track, and achieve their personal and group goals. It features gamification elements like coins, awards, leaderboards, and a lucky wheel.

## App Purpose & Features
- **Goal Setting**: Create personal dreams, challenges, and group goals
- **Social Features**: Connect with others, share progress, news feed
- **Gamification**: Coins, awards, champions leaderboard, lucky wheel
- **Marketplace**: Buy and sell dream-related items
- **Wallet**: Manage coins and track transactions

## Color Palette

### Default Theme: Galaxy (Purple/Dark)
The Galaxy theme is the **default theme** for all screens. It features a dark purple gradient background with a cosmic/space aesthetic.

#### Galaxy Theme Colors
- **Background Root**: `#0D0B1E` - Deep space purple
- **Background Default**: `#1A1533` - Dark purple
- **Background Secondary**: `#2D2752` - Medium purple (glass effects)
- **Text Primary**: `#FFFFFF` - White
- **Text Secondary**: `#C4B5FD` - Light purple
- **Text Muted**: `#8B7FC7` - Muted purple
- **Accent**: `#A78BFA` - Bright purple
- **Gradient Primary**: `#7C3AED` → `#A855F7` → `#EC4899` - Purple to pink

#### Galaxy Theme UI Elements
- **Glass Input Fields**: `rgba(45, 39, 82, 0.6)` with subtle border `rgba(139, 127, 199, 0.3)`
- **Gradient Buttons**: Linear gradient from purple (#7C3AED) to pink (#EC4899)
- **Star Decorations**: Small white dots scattered across backgrounds
- **Social Buttons**: Google (red #EA4335), Apple (black), Facebook (blue #1877F2)

### Alternative Themes
- **Light Theme**: Traditional light mode with white backgrounds
- **Dark Theme**: Standard dark mode with gray backgrounds
- **Premium Themes**: Ocean, Sunset, Forest, Lavender, Rose, Midnight (purchased with coins)

### Accent Colors
- **Purple**: `#A78BFA` - Primary accent in Galaxy theme
- **Yellow/Gold**: `#FBBF24` - Champions, achievements, gold rank
- **Green**: `#22C55E` - Success, completed goals
- **Pink**: `#EC4899` - Gallery, creative elements
- **Blue**: `#60A5FA` - Links, secondary actions

## Typography

### Font Family
- Primary: System font (San Francisco on iOS, Roboto on Android)
- Use rounded variant for headings when available

### Font Sizes
- **H1**: 32px, Bold (700) - Main screen titles
- **H2**: 24px, Bold (700) - Section headers
- **H3**: 20px, SemiBold (600) - Card titles
- **H4**: 18px, SemiBold (600) - Subsection headers
- **Body**: 16px, Regular (400) - Main content
- **Body Bold**: 16px, Medium (500) - Emphasized text
- **Small**: 14px, Regular (400) - Descriptions, captions
- **XS**: 12px, Regular (400) - Labels, badges

## Spacing
- **XS**: 4px - Icon padding, minimal gaps
- **SM**: 8px - Compact spacing
- **MD**: 12px - Standard spacing
- **LG**: 16px - Content padding
- **XL**: 20px - Section spacing
- **2XL**: 24px - Card padding
- **3XL**: 32px - Major section gaps

## Border Radius
- **Small**: 8px - Buttons, inputs, small elements
- **Medium**: 12px - Chips, badges
- **Large**: 16px - Cards, modals
- **XL**: 20px - Large cards
- **2XL**: 24px - Hero cards
- **Full**: 9999px - Avatars, pills, circular buttons

## Components

### Cards
- Background: White (light) / gray-700 (dark)
- Border radius: 16px
- Padding: 16-24px
- No shadows - use subtle background color elevation
- Press state: slight scale (0.98) + opacity change

### Buttons
- **Primary**: Blue-600 background, white text, rounded-full (pill shape)
- **Secondary/Outline**: Transparent with border, blue text
- Height: 52px for main CTAs, 40px for secondary
- Press feedback: scale 0.98

### Input Fields
- Background: gray-100 (light) / gray-700 (dark)
- Border radius: 12px
- Height: 48px
- Placeholder: gray-400
- Focus: Blue border or highlight

### Bottom Navigation
- 4 tabs: Home, RealDream (Target), Profile, Settings
- Active: Blue-600 color
- Inactive: Gray-500
- Icons: Feather icons (home, target, user, settings)
- Background: White with blur effect on iOS

### App Header
- Sticky top position
- White background with subtle border
- Back button on left (when applicable)
- Title centered
- Action buttons on right (messages, notifications, lucky wheel)

### Avatars
- Circular shape
- Gradient backgrounds: Blue-500 to Purple-500
- Initials or icons inside
- Sizes: 40px (small), 48px (medium), 80px (large), 96px (profile)

### Badges & Pills
- Rounded-full shape
- Small padding (8px horizontal, 4px vertical)
- Background: Color-100 with Color-700 text
- Examples: Year badges, rank badges, category chips

## Screen Patterns

### List Screens
- Gray-50 background
- White cards for content groups
- Section headers in gray-500, uppercase, 12px

### Profile/Settings
- Header card with avatar and main info
- Grouped menu items in cards
- Chevron indicators for navigation items
- Icon + Label + Chevron pattern

### Tab Switching
- Segmented control style
- White/gray background container
- Active: Blue-600 background, white text
- Inactive: Transparent, gray text

## Gradients
- **Primary Avatar**: `from-blue-500 to-purple-500`
- **Achievement**: `from-purple-500 to-pink-500`
- **Login Background**: `from-blue-50 to-blue-100`
- **Gold Rank**: `from-yellow-400 to-yellow-600`

## Icons
- Use Feather icons from @expo/vector-icons
- Standard size: 20-24px
- Consistent stroke width
- Key icons:
  - Home, Target, User, Settings (bottom nav)
  - Trophy, Award, Crown (champions)
  - Wallet, Coins, CreditCard (wallet)
  - MessageSquare, Bell (communication)
  - Plus, Edit, Trash (actions)
  - ChevronRight (navigation)
  - ArrowLeft (back)
  - Gem (lucky wheel)

## Empty States
- Centered illustration/icon
- Heading explaining empty state
- Subtext with action suggestion
- Optional CTA button

## Loading States
- Skeleton shimmer effect
- Match content layout
- Gray-200 placeholder colors

## Animations
- Press feedback: 0.98 scale with spring
- Page transitions: Horizontal slide
- Modal: Slide up from bottom
- Tab switch: Cross-fade
- Haptic feedback on key actions

## Accessibility
- Minimum touch target: 44x44px
- Color contrast: WCAG AA compliant
- Clear focus states
- Descriptive labels for interactive elements

## Special Features

### Lucky Wheel
- Purple gem icon in header
- Gamification element for rewards

### Wallet System
- Coin balance display
- Transaction history
- Award badges collection
- Add/Send/Withdraw actions

### Champions/Leaderboard
- Top 3 with special styling (gold, silver, bronze)
- Crown icon for #1
- Progress stats display
- Period tabs (monthly, yearly, all-time)

### RealDream Goals
- Three types: Personal, Challenge, Group
- Color-coded icons
- Progress tracking
- Goal icons grid display

## Brand Elements
- App Name: "Real Dream"
- Logo: Blue square with "RD" text
- Tagline: Goal achievement and dream tracking
