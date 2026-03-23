import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export const signToken = async (payload: object) => jwt.sign(payload, env.JWT_SECRET!, {expiresIn: '7d'});
export const verifyToken = async (token: string) => jwt.verify(token, env.JWT_SECRET!);