import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "node:http";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { storage } from "./storage.js";
import { db } from "./db.js";
import { eq, and, or, desc, sql } from "drizzle-orm";
import { loginSchema, registerSchema, users } from "./shared/schema.js";
import { verifyIdToken, initializeFirebaseAdmin } from "./firebase-admin.js";
import { generateTaskDates, validateDreamFields } from "./task-generator.js";
import multer from "multer";
import { uploadToCloudinary, deleteFromCloudinary } from "./cloudinary-storage.js";

const JWT_SECRET = process.env.SESSION_SECRET || "real-dream-secret-key";

let firebaseInitialized = false;
try {
  initializeFirebaseAdmin();
  firebaseInitialized = true;
} catch (error) {
  console.warn("Firebase Admin SDK not initialized. Firebase auth will not work:", error);
}

interface AuthRequest extends Request {
  user?: { id: string; email: string; firebaseUid?: string };
}

const tokenCache = new Map<string, { user: { id: string; email: string; firebaseUid?: string }; expiresAt: number }>();
const TOKEN_CACHE_TTL_MS = 5 * 60 * 1000;
const TOKEN_CACHE_MAX_SIZE = 500;

function getCachedToken(token: string) {
  const entry = tokenCache.get(token);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    tokenCache.delete(token);
    return null;
  }
  return entry.user;
}

function setCachedToken(token: string, user: { id: string; email: string; firebaseUid?: string }) {
  if (tokenCache.size >= TOKEN_CACHE_MAX_SIZE) {
    const firstKey = tokenCache.keys().next().value;
    if (firstKey) tokenCache.delete(firstKey);
  }
  tokenCache.set(token, { user, expiresAt: Date.now() + TOKEN_CACHE_TTL_MS });
}

