import bcrypt from 'bcrypt';
import { env } from '../config/env.js';

export const hashPassword = (password: string) => bcrypt.hash(password, Number(env.BCRYPT_SALT)!);
export const comparePassword = (password: string, hashedPassword: string) => bcrypt.compare(password, hashedPassword);