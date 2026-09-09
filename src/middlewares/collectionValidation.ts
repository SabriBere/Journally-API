import { body, query } from "express-validator";

export const validateCollectionCreate = [
    body("collectionName").isString().trim().notEmpty().isLength({ max: 100 }),
    body("title").isString().trim().notEmpty().isLength({ max: 200 }),
];

export const validateCollectionUpdate = [
    body("collectionId").isInt({ min: 1 }).toInt(),
    body("title").isString().trim().notEmpty().isLength({ max: 200 }),
];

export const validateCollectionId = [query("id").isInt({ min: 1 }).toInt()];
