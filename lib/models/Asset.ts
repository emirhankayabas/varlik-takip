import mongoose, { Schema, model, models } from "mongoose";

export interface IAsset {
    _id: string;
    userId: mongoose.Types.ObjectId;
    symbol: string;
    amount: number;
    buyPrice: number; // For BUY: purchase price, For SELL: sale price
    buyDate: Date;  // For BUY: purchase date, For SELL: sale date
    bankId: mongoose.Types.ObjectId;
    type: "BUY" | "SELL";
    realizedProfit?: number; // Calculated only for SELL transactions
    costBasis?: number;      // The average cost at the time of sale (for SELL only)
    createdAt: Date;
    updatedAt: Date;
}

const AssetSchema = new Schema<IAsset>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        symbol: {
            type: String,
            required: [true, "Hisse sembolü zorunludur."],
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
            required: [true, "Fiyat zorunludur."], // Renamed context-wise
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

if (models.Asset) {
    delete (mongoose as any).models.Asset;
}

const Asset = model<IAsset>("Asset", AssetSchema);

export default Asset;
