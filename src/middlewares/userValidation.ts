import { body } from "express-validator";

export const validateUser = [
    body("email").isEmail().withMessage("Email inválido").normalizeEmail(),

    body("user_name")
        .notEmpty()
        .withMessage("El nombre de usuario es obligatorio")
        .bail()
        .isLength({ min: 5, max: 50 })
        .withMessage("El nombre de usuario debe tener entre 5 y 50 caracteres"),

    body("password")
        .isLength({ min: 8, max: 72 })
        .withMessage("La contraseña debe tener entre 8 y 72 caracteres"),
];

export const validateLogin = [
    body("email").isEmail().withMessage("Email inválido").normalizeEmail(),
    body("password").isString().isLength({ min: 1, max: 72 }),
];
