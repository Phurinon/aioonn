/*
  Warnings:

  - You are about to drop the column `result` on the `TherapyHistorys` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "TherapyHistorys" DROP COLUMN "result",
ADD COLUMN     "scoreRound1" INTEGER,
ADD COLUMN     "scoreRound2" INTEGER,
ADD COLUMN     "timeRound1" INTEGER,
ADD COLUMN     "timeRound2" INTEGER;
