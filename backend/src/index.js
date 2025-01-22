//first appraoch to connect database
import app from "./app.js";
import connectDB from "./db/index.js";
import dotenv from "dotenv";

dotenv.config({ path: "./.env" });

const port = process.env.PORT || 8000;

connectDB()
  .then(() => {
    //app listned if database will have connected succesfully
    app.listen(port, () => {
      console.log(`App is listening on port ${port}`);
    });
  })
  //   caught error if database won't have connected
  .catch((err) => console.error("Database caonnection failed error: ", err));

//second appraoch to connect database

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
