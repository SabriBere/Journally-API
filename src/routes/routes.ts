import { Router } from "express";
const router = Router();
import postRounter from "./post";
import usersRouter from "./users";
import collectionRouter from "./colletions"

router.use("/post", postRounter);
router.use("/users", usersRouter);
router.use("/collections", collectionRouter);

export default router;
