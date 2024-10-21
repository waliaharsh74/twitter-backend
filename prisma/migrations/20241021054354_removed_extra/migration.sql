/*
  Warnings:

  - You are about to drop the `LikedTweet` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "LikedTweet" DROP CONSTRAINT "LikedTweet_tweetId_fkey";

-- DropForeignKey
ALTER TABLE "LikedTweet" DROP CONSTRAINT "LikedTweet_userId_fkey";

-- DropTable
DROP TABLE "LikedTweet";
