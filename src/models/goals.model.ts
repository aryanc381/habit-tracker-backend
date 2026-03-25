import mongoose from "mongoose";

const goalSchema = new mongoose.Schema({
    name: { type: String, required: true, default: null },
    description: { type: String, required: true, default: null }, // this is the description of the goal
    purpose: { type: String, required: true, default: null }, // why was this goal chosen
    dateOfCompletion: { type: Date, required: Date.now },
    reward: { type: String, default: null },
    goalAchieved: { type: Boolean, default: null },
    dos: { type: Number, default: null }, // dos - days of success
    dof: { type: Number, default: null }, // dof - days of failure
    totalDays: { type: Number, default: null },
    subgoals: { type: [mongoose.Schema.Types.ObjectId], default: null, ref: 'subgoals' }
});

export const Goals = mongoose.model("goals", goalSchema);