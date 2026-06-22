/* eslint-disable @typescript-eslint/no-explicit-any */
import dns from "dns";
import mongoose from "mongoose";

dns.setServers(["8.8.8.8", "1.1.1.1"]);

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_URI_DIRECT = process.env.MONGODB_URI_DIRECT;
if (!MONGODB_URI && !MONGODB_URI_DIRECT) {
    throw new Error("Please define MONGODB_URI or MONGODB_URI_DIRECT environment variable");
}

declare global {
    var mongoose: {
        conn: mongoose.Connection | null;
        promise: Promise<mongoose.Mongoose> | null;
    } | undefined;
}

const cached = (global as any).mongoose || { conn: null, promise: null };
export async function connectDB() {
    if (cached.conn) {
        return cached.conn;
    }
    if (!cached.promise) {
        const primaryUri = MONGODB_URI || MONGODB_URI_DIRECT!;
        cached.promise = mongoose
            .connect(primaryUri, {
                connectTimeoutMS: 10000,
                serverSelectionTimeoutMS: 10000,
                appName: "ukt-app",
                autoIndex: false,
            })
            .catch(async (initialError) => {
                if (primaryUri !== MONGODB_URI_DIRECT && MONGODB_URI_DIRECT) {
                    console.warn("Primary MongoDB connection failed, retrying with direct URI fallback.");
                    return mongoose.connect(MONGODB_URI_DIRECT, {
                        connectTimeoutMS: 10000,
                        serverSelectionTimeoutMS: 10000,
                        appName: "ukt-app",
                        autoIndex: false,
                    });
                }
                cached.promise = null;
                throw initialError;
            })
            .then((mongooseClient) => {
                cached.conn = mongooseClient.connection;
                return mongooseClient;
            })
            .catch((error) => {
                cached.promise = null;
                throw error;
            });
    }
    const mongooseClient = await cached.promise;
    cached.conn = mongooseClient.connection;
    (global as any).mongoose = cached;
    return cached.conn;
}