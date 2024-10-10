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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolvers = void 0;
const axios_1 = __importDefault(require("axios"));
const db_1 = require("../../clients/db");
const jwt_1 = __importDefault(require("../../services/jwt"));
const user_1 = __importDefault(require("../../services/user"));
const queries = {
    verifyGoogleToken: (parent_1, _a) => __awaiter(void 0, [parent_1, _a], void 0, function* (parent, { token }) {
        const googleToken = token;
        const googleOauth = new URL('https://oauth2.googleapis.com/tokeninfo');
        googleOauth.searchParams.set('id_token', googleToken);
        const { data } = yield axios_1.default.get(googleOauth.toString(), {
            responseType: 'json'
        });
        const user = yield db_1.prismaClient.user.findUnique({ where: { email: data.email } });
        if (!user) {
            yield db_1.prismaClient.user.create({
                data: {
                    email: data.email,
                    firstName: data.given_name,
                    lastName: data.family_name,
                    profileImageURL: data.picture
                }
            });
        }
        const userInDb = yield db_1.prismaClient.user.findUnique({ where: { email: data.email } });
        if (!userInDb)
            throw new Error('User with Email not found');
        const userToken = jwt_1.default.generateTokenForUser(userInDb);
        return userToken;
    }),
    getCurrentUser: (parent, args, ctx) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        const id = (_a = ctx.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!id)
            return null;
        const user = yield db_1.prismaClient.user.findUnique({ where: { id } });
        return user;
    }),
    getUserById: (parent_1, _a, ctx_1) => __awaiter(void 0, [parent_1, _a, ctx_1], void 0, function* (parent, { id }, ctx) { return db_1.prismaClient.user.findUnique({ where: { id } }); })
};
const extraResolver = {
    User: {
        tweets: (parent) => __awaiter(void 0, void 0, void 0, function* () { return yield db_1.prismaClient.tweet.findMany({ where: { author: { id: parent.id } } }); }),
        followers: (parent) => __awaiter(void 0, void 0, void 0, function* () {
            const result = yield db_1.prismaClient.follows.findMany({ where: { following: { id: parent.id } }, include: { follower: true } });
            return result.map((ele) => ele.follower);
        }),
        following: (parent) => __awaiter(void 0, void 0, void 0, function* () {
            const result = yield db_1.prismaClient.follows.findMany({ where: { follower: { id: parent.id } }, include: { following: true } });
            return result.map((ele) => ele.following);
        }),
    }
};
const mutations = {
    followUser: (parent_1, _a, ctx_1) => __awaiter(void 0, [parent_1, _a, ctx_1], void 0, function* (parent, { to }, ctx) {
        if (!ctx.user || !ctx.user.id)
            throw new Error('Unauthenticated');
        yield user_1.default.followUser(ctx.user.id, to);
        return true;
    }),
    unfollowUser: (parent_1, _a, ctx_1) => __awaiter(void 0, [parent_1, _a, ctx_1], void 0, function* (parent, { to }, ctx) {
        if (!ctx.user || !ctx.user.id)
            throw new Error('Unauthenticated');
        yield user_1.default.unfollowUser(ctx.user.id, to);
        return true;
    })
};
exports.resolvers = { queries, extraResolver, mutations };
