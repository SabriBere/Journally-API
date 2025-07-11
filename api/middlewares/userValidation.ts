import { body } from "express-validator";

export const validateUser = [
    body("email").isEmail().withMessage("Email inválido"),

    body("user_name")
        .optional()
        .isLength({ min: 5 })
        .withMessage("El nombre de usuario debe tener al menos 5 caracteres"),

    body("password")
        .isLength({ min: 8 })
        .withMessage("La contraseña debe tener al menos 8 caracteres"),
];

export const validateNewsPass = [
    body("user_id").isInt({ min: 1 }),

    body("password")
        .isLength({ min: 8 })
        .withMessage("La contraseña debe tener al menos 8 caracteres"),
];
