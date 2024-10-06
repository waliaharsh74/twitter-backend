"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolvers = void 0;
const db_1 = require("../../clients/db");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const client_s3_1 = require("@aws-sdk/client-s3");
const accessKeyId = process.env.S3_ACCESS;
const secretAccessKey = process.env.S3_SECRET_ACCESS;
if (!accessKeyId || !secretAccessKey) {
    throw new Error("AWS credentials are not set in the environment variables.");
}
const s3Client = new client_s3_1.S3Client({
    region: 'ap-south-1',
    credentials: {
        accessKeyId: accessKeyId,
        secretAccessKey: secretAccessKey,
    },
});
const mutations = {
    createTweet: (parent_1, _a, ctx_1) => __awaiter(void 0, [parent_1, _a, ctx_1], void 0, function* (parent, { payload }, ctx) {
        var _b;
        if (!((_b = ctx.user) === null || _b === void 0 ? void 0 : _b.id)) {
            throw new Error('You are not authenticated');
        }
        const tweet = yield db_1.prismaClient.tweet.create({
            data: {
                content: payload.content,
                imageUrl: payload.imageUrl,
                author: { connect: { id: ctx.user.id } }
            }
        });
        return tweet;
    })
};
const extraResolver = {
    Tweet: {
        author: (parent) => db_1.prismaClient.user.findUnique({ where: { id: parent.authorId } })
    }
};
const queries = {
    getAllTweets: () => db_1.prismaClient.tweet.findMany({ orderBy: { createdAt: "desc" } }),
    getSignedURLForTweet: (parent_1, _a, ctx_1) => __awaiter(void 0, [parent_1, _a, ctx_1], void 0, function* (parent, { imageType, imageName }, ctx) {
        if (!ctx.user || !ctx.user.id)
            throw new Error('Unauthorized');
        const allowedImageTypes = ["image/jpg", "image/jpeg", "image/png", "image/webp"];
        if (!allowedImageTypes.includes(imageType))
            throw new Error('Unsupported Image Format');
        const putObjectCommand = new client_s3_1.PutObjectCommand({
            Bucket: 'twitter-dev-harsh',
            Key: `upload/${ctx.user.id}/tweets/${imageName}-${Date.now().toString()}.${imageType}`
        });
        const signedUrl = yield (0, s3_request_presigner_1.getSignedUrl)(s3Client, putObjectCommand);
        return signedUrl;
    })
};
exports.resolvers = { mutations, extraResolver, queries };
