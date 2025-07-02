import { asyncHandler } from "../util/asyncHandler.js";
import { ApiResponse } from "../util/apiResponse.js";
import ApiError from "../util/apiError.js";
import { STATUS } from "../constants/statusCodes.js";
import { prisma } from "../util/prismaClient.js";

const addExpense = asyncHandler(async (req, res) => {
    const { title, amount } = req.body;
    const { groupId } = req.params;

    if (!amount) {
        throw new ApiError(
            STATUS.CLIENT_ERROR.NOT_ACCEPTABLE,
            "Some amount for the expense is required."
        );
    }

    if (!title) {
        throw new ApiError(
            STATUS.CLIENT_ERROR.NOT_ACCEPTABLE,
            "Some title for the expense is required."
        );
    }

    const isGroupMember = await prisma.groupMembers.findUnique({
        where: {
            groupId_userId: {
                groupId: groupId,
                userId: req.user.id
            }
        }
    });

    if (!isGroupMember) {
        throw new ApiError(
            STATUS.CLIENT_ERROR.UNAUTHORIZED,
            "Only group members can add expenses."
        );
    }

    const expense = await prisma.expenses.create({
        data: {
            groupId: groupId,
            title: title,
            amount: amount,
            created_by: req.user.id,
            status: "Pending"
        }
    });

    const expenseApproval = await prisma.expenseApproval.create({
        data: {
            expenseId: expense.id,
            userId: req.user.id,
            status: "Pending"
        }
    });

    return res
        .status(STATUS.SUCCESS.CREATED)
        .json(new ApiResponse(
            expense,
            "Expense added successfully."
        ));
});

const getAllExpenses = asyncHandler(async (req, res) => {
    const { groupId } = req.params;

    const expenses = await prisma.expenses.findMany({
        where: {
            groupId: groupId
        }
    });

    return res
        .status(STATUS.SUCCESS.OK)
        .json(new ApiResponse(
            expenses
        ));
});

export { addExpense, getAllExpenses }