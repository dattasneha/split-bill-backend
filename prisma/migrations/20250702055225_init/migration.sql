-- CreateTable
CREATE TABLE "Expenses" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "created_by" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Expenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExpenseApproval" (
    "expenseId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL,

    CONSTRAINT "ExpenseApproval_pkey" PRIMARY KEY ("expenseId","userId")
);

-- CreateTable
CREATE TABLE "ExpenseSplit" (
    "expenseId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amout_share" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "ExpenseSplit_pkey" PRIMARY KEY ("expenseId","userId")
);

-- AddForeignKey
ALTER TABLE "Expenses" ADD CONSTRAINT "Expenses_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expenses" ADD CONSTRAINT "Expenses_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpenseApproval" ADD CONSTRAINT "ExpenseApproval_expenseId_fkey" FOREIGN KEY ("expenseId") REFERENCES "Expenses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpenseApproval" ADD CONSTRAINT "ExpenseApproval_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpenseSplit" ADD CONSTRAINT "ExpenseSplit_expenseId_fkey" FOREIGN KEY ("expenseId") REFERENCES "Expenses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpenseSplit" ADD CONSTRAINT "ExpenseSplit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
