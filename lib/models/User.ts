import mongoose, { Schema, model, models } from "mongoose";

export interface IUser {
    _id: string;
    email: string;
    password: string;
    name?: string;
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
    },
    {
        timestamps: true,
    }
);

const User = models.User || model("User", UserSchema);

export default User;
