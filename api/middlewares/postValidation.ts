import { body } from "express-validator";

export const validatePost = [
    body("title").trim().notEmpty().withMessage("El título es obligatorio."),
    body("description")
        .trim()
        .notEmpty()
        .withMessage("La descripción es obligatoria."),
];
