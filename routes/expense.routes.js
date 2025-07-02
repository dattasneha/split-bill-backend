import { Router } from "express";
import { verifyUserJwt } from "../middleware/auth.middleware.js";
import { addExpense, expenseStatus, getAllExpenses } from "../controller/expense.controller.js";

const router = Router();

router.route("/:groupId/create").post(verifyUserJwt, addExpense);
router.route("/:groupId/expenses").get(verifyUserJwt, getAllExpenses);
router.route("/:expenseId/status").post(verifyUserJwt, expenseStatus);
export default router;