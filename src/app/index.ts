import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import cors from 'cors';
import express from 'express';
import { prismaClient } from '../clients/db';
import { User } from "./user"
import { Tweet } from "./tweet"
import { GraphqlContext } from '../interfaces';
import JWTService from '../services/jwt';
export async function initServer() {
    const app = express();
    app.use(cors())
    // prismaClient.user.create({
    //     data:{
    //         email
    //     }
    // })

    const graphqlServer = new ApolloServer<GraphqlContext>({
        typeDefs: `
        ${User.types}
        ${Tweet.types}
        type Query{
            ${User.queries}
            ${Tweet.queries}
        }
        type Mutation{
            ${Tweet.mutations}
            ${User.mutations}
        }`
        ,


        resolvers: {
            Query: {
                ...User.resolvers.queries,
                ...Tweet.resolvers.queries
            },
            Mutation: {
                ...Tweet.resolvers.mutations,
                ...User.resolvers.mutations
            },
            ...Tweet.resolvers.extraResolver,
            ...User.resolvers.extraResolver

        },

    });

    await graphqlServer.start();

    app.use('/graphql', express.json(), expressMiddleware(graphqlServer, {
        context: async ({ req, res }) => {
            return {
                user: req.headers.authorization ? JWTService.decodeToken(req.headers.authorization.split(' ')[1]) : undefined

            }
        }
    }));
    return app
}