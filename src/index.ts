import express, { type NextFunction } from 'express';
import { env } from './config/env.js';
import rootRouter from './routes/index.js';
import { connectDb } from './config/db.js';

const app = express();

app.use(express.json());
app.use('/v1/api', rootRouter);

// app.use((err: any, req: express.Request, res: express.Response, next: NextFunction) => {
//     if(err.type === 'entity.parsed.failed') {
//         return res.status(400).json({ msg: 'Invalid JSON.' });
//     }
//     return res.status(500).json({ msg: 'Internal Server Error.' })
// })
await connectDb();
app.listen(env.PORT, () => { console.log(`Habit Tracker Backend is listening at PORT ${env.PORT}`)});