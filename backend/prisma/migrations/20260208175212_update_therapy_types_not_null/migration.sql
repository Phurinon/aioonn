/*
  Warnings:

  - Made the column `category` on table `TherapyTypes` required. This step will fail if there are existing NULL values in that column.
  - Made the column `slug` on table `TherapyTypes` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "TherapyTypes" ALTER COLUMN "category" SET NOT NULL,
ALTER COLUMN "slug" SET NOT NULL;
