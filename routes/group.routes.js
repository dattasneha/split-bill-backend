import { Router } from "express";
import { createGroup, deleteGroup, invite, joinGroup, reject, removeMember } from "../controller/groups.controller.js";
import { verifyUserJwt } from "../middleware/auth.middleware.js";
const router = Router();

// Create a new group
router.route("/create").post(verifyUserJwt, createGroup);

// Invite user to group
router.route("/:groupId/invite").post(verifyUserJwt, invite);

// Join group (accept invitation)
router.route("/:groupId/join").put(verifyUserJwt, joinGroup);

// Reject invitation or leave group 
router.route("/:groupId/reject").delete(verifyUserJwt, reject);

// Remove member (by owner)
router.route("/:groupId/remove/:userId").delete(verifyUserJwt, removeMember);

// Delete group (by owner)
router.route("/:groupId/delete").delete(verifyUserJwt, deleteGroup);
export default router;