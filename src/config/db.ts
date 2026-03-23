import mongoose from "mongoose"
import { env } from "./env.js"

export const connectDb = async() => {
    if(mongoose.connection.readyState === 0) {
        await mongoose.connect(env.DB_CONNECTION_URI!);
        console.log(`Habit Tracker Database is ACTIVE.`)
    }
}