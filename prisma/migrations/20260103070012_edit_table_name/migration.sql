/*
  Warnings:

  - You are about to drop the `Patient` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "PatientSymptoms" DROP CONSTRAINT "PatientSymptoms_patientId_fkey";

-- DropTable
DROP TABLE "Patient";

-- CreateTable
CREATE TABLE "Patients" (
    "id" SERIAL NOT NULL,
    "patientName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Patients_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PatientSymptoms" ADD CONSTRAINT "PatientSymptoms_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
