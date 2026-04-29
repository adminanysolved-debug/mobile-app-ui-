# Tasks

- [x] Research Cloudinary implementation <!-- id: 0 -->
    - [x] Inspect `server/src/cloudinary-storage.ts` for configuration <!-- id: 1 -->
    - [x] Inspect `server/src/routes.ts` for file upload logic <!-- id: 2 -->
    - [x] Inspect `client/screens/ProfileScreen.tsx` for frontend display logic <!-- id: 3 -->
- [x] Identify the cause of the profile picture not showing <!-- id: 4 -->
- [x] Implement fix for profile picture upload/display <!-- id: 5 -->
- [x] Verify the fix <!-- id: 6 -->
- [x] Cleanup and push changes to GitHub <!-- id: 7 -->
- [x] Implement login persistence <!-- id: 8 -->
- [x] Configure Firebase native persistence in `lib/firebase.ts` <!-- id: 9 -->
- [x] Call `loadStoredAuth` in `AuthContext.tsx` <!-- id: 10 -->
- [x] Resolve TypeScript import error for `firebase/auth/react-native` <!-- id: 12 -->
- [x] Verify login persistence <!-- id: 11 -->
- [x] Admin System Overhaul <!-- id: 13 -->
    - [x] Research & Planning <!-- id: 14 -->
    - [x] Implement Admin Server Auth <!-- id: 15 -->
    - [x] Update Admin Server Queries <!-- id: 16 -->
    - [x] Create Admin Web Login Page <!-- id: 17 -->
    - [x] Implement Admin Web Protected Routes <!-- id: 18 -->
    - [x] Update Admin Web User Management UI <!-- id: 19 -->
    - [x] Final Production Review <!-- id: 20 -->

- [x] Phase 2: Design & Security Enhancements <!-- id: 21 -->
    - [x] Research & Dependency Setup (`nodemailer`, `framer-motion`) <!-- id: 22 -->
    - [x] Implement Real-time System Health API <!-- id: 23 -->
    - [x] Implement SMTP Password Reset & Change Password logic <!-- id: 24 -->
    - [x] Futuristic "Nexus Core" UI Redesign (Animations, Glows, Glassmorphism) <!-- id: 25 -->
    - [x] Verify UI consistency and functional integrity <!-- id: 26 -->

- [x] Phase 3: Rebranding & Content Moderation <!-- id: 27 -->
    - [x] Rebrand system to "RealDream Admin" & simplify UI names <!-- id: 28 -->
    - [x] Implement Dashboard Pulse & Cursor Glow effect <!-- id: 29 -->
    - [x] Fix User Deletion logic (Foreign Key constraints) <!-- id: 30 -->
    - [x] Add Post & Comment Deletion UI/API (Admin only) <!-- id: 31 -->
    - [x] Final production verification <!-- id: 32 -->

- [x] Phase 4: Project Cleanup <!-- id: 33 -->
    - [x] Identify & remove unnecessary temporary files and logs <!-- id: 34 -->
    - [x] Final project structure verification <!-- id: 35 -->

- [x] Phase 5: Feature Gap Analysis (Excel Comparison) <!-- id: 36 -->
    - [x] Extract and review 108 features from Excel <!-- id: 37 -->
    - [x] Prioritize "Version 3" features for implementation <!-- id: 38 -->
    - [x] Create detailed implementation plan for major gaps <!-- id: 39 -->

- [x] Phase 6: Subscriptions & Payments Implementation <!-- id: 40 -->
    - [x] Update DB schema for Subscription tiers and limits <!-- id: 41 -->
    - [x] Enhance Storage layer for dream limits and Marketplace conversion <!-- id: 41.1 -->
    - [x] Implement backend Subscription & Dummy Payment API <!-- id: 41.2 -->
    - [x] Create Subscriptions UI with 3 tiers (Silver, Gold, Platinum) <!-- id: 42 -->
    - [x] Implement dummy payment flow (Card: 4242...) <!-- id: 43 -->
    - [x] Add introductory 6-month free offer logic <!-- id: 44 -->

- [x] Phase 7: Marketplace & Vendor Enhancements <!-- id: 50 -->
    - [x] Add "How to achieve" field to marketplace dreams <!-- id: 51 -->
    - [x] Implement purchase-to-dream conversion logic <!-- id: 52 -->
    - [x] Hide "how to achieve" details until purchase <!-- id: 53 -->
    - [x] Update marketplace to show only dream name & details <!-- id: 54 -->
    - [x] Synchronize Admin with Marketplace dreams <!-- id: 55 -->

