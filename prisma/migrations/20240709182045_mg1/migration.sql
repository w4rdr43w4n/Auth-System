/*
  Warnings:

  - A unique constraint covering the columns `[email]` on the table `OAuthUser` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "OAuthUser_email_key" ON "OAuthUser"("email");
