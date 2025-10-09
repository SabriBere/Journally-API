-- DropForeignKey
ALTER TABLE "Post" DROP CONSTRAINT "Post_collection_id_fkey";

-- AlterTable
ALTER TABLE "Post" ALTER COLUMN "collection_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_collection_id_fkey" FOREIGN KEY ("collection_id") REFERENCES "Collection"("collection_id") ON DELETE SET NULL ON UPDATE CASCADE;
