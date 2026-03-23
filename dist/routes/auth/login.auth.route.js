import express, { Router } from 'express';
import zod from 'zod';
import { User } from '../../models/user.model.js';
import { signToken } from '../../lib/token.js';
import { comparePassword } from '../../lib/hash.js';
const router = express.Router();
export const loginSchema = zod.object({
    email: zod.email(),
    password: zod.string().min(1)
});
router.post('/login', async (req, res) => {
    try {
        const parsed = loginSchema.safeParse(req.body);
        if (!parsed.success) { // if inavalid object is passed.
            const formattedMessage = parsed.error.issues.map((err) => ({ err: err.message, path: err.path[0] }));
            return res.status(422).json({
                msg: 'Invalid authentication object.',
                err: formattedMessage
            });
        }
        const { email, password } = req.body;
        const existingUser = await User.findOne({ email: email });
        if (!existingUser) {
            return res.status(404).json({ msg: `Invalid Email ${email} not found.` });
        }
        const isValidPassword = await comparePassword(password, existingUser.password);
        if (!isValidPassword) {
            return res.status(404).json({ msg: `Invalid Password for ${email}.` });
        }
        const token = await signToken({ id: existingUser._id, email: existingUser.email });
        await User.findByIdAndUpdate(existingUser._id, { loginToken: token });
        return res.status(200).json({
            msg: 'Authentication Successfull.',
            token: token
        });
    }
    catch (err) {
        return res.status(500).json({
            msg: 'Internal Server Error.'
        });
    }
});
router.get('/login', (req, res) => {
    res.status(200).json({
        msg: 'Login Route is active.',
        healthStatus: 'healthy'
    });
});
export default router;
//# sourceMappingURL=login.auth.route.js.map