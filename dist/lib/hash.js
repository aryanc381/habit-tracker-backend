import bcrypt from 'bcrypt';
import { env } from '../config/env.js';
export const hashPassword = (password) => bcrypt.hash(password, Number(env.BCRYPT_SALT));
export const comparePassword = (password, hashedPassword) => bcrypt.compare(password, hashedPassword);
//# sourceMappingURL=hash.js.map