import { Tweet } from "@prisma/client";
import { prismaClient } from "../../clients/db";
import { GraphqlContext } from "../../interfaces";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { S3Client, PutObjectCommand, PutObjectAclCommand } from "@aws-sdk/client-s3";
import { redisClient } from "../../clients/redis";

interface CreateTweetData {
    content: string
    imageUrl?: string
}
const accessKeyId = process.env.S3_ACCESS;
const secretAccessKey = process.env.S3_SECRET_ACCESS;

if (!accessKeyId || !secretAccessKey) {
    throw new Error("AWS credentials are not set in the environment variables.");
}

const s3Client = new S3Client({
    region: 'ap-south-1',
    credentials: {
        accessKeyId: accessKeyId,
        secretAccessKey: secretAccessKey,
    },
});

const mutations = {
    createTweet: async (parent: any, { payload }: { payload: CreateTweetData }, ctx: GraphqlContext) => {
        if (!ctx.user?.id) {
            throw new Error('You are not authenticated')

        }
        const rateLimitFlag = await redisClient.get(
            `RATE_LIMIT:TWEET:${ctx.user.id}`
          );
          if (rateLimitFlag) throw new Error("Please wait....");
        const tweet = await prismaClient.tweet.create({
            data: {
                content: payload.content,
                imageUrl: payload.imageUrl,
                author: { connect: { id: ctx.user.id } }
            }
        })
        await redisClient.setex(`RATE_LIMIT:TWEET:${ctx.user.id}`, 10, 1);
        await redisClient.del("ALL_TWEETS");

        return tweet
    }
}
const extraResolver = {
    Tweet: {
        author: (parent: Tweet) => prismaClient.user.findUnique({ where: { id: parent.authorId } })
    }
}
const queries = {
    getAllTweets: async() => {
        const cachedTweets = await redisClient.get("ALL_TWEETS");
        console.log("cached data>>>",cachedTweets)
        if (cachedTweets) return JSON.parse(cachedTweets);
        const tweets =await prismaClient.tweet.findMany({ orderBy: { createdAt: "desc" } })
        await redisClient.set("ALL_TWEETS", JSON.stringify(tweets));
        return tweets
    },
    getSignedURLForTweet: async (parent: any, { imageType, imageName }: { imageType: string, imageName: string }, ctx: GraphqlContext) => {
        if (!ctx.user || !ctx.user.id) throw new Error('Unauthorized');
        const allowedImageTypes = ["image/jpg", "image/jpeg", "image/png", "image/webp"]
        if (!allowedImageTypes.includes(imageType)) throw new Error('Unsupported Image Format');

        const putObjectCommand = new PutObjectCommand({
            Bucket: 'twitter-dev-harsh',
            Key: `upload/${ctx.user.id}/tweets/${imageName}-${Date.now().toString()}.${imageType}`
        })

        const signedUrl = await getSignedUrl(s3Client, putObjectCommand)
        return signedUrl

    }
}
export const resolvers = { mutations, extraResolver, queries }