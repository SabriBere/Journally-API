import { Router } from "express";
import { validateUser, validateNewsPass } from "../middlewares/userValidation";
const router = Router();
import UserControllers from "../controllers/usersControllers";

router.post("/register", validateUser, UserControllers.create);

router.post("/login", UserControllers.login);

router.post("/refresh", UserControllers.refreshToken);

router.put("/update", validateNewsPass, UserControllers.updatePassword);

router.delete("/delete/:id", UserControllers.deleteUser)

export default router;
