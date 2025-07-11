import { Router } from "express";
const router = Router();
import UserControllers from "../controllers/usersControllers";
import { validateUser, validateNewsPass } from "../middlewares/userValidation";

router.post("/register", validateUser, UserControllers.create);

router.post("/login", UserControllers.login);

router.put("/update", validateNewsPass, UserControllers.updatePassword);

export default router;
