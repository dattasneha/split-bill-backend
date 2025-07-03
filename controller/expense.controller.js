import { asyncHandler } from "../util/asyncHandler.js";
import { ApiResponse } from "../util/apiResponse.js";
import ApiError from "../util/apiError.js";
import { STATUS } from "../constants/statusCodes.js";
import { prisma } from "../util/prismaClient.js";

const addExpense = asyncHandler(async (req, res) => {
    const { groupId, title, amount, splits } = req.body;

    if (!Array.isArray(splits)) {
        throw new ApiError(
            STATUS.CLIENT_ERROR.NOT_ACCEPTABLE,
            "'splits' must be an array."
        );
    }
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
            status: "Approved"
        }
    });

    for (const split of splits) {
        const { userId, split_amount } = split

        await prisma.expenseSplit.create({
            data: {
                expenseId: expense.id,
                userId: userId,
                amout_share: split_amount
            }
        });

        await prisma.userBalance.create({
            data: {
                expenseId: expense.id,
                user_gets_id: req.user.id,
                user_owes_id: userId,
                amout_share: split_amount
            }
        });
    }

    const totalSplit = await prisma.expenseSplit.aggregate({
        where: { expenseId: expense.id },
        _sum: {
            amout_share: true
        }
    });

    const remainingExpense = expense.amount - (totalSplit._sum.amout_share || 0);

    await prisma.expenseSplit.create({
        data: {
            expenseId: expense.id,
            userId: req.user.id,
            amout_share: remainingExpense
        }
    });

    const splitAmount = await prisma.expenseSplit.findMany({
        where: { expenseId: expense.id }
    });

    return res
        .status(STATUS.SUCCESS.CREATED)
        .json(new ApiResponse(
            splitAmount,
            "Expense added successfully."
        ));
});


const getAllExpenses = asyncHandler(async (req, res) => {
    const { groupId } = req.body;

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

const expenseStatus = asyncHandler(async (req, res) => {
    const { expenseId } = req.params;
    const { status } = req.body;

    if (!status) {
        throw new ApiError(
            STATUS.CLIENT_ERROR.NOT_ACCEPTABLE,
            "status for the expense is required."
        );
    }

    const expenseApproval = await prisma.expenseApproval.update({
        where: {
            expenseId_userId: {
                expenseId: expenseId,
                userId: req.user.id
            }
        },
        data: {
            status: status
        }
    });

    return res
        .status(STATUS.SUCCESS.OK)
        .json(
            new ApiResponse(
                expenseApproval,
                "Expence status updated successfully."
            )
        );

});

const expenseApproval = asyncHandler(async (req, res) => {
    const { expenseId } = req.params;

    const isRejected = await prisma.expenseApproval.findFirst({
        where: {
            expenseId: expenseId,
            status: "Rejected"
        }
    });

    const status = isRejected ? "Rejected" : "Approved";

    const expense = await prisma.expenses.update({
        where: { id: expenseId },
        data: { status: status }
    });

    return res
        .status(STATUS.SUCCESS.OK)
        .json(
            new ApiResponse(
                expense
            )
        );

});

export { addExpense, getAllExpenses, expenseStatus, expenseApproval }