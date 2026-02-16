import mongoose, { Schema, Document } from "mongoose";

export interface IPriceCache extends Document {
    symbol: string;
    price: number;
    currency: string;
    previousClose: number;
    change: number;
    changePercent: number;
    createdAt: Date;
}

const PriceCacheSchema = new Schema<IPriceCache>({
    symbol: { type: String, required: true, index: true },
    price: { type: Number, required: true },
    currency: { type: String, required: true },
    previousClose: { type: Number, required: true },
    change: { type: Number, required: true },
    changePercent: { type: Number, required: true },
    createdAt: { type: Date, default: Date.now, expires: 300 } // 300 saniye = 5 dakika sonra otomatik silinir (TTL)
});

// Sembole göre aramayı hızlandırmak için unique index
PriceCacheSchema.index({ symbol: 1 }, { unique: true });

export default mongoose.models.PriceCache || mongoose.model<IPriceCache>("PriceCache", PriceCacheSchema);
