import { eq, and, desc, or, sql } from "drizzle-orm";
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
  passwordResetTokens,
  conversations,
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
  markAllNotificationsRead(userId: string): Promise<void>;

  getTransactions(userId: string): Promise<Transaction[]>;
  createTransaction(transaction: Partial<Transaction>): Promise<Transaction>;

  getChampions(tier?: string, year?: number): Promise<Champion[]>;
  getWallOfFame(period: string): Promise<User[]>;
  getLeaderboard(limit: number): Promise<any[]>;

  getGalleryPosts(): Promise<GalleryPost[]>;
  createGalleryPost(post: Partial<GalleryPost>): Promise<GalleryPost>;

  getNewsFeed(userId?: string): Promise<NewsFeedPost[]>;
  createNewsFeedPost(post: Partial<NewsFeedPost>): Promise<NewsFeedPost>;
  likePost(postId: string, userId: string): Promise<void>;

  getMarketItems(category?: string): Promise<any[]>;
  getMarketItem(id: string): Promise<any | null>;
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
    const result = await db.delete(users).where(eq(users.id, id));
    return true;
  }

  async getDreams(userId: string): Promise<Dream[]> {
    return db.select().from(dreams).where(eq(dreams.userId, userId)).orderBy(desc(dreams.createdAt));
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

    const followers =
      followerIds.length > 0
        ? await db.select().from(users).where(sql`${users.id} = ANY(${followerIds})`)
        : [];

    const following =
      followingIds.length > 0
        ? await db.select().from(users).where(sql`${users.id} = ANY(${followingIds})`)
        : [];

    return { followers, following };
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
      .where(and(eq(notifications.id, id), eq(notifications.userId, userId)));
    return (result as any).rowCount > 0;
  }

  async markAllNotificationsRead(userId: string): Promise<void> {
    await db.update(notifications).set({ isRead: true }).where(eq(notifications.userId, userId));
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
    const now = new Date();
    let dateFilter: Date | undefined;
    
    if (period === 'monthly') {
      dateFilter = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (period === 'yearly') {
      dateFilter = new Date(now.getFullYear(), 0, 1);
    }
    
    const allUsers = await db
      .select({
        id: users.id,
        username: users.username,
        fullName: users.fullName,
        totalPoints: users.totalPoints,
        awards: users.awards,
        profileImage: users.profileImage,
        createdAt: users.createdAt,
      })
      .from(users)
      .orderBy(desc(users.totalPoints))
      .limit(20);

    const usersWithDreams = await Promise.all(
      allUsers.map(async (user) => {
        const userDreams = await db
          .select()
          .from(dreams)
          .where(eq(dreams.userId, user.id));
        const completedDreams = userDreams.filter((d) => d.isCompleted).length;
        return {
          ...user,
          dreamsCompleted: completedDreams,
          totalDreams: userDreams.length,
        };
      })
    );

    return usersWithDreams;
  }

  async getLeaderboard(limit: number): Promise<any[]> {
    const allUsers = await db
      .select({
        id: users.id,
        username: users.username,
        fullName: users.fullName,
        totalPoints: users.totalPoints,
        awards: users.awards,
        profileImage: users.profileImage,
      })
      .from(users)
      .orderBy(desc(users.totalPoints))
      .limit(limit);

    const usersWithDreams = await Promise.all(
      allUsers.map(async (user) => {
        const userDreams = await db
          .select()
          .from(dreams)
          .where(eq(dreams.userId, user.id));
        const completedDreams = userDreams.filter((d) => d.isCompleted).length;
        return {
          ...user,
          dreamsCompleted: completedDreams,
          totalDreams: userDreams.length,
        };
      })
    );

    return usersWithDreams;
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
    const posts = await db.select().from(newsFeedPosts).orderBy(desc(newsFeedPosts.createdAt)).limit(50);
    
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

  async createNewsFeedPost(postData: Partial<NewsFeedPost>): Promise<NewsFeedPost> {
    const [post] = await db.insert(newsFeedPosts).values(postData as any).returning();
    return post;
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
    return !!member;
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
}

export const storage = new DatabaseStorage();
