import { Router } from "express";
import { verifyUserJwt } from "../middleware/auth.middleware.js";
import { addExpense } from "../controller/expense.controller.js";

const router = Router();

router.route("/:groupId/create").post(verifyUserJwt, addExpense);

export default router;