- [x] Phase 8: Profile & Social Features <!-- id: 60 -->
    - [x] Implement Profile Photo Upload/Delete (Cloudinary) <!-- id: 61 -->
    - [x] Add View Public Profile functionality <!-- id: 62 -->
    - [x] Create News Feed with Post Creation/Deletion <!-- id: 63 -->
    - [x] Add wallet stats (coins, trophies) to Profile <!-- id: 64 -->
    - [x] Create Leaderboard and Wall of Fame <!-- id: 65 -->

- [x] Phase 10: Admin Dashboard Synchronization <!-- id: 56 -->
    - [x] Update Admin to manage Subscriptions and Marketplace Dreams <!-- id: 57 -->
    - [x] Add system-wide moderation for new social content (Posts/Comments) <!-- id: 58 -->

- [x] Phase 11: Promotional Popup Ad <!-- id: 70 -->
    - [x] Update DB schema with `active_ads` table <!-- id: 71 -->
    - [x] Implement Admin API for Ad management <!-- id: 72 -->
    - [x] Create Admin Web Promotions page <!-- id: 73 -->
    - [x] Implement Mobile `AdPopup` component <!-- id: 74 -->
    - [x] Verify global popup triggers and close logic <!-- id: 75 -->

- [x] Phase 12: Marketplace & Promotion Refinements <!-- id: 80 -->
    - [x] Debug Ad Popup visibility and `API_URL` <!-- id: 81 -->
    - [x] Add Video Ad support (Schema, Admin UI, Mobile Player) <!-- id: 82 -->
    - [x] Restrict Vendor Hub to "Dream" category only <!-- id: 83 -->
    - [x] Fix "How to Achieve" visibility in Vendor Hub <!-- id: 84 -->
    - [x] Implement User Post Delete option in News Feed <!-- id: 85 -->
    - [x] Enhance Admin control over Marketplace items <!-- id: 86 -->

- [x] Phase 13: Admin Promotions Upload <!-- id: 90 -->
    - [x] Install `multer` and `cloudinary` in Admin Server <!-- id: 91 -->
    - [x] Create `cloudinary.ts` utility in Admin Server <!-- id: 92 -->
    - [x] Add `POST /api/admin/upload` endpoint <!-- id: 93 -->
    - [x] Update `Promotions.tsx` with File Upload input & logic <!-- id: 94 -->

- [x] Phase 14: Screen-Targeted Promotions <!-- id: 100 -->
    - [x] Add `target_screens` to `active_ads` DB schema <!-- id: 101 -->
    - [x] Push DB updates to Neon via `drizzle-kit` <!-- id: 102 -->
    - [x] Update Admin Server endpoints to persist target screens <!-- id: 103 -->
    - [x] Upgrade Admin Web `Promotions.tsx` UI with screen selectors <!-- id: 104 -->
    - [x] Update Mobile `AdPopup.tsx` and move into NavigationContainer for contextual awareness <!-- id: 105 -->

- [x] Phase 15: Vendor Marketplace Dream Execution <!-- id: 110 -->
    - [x] Update `VendorHubScreen.tsx` with dynamic task creator and Bio (Description) UI <!-- id: 111 -->
    - [x] Serialize `tasks` and `description` payload securely to backend <!-- id: 112 -->
    - [x] Update `MarketScreen.tsx` to show Bio and allow Selecting Personal/Team type upon purchase <!-- id: 113 -->
    - [x] Add Friend Invitation UI in Market purchase modal for Team Dreams <!-- id: 116 -->
    - [x] Upgrade backend route to handle `dreamType` and `invitedUserIds` during purchase <!-- id: 114 -->
    - [x] Auto-Create `Personal/Team Dream` & Bulk Insert `DreamTasks` with notifications during purchase callback <!-- id: 115 -->
- [x] Phase 16: Navigation Refactor & Feature Audit <!-- id: 120 -->
    - [x] Audit all requested features against current implementation <!-- id: 121 -->
    - [x] Create `MainDrawerNavigator.tsx` to replace `MainTabNavigator.tsx` <!-- id: 122 -->
    - [x] Update `RootStackNavigator.tsx` to integrate Drawer Navigation <!-- id: 123 -->
    - [x] Implement Drawer Header with Hamburger menu on Home, Profile, and Settings <!-- id: 124 -->
    - [x] Refine Dream Privacy UI labels (Public/Connections/Private) <!-- id: 125 -->
    - [x] Fix navigation crash by removing `useBottomTabBarHeight` from all screens <!-- id: 127 -->
    - [x] Standardize Drawer Item alignment and styling <!-- id: 128 -->
    - [x] Implement Universal Back Navigation across all screens <!-- id: 129 -->
