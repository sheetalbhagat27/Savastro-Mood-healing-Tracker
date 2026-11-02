import mongoose from 'mongoose';

let isConnected = false;

/**
 * Connect to MongoDB Atlas using Mongoose.
 * Enforces MONGO_URI in production and provides diagnostics in development.
 */
export const connectDatabase = async () => {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    if (process.env.NODE_ENV === 'production') {
      console.error('FATAL: MONGO_URI environment variable is missing in production.');
      throw new Error('MONGO_URI is required in production environment.');
    } else {
      console.warn(
        '[Database Warning] MONGO_URI is not set in backend/.env. Backend will run in offline/memory mode. Set MONGO_URI to connect to MongoDB Atlas.'
      );
      return false;
    }
  }

  try {
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });

    isConnected = true;
    console.log(`[MongoDB] Connected successfully to host: ${conn.connection.host} (DB: ${conn.connection.name})`);

    mongoose.connection.on('error', (err) => {
      console.error('[MongoDB] Connection error:', err.message);
      isConnected = false;
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('[MongoDB] Disconnected from database.');
      isConnected = false;
    });

    mongoose.connection.on('reconnected', () => {
      console.log('[MongoDB] Reconnected to database.');
      isConnected = true;
    });

    return true;
  } catch (error) {
    isConnected = false;
    console.error('[MongoDB] Failed to connect to database:', error.message);
    if (process.env.NODE_ENV === 'production') {
      throw error;
    }
    return false;
  }
};

export const getDbStatus = () => ({
  connected: isConnected || mongoose.connection.readyState === 1,
  readyState: mongoose.connection.readyState,
  host: mongoose.connection.host || null,
  name: mongoose.connection.name || null
});

export default connectDatabase;
