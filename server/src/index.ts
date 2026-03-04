import dotenv from "dotenv";
dotenv.config();

import express, { Request, Response } from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import { dbConnection, prisma } from "./config/db";
import globalError from "./middlewares/global_error_handler";
import asyncHandler from "./lib/asyncHandler";
import authRoutes from "./routes/auth.routes";

const app = express();
const PORT = process.env.PORT || 5000;

// CORS configuration - IMPORTANT for authentication with cookies
app.use(cors({
    origin: process.env.CLIENT_URL || "http://localhost:3001",
    credentials: true, // Allow cookies
}));

app.use(express.json());
app.use(cookieParser());

app.get("/", (req, res) => {
    res.json({ message: `Server running with ENV ${process.env.NODE_ENV}` });
});

// Auth routes
app.use("/auth", authRoutes);

//get all
app.get("/getusers", asyncHandler(async (req, res, next) => {

    const users = await prisma.user.findMany()

    res.json(users)

})
)


//create

app.post("/add-user", async (req: Request, res: Response) => {


    const { name, email, password } = req.body;

    const user = await prisma.user.create({
        data: {
            name,
            email,
            password
        }
    })

    res.json({ msg: "user created successfully", user })
})


//get user by id

app.get(`/user/:id`, asyncHandler(async (req, res) => {


    const id = req.params.id;

    const user = await prisma.user.findUnique({

        where: {

            id: Number(id),

        },
        select: {
            id: true,
            name: true,
        }
    })

    res.json({ msg: "user succefully fetched", user })

}))



//update user by id

app.patch(`/user/:id`, asyncHandler(async (req, res) => {


    const { id } = req.params;

    const user = await prisma.user.update({
        where: {
            id: Number(id)
        }, data: {
            ...req.body
        }
    })

    res.json({

        msg: "User updated Successfully",
        user
    })
}))


//delete user by id

app.patch(`/user/:id`, asyncHandler(async (req, res) => {


    const { id } = req.params;

    const user = await prisma.user.delete({

        where: {
            id: Number(id)
        }
    })

    res.json({

        msg: "User deleted Successfully",
        user
    })
}))



app.post('/create/:userId', asyncHandler(async (req, res) => {


    const { userId } = req.params;
    const { description } = req.body;

    const user = await prisma.user.findUnique({

        where: {
            id: Number(userId)
        }
    })
    if (!user) {


        return res.json({ msg: "no user found" })
    }



    const post = await prisma.userPost.create({

        data: {
            description: description,
            userID: Number(userId)
        }
    })

    res.json({
        message: "Post created successfully",
        post
    });

}))



// get all user post


app.get(`/post/:id`, asyncHandler(async (req, res) => {


    const id = req.params.id;

    const user = await prisma.user.findUnique({

        where: {
            id: Number(id)
        }
    })
    if (!user) {


        return res.json({ msg: "user hasn't posted" })
    }

    const post = await prisma.userPost.findMany({

        where: {

            userID: Number(id),

        },
        select: {
            id: true,
            description: true,
            user: true
        }
    })

    res.json({ msg: "post succefully fetched", post })

}))

app.delete(`/post/:userID`, asyncHandler(async (req, res) => {

    const { userID } = req.params

    const posts = await prisma.userPost.findMany({

        where: {

            userID: Number(userID)
        }
    })
    if (posts.length === 0) {

        return res.json({ msg: "User hasn't posts" })
    }


    const deletedPosts = await prisma.userPost.deleteMany({
        where: {



            userID: Number(userID)
        }
    })



    res.json({ msg: "User posts deleted", deletedPosts })

})
)



//create
//get all
//get by id,name single
//update by id,name
//delete by id,name


//connection or realtionModle
//pagination 
//sorting

app.listen(PORT, async () => {

    await dbConnection();
    console.log(`Server running on http://localhost:${PORT}`);
});



app.use(globalError);