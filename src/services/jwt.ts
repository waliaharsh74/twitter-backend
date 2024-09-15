import { User } from "@prisma/client";
import { prismaClient } from "../clients/db";
import JWT from "jsonwebtoken"
import { JWTuser } from "../interfaces";
const JWT_SECRET = "hffellosnkds"
class JWTService {
    public static generateTokenForUser(user: User) {

        const payload: JWTuser = {
            id: user?.id,
            email: user?.email
        }
        const token = JWT.sign(payload, JWT_SECRET)
        return token
    }
    public static decodeToken(token: string) {

        try {
            return JWT.verify(token, JWT_SECRET) as JWTuser

        } catch (error) {
            return null

        }


    }
}
export default JWTService