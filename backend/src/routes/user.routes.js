import Routes from "express";
import registerUser from "../controllers/user.controller.js";

const router = Routes();
router.route("/register").post(registerUser);

export default router;
