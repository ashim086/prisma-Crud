-- CreateTable
CREATE TABLE "UserPost" (
    "id" SERIAL NOT NULL,
    "description" TEXT NOT NULL,
    "creadtedat" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userID" INTEGER NOT NULL,

    CONSTRAINT "UserPost_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "UserPost" ADD CONSTRAINT "UserPost_userID_fkey" FOREIGN KEY ("userID") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
