import { Goals } from "../../models/goals.model.js"

export const existingGoal = async(name: string) => {
    const existing  = await Goals.findOne({ name: name });
    if(existing) {
        return {
            status: true,
            msg: 'Existing goal present, try a new name or remove existing goal.'
        }
    }

    return {
        status: false,
        msg: 'No existing goal present, you can continue to create new.'
    }
}

export const createGoal = async (name: string, description: string, purpose: string, dateOfCompletion: Date, reward: string) => {
    const newGoal = await Goals.create({ name: name, description: description, purpose: purpose, dateOfCompletion: dateOfCompletion, reward: reward });
    if(newGoal) {
        return {
            success: true,
            data: {
                msg: `Goal has been created successfully`,
                id: newGoal._id,
                name: newGoal.name,
                description: newGoal.description,
                dateOfCompletion: newGoal.dateOfCompletion,
                reward: newGoal.reward
            }
        }
    }
    return {
        success: false,
        data: {
            msg: `Failed to create a Goal`,
            name: name,
            description: description
        }
    }
}