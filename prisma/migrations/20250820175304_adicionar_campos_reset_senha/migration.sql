-- AlterTable
ALTER TABLE "Usuario" ADD COLUMN "resetPasswordExpires" DATETIME;
ALTER TABLE "Usuario" ADD COLUMN "resetPasswordToken" TEXT;