async function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const token = authHeader.split(" ")[1];

  const cached = getCachedToken(token);
  if (cached) {
    req.user = cached;
    return next();
  }

  if (firebaseInitialized) {
    try {
      const decodedToken = await verifyIdToken(token);
      const user = await storage.getUserByFirebaseUid(decodedToken.uid);
      if (user) {
        const userData = { id: user.id, email: user.email, firebaseUid: decodedToken.uid };
        setCachedToken(token, userData);
        req.user = userData;
        return next();
      }
    } catch {
    }
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string };
    setCachedToken(token, decoded);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
}
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});
export async function registerRoutes(app: Express): Promise<Server> {
  // ✅ HEALTH CHECK (ADD THIS)
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });
  app.post("/api/auth/register", async (req, res) => {
    try {
      const result = registerSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: result.error.issues[0].message });
      }

      const { email, username, password, fullName } = result.data;

      const existingEmail = await storage.getUserByEmail(email);
      if (existingEmail) {
        return res.status(400).json({ error: "Email already registered" });
      }

      const existingUsername = await storage.getUserByUsername(username);
      if (existingUsername) {
        return res.status(400).json({ error: "Username already taken" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await storage.createUser({
        email,
        username,
        password: hashedPassword,
        fullName,
        coins: 100,
      });

      const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, {
        expiresIn: "7d",
      });

      const { password: _, ...userWithoutPassword } = user;
      res.status(201).json({ user: userWithoutPassword, token });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ error: "Registration failed" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const result = loginSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: result.error.issues[0].message });
      }

      const { emailOrUsername, password } = result.data;
      const input = emailOrUsername.trim().toLowerCase();

      let user = await storage.getUserByEmail(input);
      if (!user) {
        user = await storage.getUserByUsername(input);
      }

      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      if (!user.password) {
        return res.status(401).json({ error: "Please login with your social account" });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, {
        expiresIn: "7d",
      });

      const { password: _, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword, token });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  app.post("/api/auth/resolve-username", async (req, res) => {
    try {
      const { username } = req.body;
      if (!username) {
        return res.status(400).json({ error: "Username is required" });
      }

      const user = await storage.getUserByUsername(username.trim().toLowerCase());
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({ email: user.email });
    } catch (error) {
      console.error("Resolve username error:", error);
      res.status(500).json({ error: "Failed to resolve username" });
    }
  });

  app.post("/api/auth/google", async (req, res) => {
    try {
      const { googleId, email, fullName, profileImage } = req.body;

      if (!googleId || !email) {
        return res.status(400).json({ error: "Google ID and email are required" });
      }

      let user = await storage.getUserByGoogleId(googleId);

      if (!user) {
        user = await storage.getUserByEmail(email);
        if (user) {
          user = await storage.updateUser(user.id, { googleId, authProvider: "google" as any });
        } else {
          const username = email.split("@")[0] + "_" + Math.random().toString(36).substring(2, 7);
          user = await storage.createUser({
            email,
            username,
            googleId,
            fullName,
            profileImage,
            authProvider: "google" as any,
            coins: 100,
          });
        }
      }

      if (!user) {
        return res.status(500).json({ error: "Failed to create user" });
      }

      const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, {
        expiresIn: "7d",
      });

      const { password: _, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword, token });
    } catch (error) {
      console.error("Google login error:", error);
      res.status(500).json({ error: "Google login failed" });
    }
  });

  app.post("/api/auth/facebook", async (req, res) => {
    try {
      const { facebookId, email, fullName, profileImage } = req.body;

      if (!facebookId || !email) {
        return res.status(400).json({ error: "Facebook ID and email are required" });
      }

      let user = await storage.getUserByFacebookId(facebookId);

      if (!user) {
        user = await storage.getUserByEmail(email);
        if (user) {
          user = await storage.updateUser(user.id, { facebookId, authProvider: "facebook" as any });
        } else {
          const username = email.split("@")[0] + "_" + Math.random().toString(36).substring(2, 7);
          user = await storage.createUser({
            email,
            username,
            facebookId,
            fullName,
            profileImage,
            authProvider: "facebook" as any,
            coins: 100,
          });
        }
      }

      if (!user) {
        return res.status(500).json({ error: "Failed to create user" });
      }

      const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, {
        expiresIn: "7d",
      });

      const { password: _, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword, token });
    } catch (error) {
      console.error("Facebook login error:", error);
      res.status(500).json({ error: "Facebook login failed" });
    }
  });

  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }

      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.json({ success: true, message: "If an account exists, a reset link has been sent" });
      }

      if (user.authProvider !== "email") {
        return res.status(400).json({ error: "Please login with your social account" });
      }

      const crypto = await import("crypto");
      const token = crypto.randomBytes(32).toString("hex");
      await storage.createPasswordResetToken(user.id, token);

      res.json({
        success: true,
        message: "Password reset instructions sent to your email",
        resetToken: token,
      });
    } catch (error) {
      console.error("Forgot password error:", error);
      res.status(500).json({ error: "Failed to process request" });
    }
  });

  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { token, newPassword } = req.body;

      if (!token || !newPassword) {
        return res.status(400).json({ error: "Token and new password are required" });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ error: "Password must be at least 6 characters" });
      }

      const resetToken = await storage.getPasswordResetToken(token);
      if (!resetToken) {
        return res.status(400).json({ error: "Invalid or expired reset token" });
      }

      if (resetToken.usedAt) {
        return res.status(400).json({ error: "Reset token already used" });
      }

      if (new Date() > resetToken.expiresAt) {
        return res.status(400).json({ error: "Reset token has expired" });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await storage.updateUser(resetToken.userId, { password: hashedPassword });
      await storage.markPasswordResetTokenUsed(resetToken.id);

      res.json({ success: true, message: "Password reset successfully" });
    } catch (error) {
      console.error("Reset password error:", error);
      res.status(500).json({ error: "Failed to reset password" });
    }
  });

  app.post("/api/auth/firebase", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Firebase token required" });
      }

      const token = authHeader.split(" ")[1];

      if (!firebaseInitialized) {
        return res.status(500).json({ error: "Firebase not configured" });
      }

      const decodedToken = await verifyIdToken(token);
      const { email, fullName, profileImage, firebaseUid, authProvider } = req.body;

      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }

      let user = await storage.getUserByFirebaseUid(firebaseUid || decodedToken.uid);

      if (!user) {
        user = await storage.getUserByEmail(email);
        if (user) {
          user = await storage.updateUser(user.id, {
            firebaseUid: firebaseUid || decodedToken.uid,
            authProvider: authProvider === 'google.com' ? 'google' :
              authProvider === 'facebook.com' ? 'facebook' :
                authProvider === 'phone' ? 'phone' : 'email',
          });
        } else {
          const username = email.split("@")[0] + "_" + Math.random().toString(36).substring(2, 7);
          user = await storage.createUser({
            email,
            username,
            fullName: fullName || email.split("@")[0],
            profileImage,
            firebaseUid: firebaseUid || decodedToken.uid,
            authProvider: authProvider === 'google.com' ? 'google' :
              authProvider === 'facebook.com' ? 'facebook' :
                authProvider === 'phone' ? 'phone' : 'email',
            coins: 100,
          });
        }
      }

      if (!user) {
        return res.status(500).json({ error: "Failed to create user" });
      }

      const { password: _, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword });
    } catch (error) {
      console.error("Firebase auth error:", error);
      res.status(500).json({ error: "Firebase authentication failed" });
    }
  });

  app.post("/api/auth/firebase-register", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Firebase token required" });
      }

      const token = authHeader.split(" ")[1];

      if (!firebaseInitialized) {
        return res.status(500).json({ error: "Firebase not configured" });
      }

      const decodedToken = await verifyIdToken(token);
      const { email, username, fullName, firebaseUid, authProvider } = req.body;

      if (!email || !username) {
        return res.status(400).json({ error: "Email and username are required" });
      }

      const existingEmail = await storage.getUserByEmail(email);
      if (existingEmail) {
        return res.status(400).json({ error: "Email already registered" });
      }

      const existingUsername = await storage.getUserByUsername(username);
      if (existingUsername) {
        return res.status(400).json({ error: "Username already taken" });
      }

      const user = await storage.createUser({
        email,
        username,
        fullName: fullName || username,
        firebaseUid: firebaseUid || decodedToken.uid,
        authProvider: authProvider === 'phone' ? 'phone' : 'email',
        coins: 100,
      });

      if (!user) {
        return res.status(500).json({ error: "Failed to create user" });
      }

      const { password: _, ...userWithoutPassword } = user;
      res.status(201).json({ user: userWithoutPassword });
    } catch (error) {
      console.error("Firebase register error:", error);
      res.status(500).json({ error: "Firebase registration failed" });
    }
  });

  app.get("/api/auth/me", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const user = await storage.getUser(req.user!.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ error: "Failed to get user" });
    }
  });

  app.put("/api/profile", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const user = await storage.updateUser(req.user!.id, req.body);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ error: "Failed to update profile" });
    }
  });
  // Profile photo upload
  app.post(
    "/api/profile/photo",
    authMiddleware,
    upload.single("profilePhoto"),
    async (req: AuthRequest, res) => {
      try {
        if (!req.file) {
          return res.status(400).json({ error: "No file uploaded" });
        }

        const userId = req.user!.id;

        // Get current user to check for existing photo
        const currentUser = await storage.getUser(userId);

        // Delete old photo from Cloudinary if exists
        if (currentUser?.profilePhoto) {
          await deleteFromCloudinary(currentUser.profilePhoto);
        }

        // Upload new photo to Cloudinary
        const photoUrl = await uploadToCloudinary(
          req.file.buffer,
          req.file.originalname
        );

        // Update user in database
        const updatedUser = await storage.updateUser(userId, {
          profilePhoto: photoUrl,
        });

        if (!updatedUser) {
          return res.status(404).json({ error: "User not found" });
        }

        res.json({
          profilePhotoUrl: photoUrl,
          message: "Profile photo uploaded successfully",
        });
      } catch (error) {
        console.error("Error uploading profile photo:", error);
        res.status(500).json({ error: "Failed to upload profile photo" });
      }
    }
  );

  // Delete profile photo
  app.delete("/api/profile/photo", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.id;
      const user = await storage.getUser(userId);

      if (!user?.profilePhoto) {
        return res.status(404).json({ error: "No profile photo to delete" });
      }

      // Delete from Cloudinary
      await deleteFromCloudinary(user.profilePhoto);

      // Update database
      await storage.updateUser(userId, {
        profilePhoto: null,
      });

      res.json({ message: "Profile photo deleted successfully" });
    } catch (error) {
      console.error("Error deleting profile photo:", error);
      res.status(500).json({ error: "Failed to delete profile photo" });
    }
  });
  app.post("/api/subscription", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const { tier } = req.body;
      const validTiers = ["bronze", "silver", "gold", "platinum"];

      if (!tier || !validTiers.includes(tier)) {
        return res.status(400).json({ error: "Invalid subscription tier" });
      }

      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + 1);

      const user = await storage.updateUser(req.user!.id, {
        subscriptionTier: tier,
        subscriptionExpiresAt: expiresAt,
      });

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      await storage.createTransaction({
        userId: req.user!.id,
        amount: tier === "bronze" ? -499 : tier === "silver" ? -999 : tier === "gold" ? -1999 : -2999,
        type: "subscription",
        description: `Subscribed to ${tier.toUpperCase()} plan`,
      });

      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ error: "Failed to subscribe" });
    }
  });

  app.delete("/api/profile", authMiddleware, async (req: AuthRequest, res) => {
    try {
      await storage.deleteUser(req.user!.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete account" });
    }
  });

  app.get("/api/dreams", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const dreams = await storage.getDreams(req.user!.id);
      res.json(dreams);
    } catch (error) {
      res.status(500).json({ error: "Failed to get dreams" });
    }
  });

  app.post("/api/dreams", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const { title, description, type, privacy, startDate, duration, durationUnit, recurrence, tasks: taskTexts } = req.body;

      const validation = validateDreamFields({
        title,
        description,
        duration,
        durationUnit,
        recurrence,
        startDate,
      });

      if (!validation.valid) {
        return res.status(400).json({ error: validation.errors.join(", ") });
      }

      let targetDate = req.body.targetDate;
      if (duration && durationUnit && startDate) {
        const start = new Date(startDate);
        switch (durationUnit) {
          case "days":
            targetDate = new Date(start.getTime() + duration * 24 * 60 * 60 * 1000);
            break;
          case "weeks":
            targetDate = new Date(start.getTime() + duration * 7 * 24 * 60 * 60 * 1000);
            break;
          case "months":
            targetDate = new Date(start);
            targetDate.setMonth(targetDate.getMonth() + duration);
            break;
          case "years":
            targetDate = new Date(start);
            targetDate.setFullYear(targetDate.getFullYear() + duration);
            break;
        }
      }

      const dream = await storage.createDream({
        title: title.trim(),
        description: description?.trim() || null,
        type: type || "personal",
        privacy: privacy || "public",
        startDate: startDate ? new Date(startDate) : new Date(),
        targetDate: targetDate ? new Date(targetDate) : null,
        duration: duration || null,
        durationUnit: durationUnit || null,
        recurrence: recurrence || null,
        userId: req.user!.id,
      });

      if (duration && durationUnit && recurrence && startDate) {
        const taskDates = generateTaskDates(
          new Date(startDate),
          duration,
          durationUnit as "days" | "weeks" | "months" | "years",
          recurrence as "daily" | "weekly" | "semi-weekly" | "monthly" | "semi-monthly"
        );

        for (let i = 0; i < taskDates.length; i++) {
          const taskDate = taskDates[i];
          const taskText = taskTexts && taskTexts[i] ? taskTexts[i] : "";

          await storage.createDreamTask({
            dreamId: dream.id,
            title: taskText || `Task ${i + 1}`,
            dueDate: taskDate.date,
            order: taskDate.order,
          });
        }
      }

      res.status(201).json(dream);
    } catch (error) {
      console.error("Create dream error:", error);
      res.status(500).json({ error: "Failed to create dream" });
    }
  });

  app.get("/api/dreams/:id", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const id = req.params.id as string;
      const dream = await storage.getDream(id);
      if (!dream) {
        return res.status(404).json({ error: "Dream not found" });
      }

      // Security check: Personal dreams only visible to owner
      if (dream.type === "personal" && dream.userId !== req.user!.id) {
        return res.status(403).json({ error: "Access denied" });
      }

      // For group/challenge dreams, check if user is a member
      if (dream.type !== "personal" && dream.userId !== req.user!.id) {
        const isMember = await storage.isDreamMember(id, req.user!.id);
        if (!isMember) {
          return res.status(403).json({ error: "Access denied" });
        }
      }

      res.json(dream);
    } catch (error) {
      res.status(500).json({ error: "Failed to get dream" });
    }
  });

  app.put("/api/dreams/:id", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const id = req.params.id as string;
      const existingDream = await storage.getDream(id);
      if (!existingDream) {
        return res.status(404).json({ error: "Dream not found" });
      }

      // Security check: Only owner can update dream
      if (existingDream.userId !== req.user!.id) {
        return res.status(403).json({ error: "Access denied" });
      }

      const dream = await storage.updateDream(id, req.body);
      res.json(dream);
    } catch (error) {
      res.status(500).json({ error: "Failed to update dream" });
    }
  });

  app.delete("/api/dreams/:id", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const id = req.params.id as string;
      const existingDream = await storage.getDream(id);
      if (!existingDream) {
        return res.status(404).json({ error: "Dream not found" });
      }

      // Security check: Only owner can delete dream
      if (existingDream.userId !== req.user!.id) {
        return res.status(403).json({ error: "Access denied" });
      }

      await storage.deleteDream(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete dream" });
    }
  });

  // Invite users to dream (creates notification)
  app.post("/api/dreams/:dreamId/invite", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const dreamId = req.params.dreamId as string;
      const { userIds, dreamTitle } = req.body;

      if (!Array.isArray(userIds) || userIds.length === 0) {
        return res.status(400).json({ error: "User IDs required" });
      }

      // Verify dream exists and user has access
      const dream = await storage.getDream(dreamId);
      if (!dream) {
        return res.status(404).json({ error: "Dream not found" });
      }

      if (dream.userId !== req.user!.id) {
        return res.status(403).json({ error: "Only dream owner can invite" });
      }

      // Create notifications for each invited user
      const inviter = await storage.getUser(req.user!.id);
      for (const userId of userIds) {
        await storage.createNotification({
          userId: userId,
          title: "Dream Invite",
          description: `${inviter?.fullName || inviter?.username} invited you to join "${dreamTitle}"`,
          type: "social",
        });
      }

      res.json({ success: true, invitedCount: userIds.length });
    } catch (error) {
      console.error("Invite error:", error);
      res.status(500).json({ error: "Failed to send invites" });
    }
  });

  // Join dream (accept invite)
  app.post("/api/dreams/:dreamId/join", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const dreamId = req.params.dreamId as string;

      // Verify dream exists
      const dream = await storage.getDream(dreamId);
      if (!dream) {
        return res.status(404).json({ error: "Dream not found" });
      }

      // Add user as member (simplified - you may want to check if already member)
      await storage.addDreamMember(dreamId, req.user!.id, "member");

      res.json({ success: true });
    } catch (error) {
      console.error("Join dream error:", error);
      res.status(500).json({ error: "Failed to join dream" });
    }
  });

  app.get("/api/dreams/:dreamId/tasks", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const dreamId = req.params.dreamId as string;

      // Security check: Verify user has access to this dream
      const dream = await storage.getDream(dreamId);
      if (!dream) {
        return res.status(404).json({ error: "Dream not found" });
      }

      if (dream.type === "personal" && dream.userId !== req.user!.id) {
        return res.status(403).json({ error: "Access denied" });
      }

      if (dream.type !== "personal" && dream.userId !== req.user!.id) {
        const isMember = await storage.isDreamMember(dreamId, req.user!.id);
        if (!isMember) {
          return res.status(403).json({ error: "Access denied" });
        }
      }

      const tasks = await storage.getDreamTasks(dreamId);
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ error: "Failed to get tasks" });
    }
  });

  app.post("/api/dreams/:dreamId/tasks", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const dreamId = req.params.dreamId as string;
      const { title, description, dueDate, reminderDate, order } = req.body;
      const task = await storage.createDreamTask({
        dreamId,
        title,
        description,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        reminderDate: reminderDate ? new Date(reminderDate) : undefined,
        order: order || 0,
      });

      await storage.updateDreamProgress(dreamId);

      if (reminderDate) {
        await storage.createNotification({
          userId: req.user!.id,
          title: "Task Reminder",
          description: `Reminder for "${title}"`,
          type: "system",
        });
      }

      res.status(201).json(task);
    } catch (error) {
      console.error("Create task error:", error);
      res.status(500).json({ error: "Failed to create task" });
    }
  });

  app.put("/api/dreams/:dreamId/tasks/:taskId", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const dreamId = req.params.dreamId as string;
      const taskId = req.params.taskId as string;
      const { title, description, dueDate, reminderDate, order } = req.body;
      const task = await storage.updateDreamTask(taskId, {
        title,
        description,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        reminderDate: reminderDate ? new Date(reminderDate) : undefined,
        order,
      });
      res.json(task);
    } catch (error) {
      res.status(500).json({ error: "Failed to update task" });
    }
  });

  app.delete("/api/dreams/:dreamId/tasks/:taskId", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const dreamId = req.params.dreamId as string;
      const taskId = req.params.taskId as string;
      await storage.deleteDreamTask(taskId);
      await storage.updateDreamProgress(dreamId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete task" });
    }
  });

  app.post("/api/dreams/:dreamId/tasks/:taskId/toggle", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const dreamId = req.params.dreamId as string;
      const taskId = req.params.taskId as string;
      const task = await storage.toggleDreamTaskComplete(taskId);

      if (!task) {
        return res.status(404).json({ error: "Task not found" });
      }

      const dream = await storage.updateDreamProgress(dreamId);

      if (task.isCompleted) {
        const user = await storage.getUser(req.user!.id);
        if (user) {
          await storage.updateUser(user.id, {
            totalPoints: (user.totalPoints || 0) + 10,
          });
          await storage.createNotification({
            userId: req.user!.id,
            title: "Task Completed!",
            description: `You earned 10 points for completing "${task.title}"`,
            type: "achievement",
          });
        }
      }

      res.json({ task, dream });
    } catch (error) {
      console.error("Toggle task error:", error);
      res.status(500).json({ error: "Failed to toggle task" });
    }
  });

  app.get("/api/connections", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const connections = await storage.getConnections(req.user!.id);
      res.json(connections);
    } catch (error) {
      res.status(500).json({ error: "Failed to get connections" });
    }
  });

  app.post("/api/connections/:userId/follow", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const targetUserId = req.params.userId as string;
      const isAlreadyFollowing = await storage.isFollowing(req.user!.id, targetUserId);
      if (isAlreadyFollowing) {
        return res.status(400).json({ error: "Already following" });
      }
      await storage.createConnection(req.user!.id, targetUserId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to follow user" });
    }
  });

  app.delete("/api/connections/:userId/unfollow", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const targetUserId = req.params.userId as string;
      await storage.deleteConnection(req.user!.id, targetUserId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to unfollow user" });
    }
  });

  app.get("/api/conversations", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const conversations = await storage.getConversations(req.user!.id);
      res.json(conversations);
    } catch (error) {
      res.status(500).json({ error: "Failed to get conversations" });
    }
  });

  app.get("/api/messages", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const messages = await storage.getMessages(req.user!.id);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: "Failed to get messages" });
    }
  });

  app.get("/api/messages/:userId", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const targetUserId = req.params.userId as string;
      const messages = await storage.getConversation(req.user!.id, targetUserId);
      await storage.markAllMessagesRead(req.user!.id, targetUserId);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: "Failed to get conversation" });
    }
  });

  app.post("/api/messages", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const message = await storage.createMessage({
        ...req.body,
        senderId: req.user!.id,
      });
      res.status(201).json(message);
    } catch (error) {
      res.status(500).json({ error: "Failed to send message" });
    }
  });

  app.put("/api/messages/read-all", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const { otherUserId } = req.body;
      if (otherUserId) {
        await storage.markAllMessagesRead(req.user!.id, otherUserId);
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to mark messages as read" });
    }
  });

  app.get("/api/notifications", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const notifications = await storage.getNotifications(req.user!.id);
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ error: "Failed to get notifications" });
    }
  });

  app.put("/api/notifications/:id/read", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const id = req.params.id as string;
      const updated = await storage.markNotificationRead(id, req.user!.id);
      if (!updated) {
        return res.status(404).json({ error: "Notification not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to mark notification as read" });
    }
  });

  app.put("/api/notifications/read-all", authMiddleware, async (req: AuthRequest, res) => {
    try {
      await storage.markAllNotificationsRead(req.user!.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to mark all notifications as read" });
    }
  });

  app.get("/api/wallet", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const user = await storage.getUser(req.user!.id);
      const transactions = await storage.getTransactions(req.user!.id);
      res.json({
        coins: user?.coins || 0,
        trophies: user?.trophies || 0,
        awards: user?.awards || 0,
        transactions,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to get wallet" });
    }
  });

  app.post("/api/wallet/spin", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const user = await storage.getUser(req.user!.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const today = new Date().toDateString();
      const lastSpinDate = user.lastSpinDate ? new Date(user.lastSpinDate).toDateString() : null;
      let spinsLeft = user.dailySpinsLeft || 0;

      if (lastSpinDate !== today) {
        spinsLeft = 3;
      }

      if (spinsLeft <= 0) {
        return res.status(400).json({ error: "No spins left today" });
      }

      const prizes = [10, 25, 50, 100, 200, 500];
      const prize = prizes[Math.floor(Math.random() * prizes.length)];

      await storage.updateUser(user.id, {
        coins: (user.coins || 0) + prize,
        dailySpinsLeft: spinsLeft - 1,
        lastSpinDate: new Date(),
      });

      await storage.createTransaction({
        userId: user.id,
        amount: prize,
        type: "spin",
        description: `Won ${prize} coins from lucky spin`,
      });

      res.json({ prize, spinsLeft: spinsLeft - 1 });
    } catch (error) {
      res.status(500).json({ error: "Failed to spin" });
    }
  });

  app.get("/api/champions", async (req, res) => {
    try {
      const { tier, year } = req.query;
      const champions = await storage.getChampions(
        tier as string | undefined,
        year ? parseInt(year as string) : undefined
      );
      res.json(champions);
    } catch (error) {
      res.status(500).json({ error: "Failed to get champions" });
    }
  });

  app.get("/api/wall-of-fame", async (req, res) => {
    try {
      const { period } = req.query;
      const users = await storage.getWallOfFame(period as string || "all");
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: "Failed to get wall of fame" });
    }
  });

  app.get("/api/leaderboard", async (req, res) => {
    try {
      const { limit } = req.query;
      const users = await storage.getLeaderboard(limit ? parseInt(limit as string) : 10);
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: "Failed to get leaderboard" });
    }
  });

  app.get("/api/gallery", async (req, res) => {
    try {
      const posts = await storage.getGalleryPosts();
      res.json(posts);
    } catch (error) {
      res.status(500).json({ error: "Failed to get gallery" });
    }
  });

  app.post("/api/gallery", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const post = await storage.createGalleryPost({
        ...req.body,
        userId: req.user!.id,
      });
      res.status(201).json(post);
    } catch (error) {
      res.status(500).json({ error: "Failed to create gallery post" });
    }
  });

  app.get("/api/news-feed", async (req, res) => {
    try {
      const posts = await storage.getNewsFeed();
      res.json(posts);
    } catch (error) {
      res.status(500).json({ error: "Failed to get news feed" });
    }
  });

  app.post("/api/news-feed", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const post = await storage.createNewsFeedPost({
        ...req.body,
        userId: req.user!.id,
      });
      res.status(201).json(post);
    } catch (error) {
      res.status(500).json({ error: "Failed to create post" });
    }
  });

  app.post("/api/news-feed/:id/like", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const postId = req.params.id as string;
      await storage.likePost(postId, req.user!.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to like post" });
    }
  });

  app.get("/api/market", async (req, res) => {
    try {
      const { category } = req.query;
      const items = await storage.getMarketItems(category as string | undefined);
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: "Failed to get market items" });
    }
  });

  // Purchase a market item
  app.post("/api/market/:id/purchase", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const itemId = req.params.id as string;
      const userId = req.user!.id;

      const item = await storage.getMarketItem(itemId);
      if (!item) {
        return res.status(404).json({ error: "Item not found" });
      }
      if (!item.isActive) {
        return res.status(400).json({ error: "Item is no longer available" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      if ((user.coins || 0) < item.price) {
        return res.status(400).json({ error: "Insufficient coins" });
      }

      await storage.updateUser(userId, {
        coins: (user.coins || 0) - item.price,
      });

      await storage.createTransaction({
        userId,
        amount: -item.price,
        type: "purchase",
        description: `Purchased ${item.title}`,
      });

      res.json({ success: true, newBalance: (user.coins || 0) - item.price });
    } catch (error) {
      res.status(500).json({ error: "Failed to purchase item" });
    }
  });

  // Purchase a theme
  app.post("/api/themes/:id/purchase", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const themeId = req.params.id as string;
      const userId = req.user!.id;
      const { price, name } = req.body;

      if (!price || price < 0) {
        return res.status(400).json({ error: "Invalid price" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      if ((user.coins || 0) < price) {
        return res.status(400).json({ error: "Insufficient coins" });
      }

      await storage.updateUser(userId, {
        coins: (user.coins || 0) - price,
      });

      await storage.createTransaction({
        userId,
        amount: -price,
        type: "purchase",
        description: `Purchased ${name || themeId} theme`,
      });

      res.json({ success: true, newBalance: (user.coins || 0) - price });
    } catch (error) {
      res.status(500).json({ error: "Failed to purchase theme" });
    }
  });

  // Seed market items if none exist
  app.post("/api/seed/market", async (req, res) => {
    try {
      const count = await storage.getMarketItemCount();
      if (count > 0) {
        return res.json({ message: "Market already seeded", count });
      }

      // Get or create a system user for market items
      let systemUser = await storage.getUserByUsername("realdream_system");
      if (!systemUser) {
        const hashedPassword = await bcrypt.hash("not-a-real-password-12345", 10);
        systemUser = await storage.createUser({
          email: "system@realdream.app",
          username: "realdream_system",
          fullName: "Real Dream System",
          password: hashedPassword,
          authProvider: "email",
        });
      }
      const systemUserId = systemUser.id;

      const marketItemsData = [
        { title: "Premium Badge Pack", description: "Unlock exclusive badges to showcase your achievements", category: "Badges", price: 299, userId: systemUserId, isActive: true },
        { title: "Gold Achievement Badge", description: "A prestigious gold badge for top performers", category: "Badges", price: 199, userId: systemUserId, isActive: true },
        { title: "Custom Avatar Frame", description: "Stand out from the crowd with unique avatar frames", category: "Customization", price: 199, userId: systemUserId, isActive: true },
        { title: "Profile Theme Pack", description: "Personalize your profile with beautiful themes", category: "Customization", price: 249, userId: systemUserId, isActive: true },
        { title: "Streak Booster", description: "Boost your streak progress by 2x for 7 days", category: "Boosters", price: 149, userId: systemUserId, isActive: true },
        { title: "XP Multiplier", description: "Double your XP gain for 24 hours", category: "Boosters", price: 99, userId: systemUserId, isActive: true },
        { title: "Galaxy Theme", description: "Beautiful galaxy-themed profile customization", category: "Themes", price: 399, userId: systemUserId, isActive: true },
        { title: "Sunset Theme", description: "Warm sunset colors for your profile", category: "Themes", price: 299, userId: systemUserId, isActive: true },
        { title: "Exclusive Stickers", description: "Fun stickers for chat and celebrations", category: "Stickers", price: 99, userId: systemUserId, isActive: true },
        { title: "Celebration Pack", description: "Animated celebration stickers", category: "Stickers", price: 149, userId: systemUserId, isActive: true },
      ];

      for (const item of marketItemsData) {
        await storage.createMarketItem(item);
      }

      res.json({ message: "Market seeded successfully", count: marketItemsData.length });
    } catch (error) {
      console.error("Failed to seed market:", error);
      res.status(500).json({ error: "Failed to seed market items" });
    }
  });

  // Search users by username or name
  app.get("/api/users/search", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const query = (req.query.q as string)?.toLowerCase().trim();

      if (!query || query.length < 2) {
        return res.json([]);
      }

      const searchResults = await db
        .select({
          id: users.id,
          username: users.username,
          fullName: users.fullName,
          profilePhoto: users.profilePhoto,
        })
        .from(users)
        .where(
          or(
            sql`LOWER(${users.username}) LIKE ${`%${query}%`}`,
            sql`LOWER(${users.fullName}) LIKE ${`%${query}%`}`
          )
        )
        .limit(20);

      // Filter out current user and add isFollowing status
      const filteredResults = searchResults.filter(u => u.id !== req.user!.id);

      const resultsWithStatus = await Promise.all(
        filteredResults.map(async (user) => ({
          ...user,
          isFollowing: await storage.isFollowing(req.user!.id, user.id),
        }))
      );

      res.json(resultsWithStatus);
    } catch (error) {
      console.error("Search users error:", error);
      res.status(500).json({ error: "Failed to search users" });
    }
  });
  app.get("/api/users/:id", async (req, res) => {
    try {
      const id = req.params.id as string;
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ error: "Failed to get user" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
