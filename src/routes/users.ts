import { Router } from "express";
import { validateUser } from "../middlewares/userValidation";
import {
    authenticateRefresh,
    authenticateToken,
} from "../middlewares/authtenticatedToken";
import UserControllers from "../controllers/usersControllers";
const router = Router();

router.post("/register", validateUser, UserControllers.create);

router.post("/login", UserControllers.login);

router.post("/refresh", authenticateRefresh, UserControllers.refreshToken);

router.delete("/delete/:id", authenticateToken, UserControllers.deleteUser);

export default router;
