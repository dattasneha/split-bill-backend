import { Router } from "express";
import { verifyUserJwt } from "../middleware/auth.middleware.js";
import { addExpense, expenseApproval, expenseStatus, getAllExpenses } from "../controller/expense.controller.js";

const router = Router();

router.route("/create").post(verifyUserJwt, addExpense);
router.route("/expenses").get(verifyUserJwt, getAllExpenses);
router.route("/:expenseId/status").post(verifyUserJwt, expenseStatus);
router.route("/:expenseId/approve").get(verifyUserJwt, expenseApproval);
export default router;