- [x] Phase 17: Final Verification & Documentation <!-- id: 130 -->
    - [x] Verify all screens open without crash <!-- id: 131 -->
    - [x] Verify Drawer alignment and Back navigation <!-- id: 133 -->
    - [x] Create final walkthrough documentation <!-- id: 132 -->
- [x] Phase 18: Vendor Backend Updates <!-- id: 140 -->
    - [x] Add `duration`, `durationUnit`, `recurrence` to `marketItems` schema <!-- id: 141 -->
    - [x] Update `/api/market/items` POST route logic <!-- id: 142 -->
    - [x] Update `/api/market/:id/purchase` task generation logic <!-- id: 143 -->
    - [x] Write and run test script to verify purchase flow <!-- id: 144 -->
- [x] Phase 19: UI Polish & Auth Upgrades <!-- id: 150 -->
    - [x] Fix Profile Screen top header spacing overlap <!-- id: 151 -->
    - [x] Add global drop-in focus animation for Buttons <!-- id: 152 -->
    - [x] Establish Offline-First authentication state persistence <!-- id: 153 -->
    - [x] Implement repeatable full-screen drop-in entering animations via ScreenAnim <!-- id: 154 -->

- [x] Phase 20: Advanced Theming & Layout Polish <!-- id: 160 -->
    - [x] Update `ThemeContext.tsx` with native `useColorScheme` auto-detection logic <!-- id: 161 -->
    - [x] Add "Match System Appearance" toggle to `ThemeScreen.tsx` <!-- id: 162 -->
    - [x] Replace hardcoded text colors in `MainMenuScreen.tsx` (fix Light Mode invisibility) <!-- id: 163 -->
    - [x] Overhaul `MainDrawerNavigator.tsx` background, badge, and text colors to use dynamic Theme variables <!-- id: 164 -->

- [x] Phase 21: Admin Dynamic Theme Control <!-- id: 170 -->
    - [x] Update `server/src/shared/schema.ts` with `themes` table <!-- id: 171 -->
    - [x] Run DB migration to create `themes` table in Neon <!-- id: 172 -->
    - [x] Implement CRUD routes for themes in `admin-server/src/index.ts` <!-- id: 173 -->
    - [x] Add public theme fetch endpoint in main `server/src/routes.ts` <!-- id: 173b -->
    - [x] Create `Themes.tsx` page in Admin Web <!-- id: 174 -->
    - [x] Update `ThemeContext.tsx` on mobile to fetch dynamic themes <!-- id: 175 -->

- [x] Phase 22: Admin Security & Stability <!-- id: 180 -->
    - [x] Implement 401 Unauthorized redirect in all Admin pages <!-- id: 181 -->
    - [x] Add robustness checks for API response data types (Array.isArray) <!-- id: 182 -->
    - [x] Audit and patch `Dashboard`, `Users`, `Vendors`, `Dreams`, `Social`, `Marketplace`, `Promotions`, and `Settings` <!-- id: 183 -->

- [x] Phase 23: Ad Sync & Admin Configuration Fix <!-- id: 190 -->
    - [x] Create centralized `config.ts` in Admin Web <!-- id: 191 -->
    - [x] Update all Admin pages to use dynamic `API_BASE_URL` <!-- id: 192 -->
    - [x] Align `AVAILABLE_SCREENS` in `Promotions.tsx` with mobile route names <!-- id: 193 -->
    - [x] Verify fix by syncing and testing in mobile app <!-- id: 194 -->

- [x] Phase 24: Fix Ad Overlay & Premium Logic <!-- id: 200 -->
    - [x] Correct `isPremium` logic in `AdPopup.tsx` <!-- id: 201 -->
    - [x] Update `AdPopup` styles for full-screen overlay <!-- id: 202 -->
    - [x] Verify fix with different user tiers <!-- id: 203 -->

- [x] Phase 25: Deployment to GitHub & Neon <!-- id: 210 -->
    - [x] Push all code changes to GitHub repository <!-- id: 211 -->
    - [x] Apply database migrations to Neon via custom DNS script <!-- id: 212 -->
    - [x] Synchronize walkthrough and task documentation <!-- id: 213 -->

- [x] Phase 26: Version Documentation (v3.0 & v4.0) <!-- id: 220 -->
    - [x] Create `v3.0_Documentation.md` <!-- id: 221 -->
    - [x] Create `v4.0_Documentation.md` <!-- id: 222 -->
    - [x] Update `feature_comparison_utf8.txt` with v3 and v4 columns <!-- id: 223 -->
    - [x] Create `RealDream_Feature_Comparison_v4.md` <!-- id: 224 -->
