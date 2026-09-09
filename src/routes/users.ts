import { Router } from "express";
import { validateLogin, validateUser } from "../middlewares/userValidation";
import {
    authenticateRefresh,
    authenticateToken,
} from "../middlewares/authtenticatedToken";
import UserControllers from "../controllers/usersControllers";
const router = Router();

router.post("/register", validateUser, UserControllers.create);

router.post("/login", validateLogin, UserControllers.login);

router.post("/refresh", authenticateRefresh, UserControllers.refreshToken);

router.post("/logout", authenticateRefresh, UserControllers.logout);

router.delete("/delete/:id", authenticateToken, UserControllers.deleteUser);

export default router;
