import express, { Router } from 'express';
import zod from 'zod';
import { zodValidation } from '../../lib/zod.js';
import { existingGoal } from '../../services/goals/goals.service.js';

const router: Router = express.Router();

const createGoalObject = zod.object({
    name: zod.string(),
    description: zod.string(),
    purpose: zod.string(),
    dateOfCompletion: zod.date(),
    reward: zod.string(),
});

// to create a goal
router.post('/goals', async (req, res) => {    
    
    const parsingValidation = await zodValidation(createGoalObject, req.body);
    if(parsingValidation.success === false) {
        return res.json({
            status: 422,
            msg: parsingValidation.msg,
            err: parsingValidation.err
        });
    }

    const { name, description, purpose, dateOfCompletion, reward } = req.body;

    const existing = await existingGoal(name);
    if(existing.status === true) {
        res.json({
            status: 409,
            msg: existing.msg
        });
    }

    
});

// to update a goal
router.patch('/goals/:id', async (req, res) => {

});

// to delete a goal
router.delete('/goals/:id', async (req, res) => {

});

// to see a goal overview
router.get('/goals/:id', async (req, res) => {

});

export default router;