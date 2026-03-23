import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
export const signToken = async (payload) => jwt.sign(payload, env.JWT_SECRET, { expiresIn: '7d' });
export const verifyToken = async (token) => jwt.verify(token, env.JWT_SECRET);
//# sourceMappingURL=token.js.map