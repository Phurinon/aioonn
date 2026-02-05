/*
  Warnings:

  - Made the column `armSide` on table `PatientSymptoms` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "PatientSymptoms" ALTER COLUMN "armSide" SET NOT NULL;
