import type { Request, Response } from "express";
import { asyncHandler } from "../../shared/utils/async-handler.js";
import { sendSuccess } from "../../shared/http/response.js";
import { SearchService } from "./search.service.js";
import type { SearchQueryInput } from "./search.schema.js";

const searchService = new SearchService();

export const search = asyncHandler(async (req: Request, res: Response) => {
  const { q, type } = req.query as unknown as SearchQueryInput;
  const results = await searchService.search(q, type);
  return sendSuccess(res, results);
});
