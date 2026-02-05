-- AlterTable
ALTER TABLE "Patients" ADD COLUMN     "userId" INTEGER;

-- AddForeignKey
ALTER TABLE "Patients" ADD CONSTRAINT "Patients_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
