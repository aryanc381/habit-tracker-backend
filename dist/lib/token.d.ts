import jwt from 'jsonwebtoken';
export declare const signToken: (payload: object) => Promise<string>;
export declare const verifyToken: (token: string) => Promise<string | jwt.JwtPayload>;
//# sourceMappingURL=token.d.ts.map