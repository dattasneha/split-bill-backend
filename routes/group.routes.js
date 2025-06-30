import { Router } from "express";
import { createGroup, invite } from "../controller/groups.controller.js";
import { verifyUserJwt } from "../middleware/auth.middleware.js";
const router = Router();

router.route("/create").post(verifyUserJwt, createGroup);
router.route("/invite").post(verifyUserJwt, invite)
export default router;