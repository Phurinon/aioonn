/*
  Warnings:

  - You are about to drop the column `scoreRound1` on the `TherapyHistorys` table. All the data in the column will be lost.
  - You are about to drop the column `scoreRound2` on the `TherapyHistorys` table. All the data in the column will be lost.
  - You are about to drop the column `timeRound1` on the `TherapyHistorys` table. All the data in the column will be lost.
  - You are about to drop the column `timeRound2` on the `TherapyHistorys` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "TherapyHistorys" DROP COLUMN "scoreRound1",
DROP COLUMN "scoreRound2",
DROP COLUMN "timeRound1",
DROP COLUMN "timeRound2",
ADD COLUMN     "angle" INTEGER,
ADD COLUMN     "scoreRound" INTEGER,
ADD COLUMN     "timeRound" INTEGER,
ADD COLUMN     "weight" INTEGER;
