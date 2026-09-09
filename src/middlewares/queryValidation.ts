import { query } from "express-validator";

export const validatePostId = [query("postId").isInt({ min: 1 }).toInt()];

export const validatePostAndCollectionIds = [
    query("postId").isInt({ min: 1 }).toInt(),
    query("collectionId").isInt({ min: 1 }).toInt(),
];

export const validateCollectionQueryId = [
    query("collectionId").isInt({ min: 1 }).toInt(),
];

export const validatePagination = [
    query("page").optional().isInt({ min: 1, max: 100000 }).toInt(),
    query("searchText").optional().isString().isLength({ max: 200 }),
    query("orderField").optional().isIn(["title", "created_at", "updated_at"]),
    query("orderDirection").optional().isIn(["asc", "desc"]),
];
