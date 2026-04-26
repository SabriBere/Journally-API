/*
  Warnings:

  - Changed the type of `description` on the `Post` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
-- AlterTable
ALTER TABLE "Post"
ALTER COLUMN "description" TYPE JSONB
USING to_jsonb("description");

