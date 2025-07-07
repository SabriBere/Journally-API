import { Router } from "express";
import UserControllers from "../controllers/usersControllers";
const router = Router();

router.post("/create", UserControllers.create)

router.post("/login", UserControllers.login)

export default router;
