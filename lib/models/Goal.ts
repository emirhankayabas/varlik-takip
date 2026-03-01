import mongoose, { Schema, model, models } from "mongoose";

export interface IGoal {
    _id: string;
    userId: string;
    title: string;
    targetAmount: number;
    currentAmount?: number;
    targetDate?: Date;
    status: "active" | "achieved";
    includedAssetTypes: string[];
    createdAt: Date;
    updatedAt: Date;
}

const GoalSchema = new Schema<IGoal>(
    {
        userId: {
            type: String,
            required: true,
            index: true,
        },
        title: {
            type: String,
            required: [true, "Hedef başlığı zorunludur."],
            trim: true,
        },
        targetAmount: {
            type: Number,
            required: [true, "Hedef tutarı zorunludur."],
            min: [1, "Hedef tutarı 0'dan büyük olmalıdır."],
        },
        currentAmount: {
            type: Number,
            default: 0,
        },
        targetDate: {
            type: Date,
        },
        status: {
            type: String,
            enum: ["active", "achieved"],
            default: "active",
        },
        includedAssetTypes: {
            type: [String],
            default: ["BIST", "US", "FUND"],
        },
    },
    {
        timestamps: true,
    }
);

const Goal = models.Goal || model("Goal", GoalSchema);

export default Goal;
