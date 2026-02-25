import mongoose, { Schema, model, models } from "mongoose";

export interface IVerificationToken {
    userId: mongoose.Types.ObjectId;
    token: string;
    expiresAt: Date;
    type: "EMAIL_VERIFICATION" | "PASSWORD_RESET";
}

const VerificationTokenSchema = new Schema<IVerificationToken>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        token: {
            type: String,
            required: true,
        },
        expiresAt: {
            type: Date,
            required: true,
            expires: 600, // MongoDB will automatically delete the document after 10 minutes (600 seconds)
        },
        type: {
            type: String,
            enum: ["EMAIL_VERIFICATION", "PASSWORD_RESET"],
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

// Compound index for faster searches
VerificationTokenSchema.index({ userId: 1, type: 1 });

const VerificationToken = models.VerificationToken || model("VerificationToken", VerificationTokenSchema);

export default VerificationToken;
