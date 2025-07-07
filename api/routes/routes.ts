import { Router } from "express";
const router = Router();
import entriesRounter from "./entries";
import usersRouter from "./users";

router.use("/entries", entriesRounter);
router.use("/users", usersRouter);

export default router;
