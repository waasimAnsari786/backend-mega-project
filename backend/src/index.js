import connectDB from "./db/index.js";
import dotenv from "dotenv";

dotenv.config({ path: "./.env" });

connectDB();

/*
import mongoose from "mongoose";
import { DB_NAME } from "./constants";
import express from "express";

const app = express();
(async () => {
  try {
    await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`);
    app.on("error", error => {
      console.error("Database connecting error: ", error);
      throw error;
    });

    app.listen(process.env.PORT, error => {
      console.log(`App is listening on port ${process.env.PORT}`);
    });
  } catch (error) {
    console.error(error);
  }
})();
*/
