-- AlterTable
ALTER TABLE "User" ADD COLUMN     "token" TEXT,
ADD COLUMN     "tokenExpiracy" TIMESTAMP(3);
