import mongoose from "mongoose";

/**
 * Global Mongoose cache interface to prevent multiple connections
 * across hot reloads in development and warm serverless invocations in production.
 */
interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongooseCache ?? {
  conn: null,
  promise: null,
};

if (!global.mongooseCache) {
  global.mongooseCache = cached;
}

/**
 * Checks whether a valid MONGODB_URI environment variable is configured.
 * Allows graceful fallback to clearly labeled demonstration content during
 * zero-config local evaluation without crashing the application.
 */
export function isDatabaseConfigured(): boolean {
  const uri = process.env.MONGODB_URI?.trim();
  return Boolean(
    uri &&
      (uri.startsWith("mongodb://") || uri.startsWith("mongodb+srv://")) &&
      !uri.includes("your_mongodb_connection_string")
  );
}

/**
 * Connects to MongoDB Atlas using a cached Mongoose connection.
 * Server-only: Never import this module into Client Components.
 */
export async function connectToDatabase(): Promise<typeof mongoose> {
  const MONGODB_URI = process.env.MONGODB_URI?.trim();

  if (!MONGODB_URI || !isDatabaseConfigured()) {
    throw new Error(
      "MONGODB_URI is not configured or invalid. Set a valid MongoDB Atlas connection string in .env.local or production environment variables."
    );
  }

  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts: mongoose.ConnectOptions = {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 8000,
      socketTimeoutMS: 45000,
    };

    cached.promise = mongoose
      .connect(MONGODB_URI, opts)
      .then((mongooseInstance) => {
        return mongooseInstance;
      })
      .catch((error) => {
        cached.promise = null;
        const safeMessage =
          error instanceof Error ? error.message : "Unknown connection error";
        // Log error class without leaking credentials
        console.error(
          "[MongoDB Connection Error]: Failed to connect to cluster.",
          safeMessage.replace(/mongodb(\+srv)?:\/\/[^@]+@/gi, "mongodb$1://***:***@")
        );
        throw new Error(
          "Unable to establish a database connection. Please verify MongoDB Atlas network access and credentials."
        );
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (err) {
    cached.promise = null;
    throw err;
  }

  return cached.conn;
}

export default connectToDatabase;
