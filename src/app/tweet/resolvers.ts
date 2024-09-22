import { Tweet } from "@prisma/client";

import { prismaClient } from "../../clients/db";
import { GraphqlContext } from "../../interfaces";
interface CreateTweetData {
    content: string
    imageUrl?: string
}

const mutations = {
    createTweet: async (parent: any, { payload }: { payload: CreateTweetData }, ctx: GraphqlContext) => {
        if (!ctx.user?.id) {
            throw new Error('You are not authenticated')

        }
        const tweet = await prismaClient.tweet.create({
            data: {
                content: payload.content,
                imageUrl: payload.imageUrl,
                author: { connect: { id: ctx.user.id } }
            }
        })

        return tweet
    }
}
const extraResolver = {
    Tweet: {
        author: (parent: Tweet) => prismaClient.user.findUnique({ where: { id: parent.authorId } })
    }
}
const queries = {
    getAllTweets: () => prismaClient.tweet.findMany({ orderBy: { createdAt: "desc" } })
}
export const resolvers = { mutations, extraResolver, queries }