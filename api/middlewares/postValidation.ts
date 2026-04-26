import { body } from "express-validator";

const hasContent = (value: unknown) => {
    if (value === null || value === undefined) return false;
    if (typeof value === "string") return value.trim().length > 0;
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === "object") return true;
    return false;
};

export const validatePost = [
    body("title")
        .isString()
        .withMessage("El título debe ser un texto.")
        .trim()
        .notEmpty()
        .withMessage("El título es obligatorio."),
    body("description").custom((value) => {
        if (!hasContent(value)) {
            throw new Error("La descripción es obligatoria.");
        }

        return true;
    }),
];

export const validatePostUpdate = [
    body("title")
        .optional()
        .isString()
        .withMessage("El título debe ser un texto."),
    body("description")
        .optional()
        .custom((value) => {
            if (!hasContent(value)) {
                throw new Error(
                    "La descripción debe contener un valor válido."
                );
            }

            return true;
        }),
];
