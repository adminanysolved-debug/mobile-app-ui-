import { eq, and, desc, or, sql, inArray } from "drizzle-orm";
import { db } from "./db.js";
import {
  users,
  dreams,
  dreamMembers,
  dreamTasks,
  connections,
  messages,
  notifications,
  transactions,
  champions,
  galleryPosts,
  newsFeedPosts,
  postLikes,
  postComments,
  marketItems,
  marketPurchases,
  passwordResetTokens,
  conversations,
  activeAds,
  type User,
  type Dream,
  type DreamTask,
  type Message,
  type Notification,
  type Transaction,
  type Connection,
  type Champion,
  type GalleryPost,
  type NewsFeedPost,
  type PasswordResetToken,
  type Conversation,
  type MarketItem,
  type MarketPurchase,
  type ActiveAd,
} from "./shared/schema.js";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined>;
  createUser(user: Partial<User>): Promise<User>;
  updateUser(id: string, data: Partial<User>): Promise<User | undefined>;
  deleteUser(id: string): Promise<boolean>;

  getDreams(userId: string): Promise<Dream[]>;
  getDream(id: string): Promise<Dream | undefined>;
  createDream(dream: Partial<Dream>): Promise<Dream>;
  updateDream(id: string, data: Partial<Dream>): Promise<Dream | undefined>;
  deleteDream(id: string): Promise<boolean>;
  deleteDreamTasks(dreamId: string): Promise<void>;

  getConnections(userId: string): Promise<{ followers: User[]; following: User[] }>;
  createConnection(followerId: string, followingId: string): Promise<Connection>;
  deleteConnection(followerId: string, followingId: string): Promise<boolean>;
  isFollowing(followerId: string, followingId: string): Promise<boolean>;

  getMessages(userId: string): Promise<Message[]>;
  getConversation(userId1: string, userId2: string): Promise<Message[]>;
  createMessage(message: Partial<Message>): Promise<Message>;
  markMessageRead(id: string): Promise<void>;

  getNotifications(userId: string): Promise<Notification[]>;
  createNotification(notification: Partial<Notification>): Promise<Notification>;
  markNotificationRead(id: string, userId: string): Promise<boolean>;
  deleteNotification(id: string, userId: string): Promise<boolean>;
  markAllNotificationsRead(userId: string): Promise<void>;
  getUnreadNotificationCount(userId: string): Promise<number>;

  getTransactions(userId: string): Promise<Transaction[]>;
  createTransaction(transaction: Partial<Transaction>): Promise<Transaction>;

  getChampions(tier?: string, year?: number): Promise<Champion[]>;
  getWallOfFame(period: string): Promise<User[]>;
  getLeaderboard(limit: number): Promise<any[]>;

  getGalleryPosts(): Promise<GalleryPost[]>;
  createGalleryPost(post: Partial<GalleryPost>): Promise<GalleryPost>;

  getNewsFeed(userId?: string): Promise<NewsFeedPost[]>;
  createNewsFeedPost(post: Partial<NewsFeedPost>): Promise<NewsFeedPost>;
  deleteNewsFeedPost(postId: string, userId: string): Promise<boolean>;
  likePost(postId: string, userId: string): Promise<void>;
  unlikePost(postId: string, userId: string): Promise<void>;

  getPostComments(postId: string): Promise<any[]>;
  createPostComment(comment: Partial<typeof postComments.$inferInsert>): Promise<any>;
  deletePostComment(commentId: string, userId: string): Promise<boolean>;

  getMarketItems(category?: string): Promise<any[]>;
  getMarketItem(id: string): Promise<any | null>;
  getPurchaseHistory(userId: string): Promise<any[]>;
  createMarketItem(itemData: Partial<typeof marketItems.$inferInsert>): Promise<any>;
  purchaseMarketItem(userId: string, marketItemId: string, price: number, vendorId: string): Promise<boolean>;
  getVendorMarketItemsCount(vendorId: string): Promise<number>;
  hasPurchasedMarketItem(userId: string, marketItemId: string): Promise<boolean>;
  getDreamCounts(userId: string): Promise<{ personal: number; challenge: number; group: number }>;
  getActiveAd(): Promise<ActiveAd | undefined>;
  updateActiveAd(data: Partial<ActiveAd>): Promise<ActiveAd>;
}

