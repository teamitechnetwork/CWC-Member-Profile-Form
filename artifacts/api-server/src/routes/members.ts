import { Router, type IRouter } from "express";
import { SubmitMemberBody } from "@workspace/api-zod";
import { submitMemberToSheet } from "../lib/member-sheet-proxy";

const router: IRouter = Router();

router.post("/members", async (req, res): Promise<void> => {
  const parsed = SubmitMemberBody.strict().safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Please review the member details and try again." });
    return;
  }

  const result = await submitMemberToSheet(parsed.data);
  if (result.status >= 500) {
    req.log.warn({ statusCode: result.status }, "Member sheet submission did not complete");
  }
  res.status(result.status).json(result.body);
});

export default router;
