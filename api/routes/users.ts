import { Router } from "express";
const router = Router();
import UserControllers from "../controllers/usersControllers";
import { validateUser } from "../middlewares/userValidation";

router.post("/register", validateUser, UserControllers.create);

router.post("/login", UserControllers.login);

router.put("/update", UserControllers.updatePassword)

export default router;
