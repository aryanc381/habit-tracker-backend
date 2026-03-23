import dotenv from 'dotenv';
dotenv.config();
export const env = {
    PORT: process.env.PORT,
    DB_CONNECTION_URI: process.env.DB_CONNECTION_URI,
    BCRYPT_SALT: process.env.BCRYPT_SALT,
    JWT_SECRET: process.env.JWT_SECRET
};
//# sourceMappingURL=env.js.map