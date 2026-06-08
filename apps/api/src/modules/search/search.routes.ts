import { Router } from "express";
import { search } from "./search.controller.js";
import { validateQuery } from "../../shared/middlewares/validator.js";
import { searchQuerySchema } from "./search.schema.js";

const router = Router();

router.get("/", validateQuery(searchQuerySchema), search);

export default router;
