/*
  Warnings:

  - Made the column `scoreRound1` on table `TherapyHistorys` required. This step will fail if there are existing NULL values in that column.
  - Made the column `timeRound1` on table `TherapyHistorys` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "TherapyHistorys" ALTER COLUMN "scoreRound1" SET NOT NULL,
ALTER COLUMN "timeRound1" SET NOT NULL;
