import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import User from "../models/user.model.js";
import uploadOnCloudinary from "../utils/cloudinary.js";
import ApiResponse from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import { options } from "../constants.js";

const registerUser = asyncHandler(async (req, res) => {
  // destructure email, password and name
  const { userName, email, fullName, password } = req.body;

  // validation for checking are all fields related to user's name,email,password present?
  if (
    [userName, email, fullName, password].some((field) => field?.trim() === "")
  ) {
    // ApiError is a calss for throwing errors to frontend in a structured way
    throw new ApiError(400, "All fields are required!");
  }

  // variable for getting is current user already register in my DB?
  const existedUser = await User.findOne({ $or: [{ userName }, { email }] });

  // throw error if user already exists
  if (existedUser) {
    throw new ApiError(409, "User with email or name already exists");
  }

  // var for getting avatar's local path
  const avatarLocalPath = req.files?.avatar[0]?.path;
  // var for getting cover image's local path
  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  // throw error if avatar isn't passed by user becuse it's required in my DB
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required");
  }

  // var for getting avatar's cloudinary path
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  // var for getting cover image's cloudinary path
  const coverImage = coverImageLocalPath
    ? await uploadOnCloudinary(coverImageLocalPath)
    : null;

  // creeating user object for entering user into DB
  const user = await User.create({
    fullName,
    avatar: avatar.secure_url,
    coverImage: coverImage?.secure_url || "",
    email,
    password,
    userName: userName.toLowerCase(),
  });

  // again find user by the document id (given by DB) for removing password and refresh token from final data for sending it as a response
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  // throw error if user won't create
  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }

  // return final response
  return (
    res
      .status(201)
      // Apiresponse is a class for sending response to frontend in a structured way
      .json(new ApiResponse(200, createdUser, "User registered succesfully"))
  );
});

const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessTokenSecret();
    const refreshToken = user.generateRefreshTokenSecret();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { refreshToken, accessToken };
  } catch (error) {
    console.error(error.message);
    throw new ApiError(
      500,
      "Something went wrong while generating access or refresh token"
    );
  }
};

const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email) {
    throw new ApiError(400, "Email or password is required");
  }

  const user = await User.findOne({ email });

  if (!user) {
    throw new ApiError(404, "User doesn't exist");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credintials");
  }

  const { refreshToken, accessToken } = await generateAccessAndRefreshTokens(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(new ApiResponse(200, loggedInUser, "User logged in successfully"));
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    { $set: { refreshToken: undefined } },
    { new: true }
  );

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out successfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  try {
    const incomingRefreshToken =
      req.cookie.refreshToken || req.body.refreshToken;

    if (!incomingRefreshToken) {
      throw new ApiError(401, "Unauthorized request");
    }

    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken._id);

    if (!user) {
      throw new ApiError(401, "Invalid refresh token");
    }

    if (incomingRefreshToken !== user.refreshToken) {
      throw new ApiError(401, "Refresh token is expired or used");
    }

    const { accessToken, refreshToken: newRefreshToken } =
      generateAccessAndRefreshTokens(user._id);

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "Access token refreshed successfully"
        )
      );
  } catch (error) {
    throw new ApiError(401, error.message || "Invalid refresh token");
  }
});

const updateCurrentPassword = asyncHandler(async (req, res) => {
  // extract old, new and confirm password fields from req
  // match confirm and new passwords are same. if not throw an error
  // get user form DB for updating password
  // check is old password correct?
  // update password and save the new one
  // return response
  const { oldPassword, newPassword, confirmPassword } = req.body;
  if (newPassword !== confirmPassword) {
    throw new ApiError(401, "New and confirm password must be same");
  }

  const user = await User.findById(req.user?._id);

  if (!user) {
    throw new ApiError(401, "User doesn't exist");
  }

  const isOldPwdCorrect = user.isPasswordCorrect(oldPassword);

  if (!isOldPwdCorrect) {
    throw new ApiError(400, "Old password is incorrect");
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(201)
    .json(new ApiResponse(201, {}, "Password updated successfully"));
});

const getLoggedInUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "Current user fetched successfully"));
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  //get account details from req.body
  //check check that is any field empty? if It is throw error
  // get user from DB
  // update account details and save the user
  // return updated account details in response

  const { fullName, email } = req.body;

  if (!fullName || !email) {
    throw new ApiError(401, "All fields are required");
  }

  const updatedUser = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: { fullName, email },
    },
    { new: true }
  ).select("-password -refreshToken");

  return res
    .status(200)
    .json(
      new ApiResponse(200, updatedUser, "Account details updated successfully")
    );
});

const updateAvatar = asyncHandler(async (req, res) => {
  // get avatar file from req.file and also check that avatar field is not empty
  // upload new file on cloudinary
  // get user from DB and update avatar in geted user
  // return response

  const avatarLocalPath = req.file?.path;
  if (!avatarLocalPath) {
    throw new ApiError(401, "Avatar is required");
  }

  const newAvatar = await uploadOnCloudinary(avatarLocalPath);
  if (!newAvatar) {
    throw new ApiError(500, "Error while uploading avatar on cloudinary");
  }
  const updatedUser = await User.findByIdAndUpdate(
    req.user._id,
    { $set: { avatar: newAvatar.secure_url } },
    { new: true }
  ).select("-password -refreshToken");

  return res
    .status(200)
    .json(new ApiResponse(200, updatedUser, "Avatar updated successfully"));
});

const updateCoverImage = asyncHandler(async (req, res) => {
  // get avatar file from req.file and also check that avatar field is not empty
  // upload new file on cloudinary
  // get user from DB and update avatar in geted user
  // return response

  const coverImageLocalPath = req.file?.path;
  if (!coverImageLocalPath) {
    throw new ApiError(401, "Cover image is required");
  }

  const newCoverImage = await uploadOnCloudinary(coverImageLocalPath);
  if (!newCoverImage) {
    throw new ApiError(500, "Error while uploading cover image on cloudinary");
  }
  const updatedUser = await User.findByIdAndUpdate(
    req.user._id,
    { $set: { coverImage: newCoverImage.secure_url } },
    { new: true }
  ).select("-password -refreshToken");

  return res
    .status(200)
    .json(
      new ApiResponse(200, updatedUser, "Cover image updated successfully")
    );
});

export {
  loginUser,
  logoutUser,
  refreshAccessToken,
  registerUser,
  updateCurrentPassword,
  getLoggedInUser,
  updateAccountDetails,
  updateAvatar,
  updateCoverImage,
};
