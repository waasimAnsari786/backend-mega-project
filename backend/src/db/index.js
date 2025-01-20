import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async () => {
  try {
    // mongoDb returned object
    const connectionRes = await mongoose.connect(
      `${process.env.MONGODB_URL}/${DB_NAME}`
    );
    // for confirming the host
    console.log(
      `Database connected successfully !! DB HOST: ${connectionRes.connection.host}`
    );
    //for exploring mongodb's returned object (just for learning)
    console.log("connection response variable", connectionRes);
  } catch (error) {
    // error caught
    console.error("Database connecting error:", error);
    process.exit(1);
  }
};

export default connectDB;
