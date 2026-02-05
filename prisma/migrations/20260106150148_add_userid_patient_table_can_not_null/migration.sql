/*
  Warnings:

  - Made the column `userId` on table `Patients` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Patients" DROP CONSTRAINT "Patients_userId_fkey";

-- AlterTable
ALTER TABLE "Patients" ALTER COLUMN "userId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "Patients" ADD CONSTRAINT "Patients_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
