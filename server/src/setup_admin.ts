import "dotenv/config";
import { db } from "./db.js";
import { users } from "./shared/schema.js";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

async function checkAndCreateAdmin() {
    try {
        console.log("Checking for admin user...");
        const adminEmail = "admin@realdream.app";
        const adminPass = "admin123";
        
        const [existingAdmin] = await db.select().from(users).where(eq(users.email, adminEmail));
        
        if (existingAdmin) {
            console.log("Admin already exists:", existingAdmin.email);
            // Ensure they are admin
            if (!existingAdmin.isAdmin) {
                await db.update(users).set({ isAdmin: true }).where(eq(users.id, existingAdmin.id));
                console.log("Updated existing user to admin.");
            }
        } else {
            console.log("Creating new admin user...");
            const hashedPassword = await bcrypt.hash(adminPass, 10);
            await db.insert(users).values({
                email: adminEmail,
                username: "admin",
                password: hashedPassword,
                fullName: "System Admin",
                isAdmin: true,
                coins: 1000000,
            });
            console.log("Admin user created successfully.");
        }
    } catch (error) {
        console.error("Error checking/creating admin:", error);
    } finally {
        process.exit(0);
    }
}

checkAndCreateAdmin();
