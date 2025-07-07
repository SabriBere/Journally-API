import { Router } from "express";
const router = Router();
import UserControllers from "../controllers/usersControllers";

router.post("/create", UserControllers.create);

router.post("/login", UserControllers.login);

export default router;
