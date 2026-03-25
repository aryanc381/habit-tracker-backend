import express, { Router } from 'express';
import zod from 'zod';
import { User } from '../../models/user.model.js';
import { signToken } from '../../lib/token.js';
import { comparePassword } from '../../lib/hash.js';

const router: Router = express.Router();

export const loginSchema = zod.object({
    email: zod.email(),
    password: zod.string().min(1)
});

router.post('/login', async (req, res) => {
    try {
        const parsed = loginSchema.safeParse(req.body);
    
        if(!parsed.success) { // if inavalid object is passed.
            const formattedMessage = parsed.error.issues.map((err) => ({err: err.message, path: err.path[0]}));
            return res.json({
                status: 422,
                msg: 'Invalid authentication object.',
                err: formattedMessage
            });
        }

        const { email, password } = req.body;
        const existingUser = await User.findOne({ email: email });

        if(!existingUser) {
            return res.json({ status: 404, msg: `Invalid Email ${email} not found.`});
        }

        const isValidPassword = await comparePassword(password, existingUser.password);
        if(!isValidPassword) {
            return res.json({ status: 404, msg: `Invalid Password for ${email}.`});
        }

        const token = await signToken({id: existingUser._id, email: existingUser.email}); 

        await User.findByIdAndUpdate(existingUser._id, {loginToken: token});

        return res.json({
            status: 200,
            msg: 'Authentication Successfull.',
            loginToken: token
        });
        
    } catch(err) {
        return res.json({
            status: 500,
            msg: 'Internal Server Error.'
        })
    }
    

});

router.get('/login', (req, res) => {
    res.json({
        status: 200,
        msg: 'Login Route is active.',
        healthStatus: 'healthy'
    });
});

export default router;