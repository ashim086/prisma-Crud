import { PrismaClient } from "../generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log("🌱 Seeding database...");

    await prisma.user.createMany({
        data: [
            { name: "Alice", email: "alice@example.com" ,password:"hey"},
            { name: "Bob", email: "bob@example.com", password: "hey" },
            { name: "Charlie", email: "charlie@example.com", password: "hey" },
            { name: "Diana", email: "diana@example.com", password: "hey" },
            { name: "Eve", email: "eve@example.com", password: "hey" },
        ],
        skipDuplicates: true,
    });

    const count = await prisma.user.count();
    console.log(`✅ Seeding complete. Total users: ${count}`);
}

main()
    .catch((e) => {
        console.error("❌ Seed failed:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
