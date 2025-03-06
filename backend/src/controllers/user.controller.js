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

export { loginUser, logoutUser, refreshAccessToken, registerUser };
