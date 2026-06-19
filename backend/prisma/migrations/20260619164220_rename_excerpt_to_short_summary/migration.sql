/*
  Warnings:

  - You are about to drop the column `excerpt` on the `articles` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "articles" DROP COLUMN "excerpt",
ADD COLUMN     "short_summary" TEXT;
