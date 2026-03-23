import mongoose from "mongoose";
const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    loginToken: { type: String },
    fullName: { type: String, required: true },
    createdAt: { type: Date, required: Date.now },
    habitTracker: { type: mongoose.Schema.Types.ObjectId, ref: 'Habits' },
    growthTracker: { type: mongoose.Schema.Types.ObjectId, ref: 'Growth' }
});
export const User = mongoose.model("users", userSchema);
//# sourceMappingURL=user.model.js.map