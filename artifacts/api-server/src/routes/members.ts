import { Router, type IRouter } from "express";
import { submitMemberToSheet } from "../lib/member-sheet-proxy";

const router: IRouter = Router();

router.post("/members", async (req, res): Promise<void> => {
  const result = await submitMemberToSheet(req.body);
  if (result.status >= 500) {
    req.log.warn({ statusCode: result.status }, "Member sheet submission did not complete");
  }
  res.status(result.status).json(result.body);
});

export default router;
