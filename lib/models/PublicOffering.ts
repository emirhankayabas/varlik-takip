import mongoose, { Schema, model, models } from "mongoose";

export interface IPublicOffering {
    _id: string;
    userId: mongoose.Types.ObjectId;
    symbol: string;
    requestedAmount: number;
    allocatedAmount?: number;
    price: number;
    requestDate: Date;
    listingDate?: Date;
    bankId: mongoose.Types.ObjectId;
    status: "PENDING" | "ALLOCATED" | "PORTFOLIO";
    createdAt: Date;
    updatedAt: Date;
}

const PublicOfferingSchema = new Schema<IPublicOffering>(
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
        requestedAmount: {
            type: Number,
            required: [true, "Talep edilen adet zorunludur."],
            min: [1, "Adet en az 1 olmalıdır."],
        },
        allocatedAmount: {
            type: Number,
            min: [0, "Dağıtılan adet negatif olamaz."],
        },
        price: {
            type: Number,
            required: [true, "Halka arz fiyatı zorunludur."],
            min: [0, "Fiyat negatif olamaz."],
        },
        requestDate: {
            type: Date,
            default: Date.now,
        },
        listingDate: {
            type: Date,
        },
        bankId: {
            type: Schema.Types.ObjectId,
            ref: "Bank",
            required: [true, "Banka seçimi zorunludur."],
        },
        status: {
            type: String,
            enum: ["PENDING", "ALLOCATED", "PORTFOLIO"],
            default: "PENDING",
        },
    },
    {
        timestamps: true,
    }
);

const PublicOffering = models.PublicOffering || model<IPublicOffering>("PublicOffering", PublicOfferingSchema);

export default PublicOffering;
