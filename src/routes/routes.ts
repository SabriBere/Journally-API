import { Router } from "express";
const router = Router();
import postRouter from "./post";
import usersRouter from "./users";
import collectionRouter from "./collections";

router.use("/post", postRouter);
router.use("/users", usersRouter);
router.use("/collections", collectionRouter);

export default router;
