import express, { Router } from 'express';
import mongoose from 'mongoose';
import zod from 'zod';
import { User } from '../../models/user.model.js';
import { hashPassword } from '../../lib/hash.js';

const router: Router = express.Router();

const signupSchema = zod.object({
    email: zod.email(),
    password: zod.string(),
    fullName: zod.string(),
});

router.post('/signup', async (req, res) => {
    try {
        const parsed = signupSchema.safeParse(req.body);

        if(!parsed.success) {
            const formattedMessage = parsed.error.issues.map((err) => ({message: err.message, path: err.path[0]}));
            return res.json({
                status: 422,
                msg: 'Missing / Invalid Authentication Object.',
                err: formattedMessage
            });
        }

        const {email, password, fullName } = req.body;

        const existingUser = await User.findOne({ email: email });
        if(existingUser) {
            return res.json({
                status: 409,
                msg: `${email} already exists, try again with a different email.`
            });
        }

        const encryptPassword = await hashPassword(password);

        const newUser = await User.create({ email: email, password: encryptPassword, fullName: fullName, createdAt: new Date() });

        return res.json({
            status: 200,
            msg: `${email} created successfully.`,
            fullName: newUser.fullName,
            email: newUser.email,
            password: newUser.password
        });
    } catch(err) {
        res.json({
            status: 500,
            msg: 'Internal Server Error.',
            err: err
        });
    }
});

router.get('/signup', async (req, res) => {
    return res.json({
        status: 200,
        msg: 'Singup Route is active.',
        healthStatus: 'healthy'
    });
})

export default router;
