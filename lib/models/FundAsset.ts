import mongoose, { Schema, model, models } from "mongoose";

export interface IFundAsset {
    _id: string;
    userId: mongoose.Types.ObjectId;
    symbol: string;
    amount: number;
    buyPrice: number;
    buyDate: Date;
    bankId: mongoose.Types.ObjectId;
    type: "BUY" | "SELL";
    realizedProfit?: number;
    costBasis?: number;
    createdAt: Date;
    updatedAt: Date;
}

const FundAssetSchema = new Schema<IFundAsset>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        symbol: {
            type: String,
            required: [true, "Fon kodu zorunludur."],
            uppercase: true,
            trim: true,
        },
        amount: {
            type: Number,
            required: [true, "Adet zorunludur."],
            min: [0, "Adet negatif olamaz."],
        },
        buyPrice: {
            type: Number,
            required: [true, "Fiyat zorunludur."],
            min: [0, "Fiyat negatif olamaz."],
        },
        buyDate: {
            type: Date,
            default: Date.now,
        },
        bankId: {
            type: Schema.Types.ObjectId,
            ref: "Bank",
            required: [true, "Banka seçimi zorunludur."],
        },
        type: {
            type: String,
            enum: ["BUY", "SELL"],
            default: "BUY",
        },
        realizedProfit: {
            type: Number,
            default: 0,
        },
        costBasis: {
            type: Number,
            default: 0,
        },
    },
    {
        timestamps: true,
    }
);

const FundAsset = models.FundAsset || model<IFundAsset>("FundAsset", FundAssetSchema);

export default FundAsset;
