import { Router } from "express";
import entriesRounter from "./entries";
const router = Router();

router.use("/entries", entriesRounter);

export default router;
