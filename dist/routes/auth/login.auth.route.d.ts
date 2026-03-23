import { Router } from 'express';
import zod from 'zod';
declare const router: Router;
export declare const loginSchema: zod.ZodObject<{
    email: zod.ZodEmail;
    password: zod.ZodString;
}, zod.z.core.$strip>;
export default router;
//# sourceMappingURL=login.auth.route.d.ts.map