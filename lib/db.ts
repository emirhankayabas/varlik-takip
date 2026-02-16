import mongoose from "mongoose";
import "@/lib/models/User";
import "@/lib/models/Bank";
import "@/lib/models/Asset";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("Lütfen .env.local içinde MONGODB_URI tanımlayın.");
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongoose: MongooseCache | undefined;
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  if (cached!.conn) {
    return cached!.conn;
  }

  if (!cached!.promise) {
    const opts = {
      bufferCommands: false,
    };

    console.log("MongoDB connecting...");
    cached!.promise = mongoose.connect(MONGODB_URI!, opts).then((mongoose) => {
      console.log("MongoDB connected successfully");
      return mongoose;
    });
  }

  try {
    cached!.conn = await cached!.promise;
  } catch (e) {
    console.error("MongoDB connection error:", e);
    cached!.promise = null;
    throw e;
  }

  return cached!.conn;
}

export default dbConnect;
