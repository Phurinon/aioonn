/*
  Warnings:

  - You are about to drop the column `patientName` on the `Patients` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Patients" DROP COLUMN "patientName",
ADD COLUMN     "firstName" TEXT,
ADD COLUMN     "lastName" TEXT;
