/*
  Warnings:

  - You are about to drop the column `scoreRound` on the `TherapyHistorys` table. All the data in the column will be lost.
  - You are about to drop the column `timeRound` on the `TherapyHistorys` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "TherapyHistorys" DROP COLUMN "scoreRound",
DROP COLUMN "timeRound",
ADD COLUMN     "score" INTEGER,
ADD COLUMN     "time" INTEGER;
