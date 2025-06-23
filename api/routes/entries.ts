import { Router } from "express";
import EntriesControllers from "../controllers/entriesControllers";
const router = Router();

router.get("/", EntriesControllers.allEntries)

export default router;
