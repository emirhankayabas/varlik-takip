import mongoose, { Schema, model, models } from "mongoose";

export interface IBank {
    _id: string;
    userId: mongoose.Types.ObjectId;
    name: string;
    createdAt: Date;
    updatedAt: Date;
}

const BankSchema = new Schema<IBank>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        name: {
            type: String,
            required: [true, "Banka/Hesap adı zorunludur."],
            trim: true,
        },
    },
    {
        timestamps: true,
    }
);

const Bank = models.Bank || model("Bank", BankSchema);

export default Bank;
