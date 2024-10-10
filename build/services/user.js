"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("../clients/db");
class UserService {
    static followUser(from, to) {
        return db_1.prismaClient.follows.create({
            data: {
                follower: { connect: { id: from } },
                following: { connect: { id: to } }
            }
        });
    }
    static unfollowUser(from, to) {
        return db_1.prismaClient.follows.delete({
            where: {
                followerId_followingId: { followerId: from, followingId: to },
            }
        });
    }
}
exports.default = UserService;
