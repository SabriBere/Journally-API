import { Router } from "express";
const router = Router();
import postRounter from "./post";
import usersRouter from "./users";

router.use("/post", postRounter);
router.use("/users", usersRouter);

export default router;
