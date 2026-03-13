# Real Dream Admin Web & Backend Overhaul

## Phase 1: Standalone Admin System Creation
- [x] Initialize `admin-web` (React/Vite) and `admin-server` (Express/Node.js) in a new parent directory.
- [x] Setup standalone PostgreSQL Database configuration for Admin panel data.
- [x] Implement Admin Authentication and security layer in `admin-server`.
- [x] Setup TailwindCSS for modern, dynamic aesthetics in `admin-web`.
- [x] Build Admin Layout (Sidebar, Top Navigation).
- [x] Implement Dashboard Home (Metrics overview) fetching from `admin-server`.
- [x] Implement Users Management Page.
- [x] Implement Dreams & Social Data Grids.

## Phase 2: Resolving Backend Issues (Critical First)
- [x] Fix: Reset token returned in HTTP response (`routes.ts:forgot-password`).
- [x] Fix: JWT fallback to hardcoded secret.
- [x] Fix: Client-sent price trusted for theme purchase.
- [x] Fix: PUT `/profile` missing field whitelist.

## Phase 3: Optimizing Backend Database Queries (High Priority)
- [x] Refactor `storage.ts:getNewsFeed` to use SQL JOINs + Pagination.
- [x] Refactor `storage.ts:getLeaderboard` to use SQL JOIN + GROUP BY.

## Phase 4: Fixing Minor Bugs & Adding Missing Base Endpoints
- [x] Add Dream duplicate join check & auth check on task update.
- [x] Secure `/api/seed/market` with auth guard.
- [x] Add DTOs to `GET /api/users/:id`.

