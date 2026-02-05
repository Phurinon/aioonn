/*
  Warnings:

  - You are about to drop the column `patientSymptomsId` on the `TherapyHistorys` table. All the data in the column will be lost.
  - Added the required column `patientId` to the `TherapyHistorys` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "TherapyHistorys" DROP CONSTRAINT "TherapyHistorys_patientSymptomsId_fkey";

-- AlterTable
ALTER TABLE "TherapyHistorys" DROP COLUMN "patientSymptomsId",
ADD COLUMN     "patientId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "TherapyHistorys" ADD CONSTRAINT "TherapyHistorys_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