class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.firebaseUid, firebaseUid));
    return user;
  }

  async createUser(userData: Partial<User>): Promise<User> {
    const [user] = await db.insert(users).values(userData as any).returning();
    return user;
  }

  async updateUser(id: string, data: Partial<User>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async deleteUser(id: string): Promise<boolean> {
    await db.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, id));
    await db.delete(marketPurchases).where(or(eq(marketPurchases.userId, id), eq(marketPurchases.vendorId, id)));
    await db.delete(marketItems).where(eq(marketItems.userId, id));
    await db.delete(postComments).where(eq(postComments.userId, id));
    await db.delete(postLikes).where(eq(postLikes.userId, id));
    await db.delete(newsFeedPosts).where(eq(newsFeedPosts.userId, id));
    await db.delete(galleryPosts).where(eq(galleryPosts.userId, id));
    await db.delete(champions).where(eq(champions.userId, id));
    await db.delete(transactions).where(eq(transactions.userId, id));
    await db.delete(notifications).where(eq(notifications.userId, id));
    await db.delete(messages).where(or(eq(messages.senderId, id), eq(messages.receiverId, id)));
    await db.delete(conversations).where(or(eq(conversations.participant1Id, id), eq(conversations.participant2Id, id)));
    await db.delete(connections).where(or(eq(connections.followerId, id), eq(connections.followingId, id)));
    await db.delete(dreamMembers).where(eq(dreamMembers.userId, id));

    const userDreams = await db.select({ id: dreams.id }).from(dreams).where(eq(dreams.userId, id));
    if (userDreams.length > 0) {
      const dreamIds = userDreams.map(d => d.id);
      await db.delete(dreamTasks).where(inArray(dreamTasks.dreamId, dreamIds));
      await db.delete(dreams).where(eq(dreams.userId, id));
    }

    await db.delete(users).where(eq(users.id, id));
    return true;
  }

  async getDreams(userId: string): Promise<Dream[]> {
    return db.select().from(dreams).where(eq(dreams.userId, userId)).orderBy(desc(dreams.createdAt));
  }

  async getDreamCounts(userId: string): Promise<{ personal: number; challenge: number; group: number }> {
    const userDreams = await db.select().from(dreams).where(eq(dreams.userId, userId));
    return {
      personal: userDreams.filter(d => d.type === "personal").length,
      challenge: userDreams.filter(d => d.type === "challenge").length,
      group: userDreams.filter(d => d.type === "group").length,
    };
  }

  async getDream(id: string): Promise<Dream | undefined> {
    const [dream] = await db.select().from(dreams).where(eq(dreams.id, id));
    return dream;
  }

  async createDream(dreamData: Partial<Dream>): Promise<Dream> {
    const [dream] = await db.insert(dreams).values(dreamData as any).returning();
    return dream;
  }

  async updateDream(id: string, data: Partial<Dream>): Promise<Dream | undefined> {
    const [dream] = await db
      .update(dreams)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(dreams.id, id))
      .returning();
    return dream;
  }

  async deleteDream(id: string): Promise<boolean> {
    await db.delete(dreamTasks).where(eq(dreamTasks.dreamId, id));
    await db.delete(dreamMembers).where(eq(dreamMembers.dreamId, id));
    await db.delete(newsFeedPosts).where(eq(newsFeedPosts.dreamId, id));
    await db.delete(dreams).where(eq(dreams.id, id));
    return true;
  }

  async getConnections(userId: string): Promise<{ followers: User[]; following: User[] }> {
    const followersData = await db
      .select()
      .from(connections)
      .where(eq(connections.followingId, userId));

    const followingData = await db
      .select()
      .from(connections)
      .where(eq(connections.followerId, userId));

    const followerIds = followersData.map((c) => c.followerId);
    const followingIds = followingData.map((c) => c.followingId);

    // Use inArray() — the correct Drizzle ORM helper for WHERE id IN (array).
    // The previous sql`${users.id} = ANY(${array})` pattern did NOT correctly
    // bind a JS array as a SQL array literal, causing the query to return 0 rows.
    const followers =
      followerIds.length > 0
        ? await db.select().from(users).where(inArray(users.id, followerIds))
        : [];

    const following =
      followingIds.length > 0
        ? await db.select().from(users).where(inArray(users.id, followingIds))
        : [];

    // Add isFollowing flag to followers to show if you follow them back
    const followersWithStatus = followers.map((follower) => ({
      ...follower,
      isFollowing: followingIds.includes(follower.id),
    }));

    // Add isFollowing flag to following (always true since you're following them)
    const followingWithStatus = following.map((followed) => ({
      ...followed,
      isFollowing: true,
    }));

    return { followers: followersWithStatus, following: followingWithStatus };
  }

  async createConnection(followerId: string, followingId: string): Promise<Connection> {
    const [connection] = await db
      .insert(connections)
      .values({ followerId, followingId })
      .returning();
    return connection;
  }

  async deleteConnection(followerId: string, followingId: string): Promise<boolean> {
    await db
      .delete(connections)
      .where(and(eq(connections.followerId, followerId), eq(connections.followingId, followingId)));
    return true;
  }

  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    const [connection] = await db
      .select()
      .from(connections)
      .where(and(eq(connections.followerId, followerId), eq(connections.followingId, followingId)));
    return !!connection;
  }

  async getMessages(userId: string): Promise<Message[]> {
    return db
      .select()
      .from(messages)
      .where(or(eq(messages.senderId, userId), eq(messages.receiverId, userId)))
      .orderBy(desc(messages.createdAt));
  }

  async getConversation(userId1: string, userId2: string): Promise<Message[]> {
    return db
      .select()
      .from(messages)
      .where(
        or(
          and(eq(messages.senderId, userId1), eq(messages.receiverId, userId2)),
          and(eq(messages.senderId, userId2), eq(messages.receiverId, userId1))
        )
      )
      .orderBy(messages.createdAt);
  }

  async createMessage(messageData: Partial<Message>): Promise<Message> {
    const [message] = await db.insert(messages).values(messageData as any).returning();
    return message;
  }

  async markMessageRead(id: string): Promise<void> {
    await db.update(messages).set({ isRead: true }).where(eq(messages.id, id));
  }

  async getNotifications(userId: string): Promise<Notification[]> {
    return db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));
  }

  async createNotification(notificationData: Partial<Notification>): Promise<Notification> {
    const [notification] = await db
      .insert(notifications)
      .values(notificationData as any)
      .returning();
    return notification;
  }

  async markNotificationRead(id: string, userId: string): Promise<boolean> {
    const result = await db.update(notifications)
      .set({ isRead: true })
      .where(and(eq(notifications.id, id), eq(notifications.userId, userId)))
      .returning({ id: notifications.id });
    return result.length > 0;
  }

  async markAllNotificationsRead(userId: string): Promise<void> {
    await db.update(notifications).set({ isRead: true }).where(eq(notifications.userId, userId));
  }

  async deleteNotification(id: string, userId: string): Promise<boolean> {
    const result = await db.delete(notifications)
      .where(and(eq(notifications.id, id), eq(notifications.userId, userId)))
      .returning({ id: notifications.id });
    return result.length > 0;
  }

  async getUnreadNotificationCount(userId: string): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` })
      .from(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
    return result[0]?.count || 0;
  }

  async getTransactions(userId: string): Promise<Transaction[]> {
    return db
      .select()
      .from(transactions)
      .where(eq(transactions.userId, userId))
      .orderBy(desc(transactions.createdAt));
  }

  async createTransaction(transactionData: Partial<Transaction>): Promise<Transaction> {
    const [transaction] = await db
      .insert(transactions)
      .values(transactionData as any)
      .returning();
    return transaction;
  }

  async getChampions(tier?: string, year?: number): Promise<Champion[]> {
    let query = db.select().from(champions);
    if (tier) {
      query = query.where(eq(champions.tier, tier)) as typeof query;
    }
    if (year) {
      query = query.where(eq(champions.year, year)) as typeof query;
    }
    return query.orderBy(desc(champions.points));
  }

  async getWallOfFame(period: string): Promise<any[]> {
    const rawSql = `
      SELECT 
        u.id, 
        u.username, 
        u.full_name as "fullName", 
        u.total_points as "totalPoints", 
        u.awards, 
        u.profile_image as "profileImage", 
        COUNT(d.id)::int as "totalDreams",
        COUNT(CASE WHEN d.is_completed = true THEN 1 END)::int as "dreamsCompleted"
      FROM users u
      LEFT JOIN dreams d ON u.id = d.user_id
      GROUP BY u.id
      ORDER BY u.total_points DESC NULLS LAST
      LIMIT 20;
    `;
    const result = await db.execute(sql.raw(rawSql));
    return result as any[];
  }

  async getLeaderboard(limit: number): Promise<any[]> {
    const rawSql = `
      SELECT 
        u.id, 
        u.username, 
        u.full_name as "fullName", 
        u.total_points as "totalPoints", 
        u.awards, 
        u.profile_image as "profileImage", 
        COUNT(d.id)::int as "totalDreams",
        COUNT(CASE WHEN d.is_completed = true THEN 1 END)::int as "dreamsCompleted"
      FROM users u
      LEFT JOIN dreams d ON u.id = d.user_id
      GROUP BY u.id
      ORDER BY u.total_points DESC NULLS LAST
      LIMIT ${Number(limit) || 10};
    `;
    const result = await db.execute(sql.raw(rawSql));
    return result as any[];
  }

  async getGalleryPosts(): Promise<any[]> {
    const posts = await db.select().from(galleryPosts).orderBy(desc(galleryPosts.createdAt));

    const postsWithUsers = await Promise.all(
      posts.map(async (post) => {
        const user = await this.getUser(post.userId);
        const dream = post.dreamId ? await this.getDream(post.dreamId) : null;
        return {
          ...post,
          user: user ? { id: user.id, username: user.username, fullName: user.fullName, profileImage: user.profileImage } : null,
          dream: dream ? { id: dream.id, title: dream.title, type: dream.type } : null,
        };
      })
    );

    return postsWithUsers;
  }

  async createGalleryPost(postData: Partial<GalleryPost>): Promise<GalleryPost> {
    const [post] = await db.insert(galleryPosts).values(postData as any).returning();
    return post;
  }

  async getNewsFeed(userId?: string): Promise<any[]> {
    const rawSql = `
      SELECT 
        p.*,
        u.id as "user_id", u.username as "user_username", u.full_name as "user_fullName", u.profile_image as "user_profileImage",
        d.id as "dream_id", d.title as "dream_title", d.type as "dream_type"
      FROM news_feed_posts p
      LEFT JOIN users u ON p.user_id = u.id
      LEFT JOIN dreams d ON p.dream_id = d.id
      ORDER BY p.created_at DESC
      LIMIT 50;
    `;
    const rows = await db.execute(sql.raw(rawSql));

    // Map the flat SQL result into the nested objects expected by the frontend
    return (rows as any[]).map(row => ({
      id: row.id,
      userId: row.user_id,
      content: row.content,
      likes: row.likes,
      comments: row.comments,
      createdAt: row.created_at,
      user: {
        id: row.user_id,
        username: row.user_username,
        fullName: row.user_fullName,
        profileImage: row.user_profileImage
      },
      dream: row.dream_id ? {
        id: row.dream_id,
        title: row.dream_title,
        type: row.dream_type
      } : null
    }));
  }

  async createNewsFeedPost(postData: Partial<NewsFeedPost>): Promise<NewsFeedPost> {
    const [post] = await db.insert(newsFeedPosts).values(postData as any).returning();
    return post;
  }

  async deleteNewsFeedPost(postId: string, userId: string): Promise<boolean> {
    const user = await this.getUser(userId);
    const isAdmin = user?.isAdmin || false;

    if (isAdmin) {
      await db.delete(newsFeedPosts).where(eq(newsFeedPosts.id, postId));
      return true;
    }

    // Only author can delete if not admin
    const [existing] = await db.select().from(newsFeedPosts).where(and(eq(newsFeedPosts.id, postId), eq(newsFeedPosts.userId, userId)));
    if (!existing) return false;

    await db.delete(newsFeedPosts).where(eq(newsFeedPosts.id, postId));
    return true;
  }

  async likePost(postId: string, userId: string): Promise<void> {
    const [existing] = await db
      .select()
      .from(postLikes)
      .where(and(eq(postLikes.postId, postId), eq(postLikes.userId, userId)));

    if (!existing) {
      await db.insert(postLikes).values({ postId, userId });
      await db
        .update(newsFeedPosts)
        .set({ likes: sql`${newsFeedPosts.likes} + 1` })
        .where(eq(newsFeedPosts.id, postId));
    }
  }

  async unlikePost(postId: string, userId: string): Promise<void> {
    const [existing] = await db
      .select()
      .from(postLikes)
      .where(and(eq(postLikes.postId, postId), eq(postLikes.userId, userId)));

    if (existing) {
      await db.delete(postLikes).where(and(eq(postLikes.postId, postId), eq(postLikes.userId, userId)));
      await db
        .update(newsFeedPosts)
        .set({ likes: sql`GREATEST(${newsFeedPosts.likes} - 1, 0)` })
        .where(eq(newsFeedPosts.id, postId));
    }
  }

  async getPostComments(postId: string): Promise<any[]> {
    const rawSql = `
      SELECT 
        c.*,
        u.id as "user_id", u.username as "user_username", u.full_name as "user_fullName", u.profile_image as "user_profileImage"
      FROM post_comments c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.post_id = '${postId}'
      ORDER BY c.created_at ASC;
    `;
    const rows = await db.execute(sql.raw(rawSql));

    return (rows as any[]).map(row => ({
      id: row.id,
      userId: row.user_id,
      content: row.content,
      createdAt: row.created_at,
      user: {
        id: row.user_id,
        username: row.user_username,
        fullName: row.user_fullName,
        profileImage: row.user_profileImage
      }
    }));
  }

  async createPostComment(commentData: Partial<typeof postComments.$inferInsert>): Promise<any> {
    const [comment] = await db.insert(postComments).values(commentData as any).returning();

    // Update comment counter
    await db
      .update(newsFeedPosts)
      .set({ comments: sql`${newsFeedPosts.comments} + 1` })
      .where(eq(newsFeedPosts.id, commentData.postId as string));

    return comment;
  }

  async deletePostComment(commentId: string, userId: string): Promise<boolean> {
    const user = await this.getUser(userId);
    const isAdmin = user?.isAdmin || false;

    let existingComment;
    if (isAdmin) {
      [existingComment] = await db.select().from(postComments).where(eq(postComments.id, commentId));
    } else {
      [existingComment] = await db.select().from(postComments).where(and(eq(postComments.id, commentId), eq(postComments.userId, userId)));
    }

    if (!existingComment) return false;

    // Decrement counter
    await db
      .update(newsFeedPosts)
      .set({ comments: sql`GREATEST(${newsFeedPosts.comments} - 1, 0)` })
      .where(eq(newsFeedPosts.id, existingComment.postId as string));

    await db.delete(postComments).where(eq(postComments.id, commentId));
    return true;
  }

  async getMarketItems(category?: string): Promise<any[]> {
    if (category) {
      return db
        .select()
        .from(marketItems)
        .where(and(eq(marketItems.isActive, true), eq(marketItems.category, category)))
        .orderBy(desc(marketItems.createdAt));
    }
    return db
      .select()
      .from(marketItems)
      .where(eq(marketItems.isActive, true))
      .orderBy(desc(marketItems.createdAt));
  }

  async createMarketItem(itemData: Partial<typeof marketItems.$inferInsert>): Promise<any> {
    const [item] = await db.insert(marketItems).values(itemData as any).returning();
    return item;
  }

  async getMarketItemCount(): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` }).from(marketItems);
    return result[0]?.count || 0;
  }

  async getMarketItem(id: string): Promise<any | null> {
    const [item] = await db.select().from(marketItems).where(eq(marketItems.id, id));
    return item || null;
  }

  async getPurchaseHistory(userId: string): Promise<any[]> {
    return db
      .select({
        purchase: marketPurchases,
        item: marketItems,
      })
      .from(marketPurchases)
      .innerJoin(marketItems, eq(marketPurchases.marketItemId, marketItems.id))
      .where(eq(marketPurchases.userId, userId))
      .orderBy(desc(marketPurchases.createdAt));
  }

  async purchaseMarketItem(userId: string, marketItemId: string, price: number, vendorId: string): Promise<boolean> {
    try {
      await db.transaction(async (tx) => {
        // Deduct coins from buyer
        await tx.update(users)
          .set({ coins: sql`${users.coins} - ${price}` })
          .where(eq(users.id, userId));

        // Add coins to vendor
        await tx.update(users)
          .set({ coins: sql`${users.coins} + ${price}` })
          .where(eq(users.id, vendorId));

        // Log transaction for buyer
        await tx.insert(transactions).values({
          userId,
          amount: -price,
          type: "market_purchase",
          description: `Purchased market item ${marketItemId}`
        });

        // Log transaction for vendor
        await tx.insert(transactions).values({
          userId: vendorId,
          amount: price,
          type: "market_sale",
          description: `Sold market item ${marketItemId}`
        });

        // Create market purchase record
        const [purchase] = await tx.insert(marketPurchases).values({
          userId,
          marketItemId,
          vendorId,
          amount: price
        }).returning();

        // If it's a dream guide, create it as a personal dream for the user
        const [item] = await tx.select().from(marketItems).where(eq(marketItems.id, marketItemId));
        if (item && item.category?.toLowerCase() === "dream") {
          await tx.insert(dreams).values({
            userId,
            title: item.title,
            description: item.description,
            type: "personal",
            routineDescription: item.howToAchieve, // Store the guide here
            designNotes: "Created from Marketplace purchase",
          } as any);
        }
      });
      return true;
    } catch (e) {
      console.error("Purchase transaction failed:", e);
      return false;
    }
  }

  async getVendorMarketItemsCount(vendorId: string): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` }).from(marketItems).where(eq(marketItems.userId, vendorId));
    return result[0]?.count || 0;
  }

  async hasPurchasedMarketItem(userId: string, marketItemId: string): Promise<boolean> {
    const [purchase] = await db.select().from(marketPurchases).where(and(eq(marketPurchases.userId, userId), eq(marketPurchases.marketItemId, marketItemId)));
    return !!purchase;
  }

  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.googleId, googleId));
    return user;
  }

  async getUserByFacebookId(facebookId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.facebookId, facebookId));
    return user;
  }

  async createPasswordResetToken(userId: string, token: string): Promise<PasswordResetToken> {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);
    const [resetToken] = await db.insert(passwordResetTokens).values({
      userId,
      token,
      expiresAt,
    }).returning();
    return resetToken;
  }

  async getPasswordResetToken(token: string): Promise<PasswordResetToken | undefined> {
    const [resetToken] = await db.select().from(passwordResetTokens).where(eq(passwordResetTokens.token, token));
    return resetToken;
  }

  async markPasswordResetTokenUsed(id: string): Promise<void> {
    await db.update(passwordResetTokens).set({ usedAt: new Date() }).where(eq(passwordResetTokens.id, id));
  }

  async getConversations(userId: string): Promise<any[]> {
    const userMessages = await db
      .select()
      .from(messages)
      .where(or(eq(messages.senderId, userId), eq(messages.receiverId, userId)))
      .orderBy(desc(messages.createdAt));

    const conversationMap = new Map<string, { otherUserId: string; lastMessage: Message; unreadCount: number }>();

    for (const msg of userMessages) {
      const otherUserId = msg.senderId === userId ? msg.receiverId : msg.senderId;
      if (!conversationMap.has(otherUserId)) {
        conversationMap.set(otherUserId, {
          otherUserId,
          lastMessage: msg,
          unreadCount: 0,
        });
      }
      if (!msg.isRead && msg.receiverId === userId) {
        const conv = conversationMap.get(otherUserId)!;
        conv.unreadCount++;
      }
    }

    const conversationsWithUsers = await Promise.all(
      Array.from(conversationMap.values()).map(async (conv) => {
        const otherUser = await this.getUser(conv.otherUserId);
        return {
          id: conv.otherUserId,
          otherUser: otherUser ? {
            id: otherUser.id,
            username: otherUser.username,
            fullName: otherUser.fullName,
            profileImage: otherUser.profileImage,
          } : null,
          lastMessage: conv.lastMessage.content,
          lastMessageTime: conv.lastMessage.createdAt,
          unreadCount: conv.unreadCount,
        };
      })
    );

    return conversationsWithUsers.sort((a, b) =>
      new Date(b.lastMessageTime!).getTime() - new Date(a.lastMessageTime!).getTime()
    );
  }

  async markAllMessagesRead(userId: string, otherUserId: string): Promise<void> {
    await db.update(messages)
      .set({ isRead: true })
      .where(
        and(
          eq(messages.senderId, otherUserId),
          eq(messages.receiverId, userId),
          eq(messages.isRead, false)
        )
      );
  }

  async addDreamMember(dreamId: string, userId: string, role: string = 'member'): Promise<void> {
    await db.insert(dreamMembers).values({ dreamId, userId, role });
  }

  async getDreamMembers(dreamId: string): Promise<any[]> {
    const members = await db.select().from(dreamMembers).where(eq(dreamMembers.dreamId, dreamId));
    const membersWithUsers = await Promise.all(
      members.map(async (member) => {
        const user = await this.getUser(member.userId);
        return {
          ...member,
          user: user ? { id: user.id, username: user.username, fullName: user.fullName, profileImage: user.profileImage } : null,
        };
      })
    );
    return membersWithUsers;
  }

  async removeDreamMember(dreamId: string, userId: string): Promise<void> {
    await db.delete(dreamMembers).where(and(eq(dreamMembers.dreamId, dreamId), eq(dreamMembers.userId, userId)));
  }

  async isDreamMember(dreamId: string, userId: string): Promise<boolean> {
    const [member] = await db.select().from(dreamMembers).where(
      and(eq(dreamMembers.dreamId, dreamId), eq(dreamMembers.userId, userId))
    );
    return !!member && member.role !== 'pending';
  }

  async updateDreamMemberRole(dreamId: string, userId: string, role: string): Promise<void> {
    await db.update(dreamMembers).set({ role }).where(
      and(eq(dreamMembers.dreamId, dreamId), eq(dreamMembers.userId, userId))
    );
  }

  async getDreamTasks(dreamId: string): Promise<DreamTask[]> {
    return db.select().from(dreamTasks).where(eq(dreamTasks.dreamId, dreamId)).orderBy(dreamTasks.order, dreamTasks.dueDate);
  }

  async getDreamTask(id: string): Promise<DreamTask | undefined> {
    const [task] = await db.select().from(dreamTasks).where(eq(dreamTasks.id, id));
    return task;
  }

  async createDreamTask(taskData: Partial<DreamTask>): Promise<DreamTask> {
    const [task] = await db.insert(dreamTasks).values(taskData as any).returning();
    return task;
  }

  async updateDreamTask(id: string, data: Partial<DreamTask>): Promise<DreamTask | undefined> {
    const [task] = await db
      .update(dreamTasks)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(dreamTasks.id, id))
      .returning();
    return task;
  }

  async deleteDreamTask(id: string): Promise<boolean> {
    await db.delete(dreamTasks).where(eq(dreamTasks.id, id));
    return true;
  }

  async deleteDreamTasks(dreamId: string): Promise<void> {
    await db.delete(dreamTasks).where(eq(dreamTasks.dreamId, dreamId));
  }

  async toggleDreamTaskComplete(id: string): Promise<DreamTask | undefined> {
    const task = await this.getDreamTask(id);
    if (!task) return undefined;

    const isCompleted = !task.isCompleted;
    const [updated] = await db
      .update(dreamTasks)
      .set({
        isCompleted,
        completedAt: isCompleted ? new Date() : null,
        updatedAt: new Date()
      })
      .where(eq(dreamTasks.id, id))
      .returning();

    return updated;
  }

  async calculateDreamProgress(dreamId: string): Promise<number> {
    const tasks = await this.getDreamTasks(dreamId);
    if (tasks.length === 0) return 0;

    const completedTasks = tasks.filter(t => t.isCompleted).length;
    return Math.round((completedTasks / tasks.length) * 100);
  }

  async updateDreamProgress(dreamId: string): Promise<Dream | undefined> {
    const progress = await this.calculateDreamProgress(dreamId);
    const isCompleted = progress === 100;

    return this.updateDream(dreamId, {
      progress,
      isCompleted,
      completedAt: isCompleted ? new Date() : null,
    });
  }

  async getActiveAd(): Promise<ActiveAd | undefined> {
    const [ad] = await db.select().from(activeAds).where(eq(activeAds.isActive, true)).orderBy(desc(activeAds.createdAt)).limit(1);
    return ad;
  }

  async updateActiveAd(data: Partial<ActiveAd>): Promise<ActiveAd> {
    const existing = await this.getActiveAd();
    if (existing) {
      const [updated] = await db.update(activeAds).set({ ...data, updatedAt: new Date() }).where(eq(activeAds.id, existing.id)).returning();
      return updated;
    } else {
      const [created] = await db.insert(activeAds).values(data as any).returning();
      return created;
    }
  }
}

export const storage = new DatabaseStorage();