## Phase 6: Frontend Mobile App Integration
- [x] Implement [SettingsScreen](file:///d:/mobile-app-ui/client/screens/SettingsScreen.tsx#33-311): Add manual Logout button and Change Password modal.
- [x] Implement [NotificationsScreen](file:///d:/mobile-app-ui/client/screens/NotificationsScreen.tsx#75-440): Add Swipe-to-delete or Delete button, fetch unread count.
- [x] Implement `NewsFeedScreen`: Add Unlike functionality, Delete Post flow, and Comments modal.
- [x] Implement [MarketScreen](file:///d:/mobile-app-ui/client/screens/MarketScreen.tsx#49-493): Add Purchase History tab.

## Phase 7: Bug Fixes & Menu Reconfiguration
- [x] Investigate and fix unresponsive buttons on Phase 6 screens (Logout, Change Password, Delete).
- [x] Comment out Gallery and News Feed in the Main Menu / Tab Navigator.
- [x] Add Chat and Notifications to the Main Menu / Tab Navigator in their place.

## Phase 8: UI Refinements & User Experience
- [x] Remove Chat and Notification icons from the global header.
- [x] Edit Existing Dream
  - [x] CreateDreamScreen supports `editDreamId`
  - [x] Edit button replaces Delete in PersonalDreams
  - [x] Edit functionality in DreamDetailScreen

## 3. Group Dream Enhancements
- [x] Fetch Participants list (`/api/dreams/:dreamId/members`)
- [x] Display included members on Group Dreams
- [x] Update standard group button to show 'Invite' along with the logo
- [x] Keep Invite log consistent

## 4. Chat & Message Screens
- [x] Differentiate between [MessagesScreen](file:///d:/mobile-app-ui/client/screens/MessagesScreen.tsx#67-402) and [ChatScreen](file:///d:/mobile-app-ui/client/screens/ChatScreen.tsx#30-254) internally for proper routing
- [x] Allow searching users to Chat with (Followers/Following)
- [x] Ensure specific user click takes them directly into the targeted Chat Stream

## 5. Profile Animation
- [x] Introduce physics-based react-native-reanimated layer
- [x] Anchor cool 3d avatar rendering jumping from the Username field onto the main Profile Container
- [x] Setup waving repeat animations using withSequence and withRepeat on load.

## Phase 10: Production Quality Enhancements
- [x] Add Production Rate limits via `express-rate-limit`.
- [x] Verify `/api/health` checking for server uptime monitoring.
- [x] Review overall server metrics logic and verify local TypeScript syntactical passes (investigated Render specific CI errors natively).
## Phase 5: Building Missing API Modules
- [x] Implement Auth enhancements (Refresh token, Logout, Change Password).
- [x] Implement Social fixes (Unlike, Delete Post, Comments).
- [x] Implement Notifications (Unread count, Delete).
- [x] Implement Marketplace purchase history endpoints.

## Phase 9: Vendor System (Marketplace Implementation)
- [x] Define Backend Schema: Vendor Tiers (Basic, Pro, Enterprise), marketplace item premium locks, and purchase history.
- [x] Implement Vendor Tier Logic: DB constraints limiting active marketplace items per tier.
- [x] Implement Purchase Flow: Atomic transaction for deducting coins, logging purchase, and attributing vendor commissions.
- [x] Build Endpoints: Vendor signup/upgrade, marketplace item upload with premium flags.
- [x] Admin Web Implementation: Marketplace oversight panel to view and delete items and manage Vendor statuses on users.
- [x] Mobile App Implementation: VendorHubScreen, Become A Vendor Modal, ProfileScreen vendor controls integration.

## Phase 11: Deployment & Verification
- [x] Push current API schema to Neon Postgres Database (`npx drizzle-kit push`).
- [x] Commit and push code to Github ([main](file:///d:/mobile-app-ui/client/screens/DreamDetailScreen.tsx#142-149)) to trigger Render deployment.
- [x] Live Verification: Contact `/api/health` on Render domain to ensure proper compilation and uptime.

## Phase 12: End-to-End System Browsing Verification
- [x] Test Admin Dashboard locally on port 5173 with browser subagent.
- [x] Take screenshots of Admin data tables (Dreams, Users) validating database connectivity.
- [x] Ping and browse primary Render Endpoint to verify Expo fallback landing page loads globally.

## Phase 13: Admin System Fixes, UI Alignment & Routing
- [x] Implement robust cascade sql deletes inside [admin-system/admin-server/src/index.ts](file:///d:/mobile-app-ui/admin-system/admin-server/src/index.ts) to prevent backend crashes on user / dream deletion
- [x] Implement complete Drizzle ORM constraint wipes for User Delete in [server/src/storage.ts](file:///d:/mobile-app-ui/server/src/storage.ts)
- [x] Relocate Vendor Hub modal interactions from ProfileScreen layout into SettingsScreen component
- [x] Repaired broken backend endpoints handling Notification deletions returning 404s due to `postgres-js` ORM driver adapter incompatibilities
- [x] Lifted [ChatScreen](file:///d:/mobile-app-ui/client/screens/ChatScreen.tsx#30-254) component navigation out of tab layouts up to [RootStackNavigator](file:///d:/mobile-app-ui/client/navigation/RootStackNavigator.tsx#45-137) to prevent input keyboard-avoiding container from hiding underneath the bottom tab bar
- [x] Resolved strict TypeScript linting errors across the core UI Kit [Card.tsx](file:///d:/mobile-app-ui/client/components/Card.tsx) payload interfaces natively.

## Phase 14: Friend Challenge System
- [x] Implement backend [storage.ts](file:///d:/mobile-app-ui/server/src/storage.ts) logic to filter or handle `"pending"` vs `"member"` roles gracefully
- [x] Add `invitedUserIds` extraction and member initialization during `POST /api/dreams` creation in [routes.ts](file:///d:/mobile-app-ui/server/src/routes.ts)
- [x] Modify `POST /api/dreams/:id/join` and `DELETE /api/dreams/:id/decline` backends to accept/decline invites
- [x] Build a multi-select friends list in [CreateDreamScreen.tsx](file:///d:/mobile-app-ui/client/screens/CreateDreamScreen.tsx) using `/api/connections` data
- [x] Refactor [NotificationsScreen.tsx](file:///d:/mobile-app-ui/client/screens/NotificationsScreen.tsx) modal to intercept `actionType: "challenge_invite"` with Accept/Decline options

## Phase 15: Challenge Dreams Refactor & Dream Editing Enhancements
- [x] Refactor Challenge Invite to send standalone notifications without `pending` dream_members.
- [x] Create dream branching logic so accepting a challenge clones the dream instance.
- [x] Expand editing capabilities in [CreateDreamScreen](file:///d:/mobile-app-ui/client/screens/CreateDreamScreen.tsx#195-868) / [routes.ts](file:///d:/mobile-app-ui/server/src/routes.ts) to sync full dream properties (Tasks, Duration, etc.).
- [x] Remove inline "Edit" buttons from Dream Lists, restricting edit access purely to [DreamDetailScreen](file:///d:/mobile-app-ui/client/screens/DreamDetailScreen.tsx#45-532).
- [x] Display Dream completion descriptions inside [DreamDetailScreen](file:///d:/mobile-app-ui/client/screens/DreamDetailScreen.tsx#45-532).

## Phase 16: Marketplace & Vendor Production Polish
- [x] Add "Delete Vendor Profile" capability to Settings -> Vendor Hub.
- [x] Create and integrate a "Dummy Credit Card" UI modal for [MarketScreen](file:///d:/mobile-app-ui/client/screens/MarketScreen.tsx#49-493) checkouts and coin purchases.

## Phase 17: Admin System A to Z Completion
- [x] Build Marketplace Management dashboard (view/delete Vendor items).
- [x] Build Vendor Applications/List dashboard (manage active vendors and tiers).
- [x] Build global System Settings overview.
