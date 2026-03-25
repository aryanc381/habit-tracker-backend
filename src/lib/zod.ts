import zod from 'zod';

export const zodValidation = async(schema: zod.ZodObject<any>, payload: object) => {
    const parsed = schema.safeParse(payload);
    if(!parsed.success) {
        const formattedMessage = parsed.error.issues.map((err) => ({ path: err.path[0], msg: err.message }));
        return {
            success: false,
            msg: `Invalid Object Passed.`,
            err: formattedMessage
        }
    }
    return {
        success: true,
        data: parsed.data
    }
}