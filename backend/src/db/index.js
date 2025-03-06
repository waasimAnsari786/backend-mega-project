import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";
import app from "../app.js";

const connectDB = async () => {
  try {
    // mongoDb returned object
    const connectionRes = await mongoose.connect(
      `${process.env.MONGODB_URL}/${DB_NAME}`
    );

    // check is there any error
    app.on("error", (error) => {
      throw error;
    });

    // for confirming the host
    console.log(
      `Database connected successfully !! DB HOST: ${connectionRes.connection.host}`
    );
  } catch (error) {
    // error caught
    console.error("Database connection error:", error);
    //process exit
    process.exit(1);
  }
};

export default connectDB;
