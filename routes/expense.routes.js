import { Router } from "express";
import { verifyUserJwt } from "../middleware/auth.middleware.js";
import { addExpense, getAllExpenses } from "../controller/expense.controller.js";

const router = Router();

router.route("/:groupId/create").post(verifyUserJwt, addExpense);
router.route("/:groupId/expenses").get(verifyUserJwt, getAllExpenses);
export default router;