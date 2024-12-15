import mongoose, { Connection } from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

export const connectDB = async (url: string): Promise<Connection> => {
  try {
    const mongooseInstance = await mongoose.connect(url || '', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    } as mongoose.ConnectOptions);

    if (!mongooseInstance.connection) {
      throw new Error('Failed to establish MongoDB connection');
    }
    

    
    console.log('Connected to MongoDB');

    // Initialize mongoose-auto-increment after the connection is established
    //autoIncrement.initialize(mongooseInstance.connection);

    return mongooseInstance.connection;
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    throw error;
  }
};

