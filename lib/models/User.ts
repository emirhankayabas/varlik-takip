import mongoose, { Schema, model, models } from "mongoose";

export interface IUser {
    _id: string;
    email: string;
    password: string;
    name?: string;
    cryptoWatchlist?: { id: string; symbol: string; name: string; image: string }[];
    emailVerified: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
    {
        email: {
            type: String,
            required: [true, "E-posta adresi zorunludur."],
            unique: true,
            lowercase: true,
            trim: true,
        },
        password: {
            type: String,
            required: [true, "Şifre zorunludur."],
        },
        name: {
            type: String,
            trim: true,
        },
        cryptoWatchlist: {
            type: [{
                id: String,
                symbol: String,
                name: String,
                image: String
            }],
            default: [
                { id: "bitcoin", symbol: "BTC", name: "Bitcoin", image: "https://assets.coingecko.com/coins/images/1/small/bitcoin.png" },
                { id: "ethereum", symbol: "ETH", name: "Ethereum", image: "https://assets.coingecko.com/coins/images/279/small/ethereum.png" },
                { id: "solana", symbol: "SOL", name: "Solana", image: "https://assets.coingecko.com/coins/images/4128/small/solana.png" },
                { id: "ripple", symbol: "XRP", name: "Ripple", image: "https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png" },
                { id: "dogecoin", symbol: "DOGE", name: "Dogecoin", image: "https://assets.coingecko.com/coins/images/5/small/dogecoin.png" },
            ],
        },
        emailVerified: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

const User = models.User || model("User", UserSchema);

export default User;
