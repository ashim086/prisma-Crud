import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
export const prisma = new PrismaClient({ adapter });

export async function dbConnection() {

    try {

        await prisma.$connect();

        console.log("data base connected")
    } catch (error: any) {

        console.log("error while connecting database")
        throw error
    }
}