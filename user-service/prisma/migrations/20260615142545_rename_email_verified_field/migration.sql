/*
  Warnings:

  - You are about to drop the column `emailVarified` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "emailVarified",
ADD COLUMN     "emailVerified" BOOLEAN NOT NULL DEFAULT false;
