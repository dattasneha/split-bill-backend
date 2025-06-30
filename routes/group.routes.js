import { Router } from "express";
import { createGroup, invite, joinGroup } from "../controller/groups.controller.js";
import { verifyUserJwt } from "../middleware/auth.middleware.js";
const router = Router();

router.route("/create").post(verifyUserJwt, createGroup);
router.route("/invite").post(verifyUserJwt, invite);
router.route("/join").post(verifyUserJwt, joinGroup);
export default router;