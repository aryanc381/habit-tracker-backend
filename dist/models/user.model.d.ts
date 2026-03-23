import mongoose from "mongoose";
export declare const User: mongoose.Model<{
    email: string;
    password: string;
    fullName: string;
    loginToken?: string | null;
    createdAt?: NativeDate | null;
    habitTracker?: mongoose.Types.ObjectId | null;
    growthTracker?: mongoose.Types.ObjectId | null;
}, {}, {}, {
    id: string;
}, mongoose.Document<unknown, {}, {
    email: string;
    password: string;
    fullName: string;
    loginToken?: string | null;
    createdAt?: NativeDate | null;
    habitTracker?: mongoose.Types.ObjectId | null;
    growthTracker?: mongoose.Types.ObjectId | null;
}, {
    id: string;
}, mongoose.DefaultSchemaOptions> & Omit<{
    email: string;
    password: string;
    fullName: string;
    loginToken?: string | null;
    createdAt?: NativeDate | null;
    habitTracker?: mongoose.Types.ObjectId | null;
    growthTracker?: mongoose.Types.ObjectId | null;
} & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any, any>, {}, {}, {}, {}, mongoose.DefaultSchemaOptions, {
    email: string;
    password: string;
    fullName: string;
    loginToken?: string | null;
    createdAt?: NativeDate | null;
    habitTracker?: mongoose.Types.ObjectId | null;
    growthTracker?: mongoose.Types.ObjectId | null;
}, mongoose.Document<unknown, {}, {
    email: string;
    password: string;
    fullName: string;
    loginToken?: string | null;
    createdAt?: NativeDate | null;
    habitTracker?: mongoose.Types.ObjectId | null;
    growthTracker?: mongoose.Types.ObjectId | null;
}, {
    id: string;
}, mongoose.DefaultSchemaOptions> & Omit<{
    email: string;
    password: string;
    fullName: string;
    loginToken?: string | null;
    createdAt?: NativeDate | null;
    habitTracker?: mongoose.Types.ObjectId | null;
    growthTracker?: mongoose.Types.ObjectId | null;
} & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, unknown, {
    email: string;
    password: string;
    fullName: string;
    loginToken?: string | null;
    createdAt?: NativeDate | null;
    habitTracker?: mongoose.Types.ObjectId | null;
    growthTracker?: mongoose.Types.ObjectId | null;
} & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>, {
    email: string;
    password: string;
    fullName: string;
    loginToken?: string | null;
    createdAt?: NativeDate | null;
    habitTracker?: mongoose.Types.ObjectId | null;
    growthTracker?: mongoose.Types.ObjectId | null;
} & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>;
//# sourceMappingURL=user.model.d.ts.map