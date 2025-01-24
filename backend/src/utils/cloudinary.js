import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_KEY, // Click 'View API Keys' above to copy your API secret
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;
    // else upload on cloudinary
    const uploadResult = await cloudinary.uploader.upload(localFilePath, {
      public_id: "shoes",
      resource_type: "auto",
    });
    //   file has been uploaded succcessfully
    console.log("file has been uploaded succcessfully");
    console.log(uploadResult);
    return uploadResult;
  } catch (error) {
    fs.unlink(localFilePath); //removes the corrupted file which couldn't upload due to function failed
    return null;
  }
};

export { uploadOnCloudinary };
