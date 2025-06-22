import { Router } from "express";
import { login, logout, register, refreshAccessToken } from "../controller/auth.controller.js";
import { verifyUserJwt } from "../middleware/auth.middleware.js";
const router = Router();

router.route("/login").post(login);
router.route("/register").post(register);
router.route("/logout").post(verifyUserJwt, logout);
router.route("/refresh-token").post(refreshAccessToken);
export default router;

