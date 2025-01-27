import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import User from "../models/user.model.js";
import uploadOnCloudinary from "../utils/cloudinary.js";
import ApiResponse from "../utils/ApiResponse.js";

const registerUser = asyncHandler(async (req, res) => {
  // destructure email, password and name
  const { userName, email, fullName, password } = req.body;
  console.log("email:", email);
  console.log("password:", password);

  console.log("Data of req.body: ", req.body);

  // validation for checking are all fields realted to user's name,email,password present?
  if (
    [userName, email, fullName, password].some((field) => field?.trim() === "")
  ) {
    // ApiError is a calss for throwing errors to frontend in a structured way
    throw new ApiError(400, "All fields are required!");
  }

  // variable for getting is current user already register in my DB?
  const existedUser = User.findOne({ $or: [{ userName }, { email }] });
  console.log("existedUser in mongoDB:", existedUser);

  // throw error if user already exists
  if (existedUser) {
    throw new ApiError(409, "User with email or name already exists");
  }

  // var for getting avatar's local path
  const avatarLocalPath = req.files?.avatar[0]?.path;
  // var for getting cover image's local path
  const coverImageLocalPath = req.files?.coverImage[0]?.path;
  console.log("data returned by multer:", req.files);

  // throw error if avatar isn't passed by user becuse it's required in my DB
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required");
  }

  // var for getting avatar's cloudinary path
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  // var for getting cover image's cloudinary path
  const coverImage = await uploadOnCloudinary(avatarLocalPath);
  console.log("avatar file data returned by cloudinary:", avatar);

  // if (!avatar) {
  //   throw new ApiError(400, "Avatar file is required");
  // }

  // creeating user object for entering user into DB
  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    userName: userName.toLowerCase(),
  });
  console.log("created user in mogodb:", user);

  // again find user by the document id (given by DB) for removing password and refresh token from final data for sending it as a response
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  console.log(
    "created user after removing passoword and refresh token:",
    createdUser
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

export default registerUser;
