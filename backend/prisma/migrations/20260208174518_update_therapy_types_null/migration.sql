/*
  Warnings:

  - A unique constraint covering the columns `[slug]` on the table `TherapyTypes` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "TherapyTypes" ADD COLUMN     "category" TEXT,
ADD COLUMN     "slug" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "TherapyTypes_slug_key" ON "TherapyTypes"("slug");
