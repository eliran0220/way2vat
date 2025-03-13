import mongoose from "mongoose";

const connectDB = async () => {
  try {
    console.log(process.env.MONGO_URI_V1);
    await mongoose.connect(process.env.MONGO_URI_V1);

    console.log("Connected to MongoDB successfully!");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    process.exit(1);
  }
};

export default connectDB;
