import express, { Router } from 'express';
import loginRouter from './auth/login.auth.route.js';
import signupRouter from './auth/signup.auth.route.js';

const router: Router = express.Router();

router.use('/auth', loginRouter, signupRouter);

export default router;