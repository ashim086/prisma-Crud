import { PrismaClient } from "@prisma/client/extension";

const prisma = new PrismaClient();


export async function addUser() {

    try {

        await prisma.user.create({

            data: {

                name: 'ram',
                email: "ram@gmail.com"
            }
        })

    } catch (error) {
        console.log("error while adding", error)
    }
}