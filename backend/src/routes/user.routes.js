import Routes from "express";
import {
  loginUser,
  logoutUser,
  registerUser,
  refreshAccessToken,
  updateCurrentPassword,
  getLoggedInUser,
  updateAccountDetails,
  updateAvatar,
  updateCoverImage,
  getUserChannelDetails,
} from "../controllers/user.controller.js";
import upload from "../middlewares/multer.middleware.js";
import verifyJWT from "../middlewares/auth.middleware.js";

const router = Routes();
router.route("/register").post(
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "coverImage", maxCount: 1 },
  ]),
  registerUser
);

router.route("/login").post(loginUser);
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/refresh-token").post(refreshAccessToken);
router.route("/update-password").patch(verifyJWT, updateCurrentPassword);
router.route("/get-current-user").get(verifyJWT, getLoggedInUser);
router.route("/update-account-details").patch(verifyJWT, updateAccountDetails);
router.route("/update-avatar").patch(verifyJWT, updateAvatar);
router.route("/update-cover-image").patch(verifyJWT, updateCoverImage);
router
  .route("/get-channel-details/:userName")
  .get(verifyJWT, getUserChannelDetails);

export default router;
