import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

import dotenv from "dotenv";
dotenv.config();

cloudinary.config({
  secure: true,
  cloud_name: String(process.env.CLOUDINARY_CLOUD_NAME),
  api_key: String(process.env.CLOUDINARY_API_KEY),
  api_secret: String(process.env.CLOUDINARY_API_SECRET),
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) {
      throw new Error("File path is missing or invalid.");
    }

    const uploadResult = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });

    return uploadResult;
  } catch (error) {
    console.error("Error uploading file to Cloudinary:", error.message);
    throw new Error("Failed to upload file to Cloudinary.");
  } finally {
    // Remove the file from the local system after upload attempt
    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    }
  }
};

export default uploadOnCloudinary;
