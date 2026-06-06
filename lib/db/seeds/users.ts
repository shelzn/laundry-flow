import bcrypt from "bcrypt";
import { db } from "..";
import { users as usersTable } from "../schema";

async function main() {
    try {
        const passwordHash = await bcrypt.hash("password123", 12);

        const userSeeds: (typeof usersTable.$inferInsert)[] = [
            {
                name: "admin",
                email: "admin@gmail.com",
                passwordHash,
                role: "admin",
            },
            {
                name: "staff",
                email: "staff@gmail.com",
                passwordHash,
                role: "staff",
            },
        ];

        await db.insert(usersTable).values(userSeeds);

        console.log("Users seeded successfully");
        process.exit(0);
    } catch (error) {
        console.error("Failed to seed users:", error);
        process.exit(1);
    }
}

main();