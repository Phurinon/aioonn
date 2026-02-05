/*
  Warnings:

  - Made the column `displayName` on table `Users` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Users" ALTER COLUMN "displayName" SET NOT NULL;
