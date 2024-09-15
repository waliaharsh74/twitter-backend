export interface JWTuser {
    id: string
    email: string
}
export interface GraphqlContext {
    user?: JWTuser
}