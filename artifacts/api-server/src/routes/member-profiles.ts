import { Router, type IRouter } from "express";
import { db, memberProfilesTable } from "@workspace/db";
import {
  SubmitMemberProfileBody,
  SubmitMemberProfileResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.post("/member-profiles", async (req, res): Promise<void> => {
  const parsed = SubmitMemberProfileBody.safeParse(req.body);
  if (!parsed.success) {
    req.log.warn(
      { invalidFields: parsed.error.issues.map((issue) => issue.path.join(".")) },
      "Invalid member profile submission",
    );
    res.status(400).json({ error: "Please review the form fields and try again." });
    return;
  }

  try {
    const [submission] = await db
      .insert(memberProfilesTable)
      .values({ profile: parsed.data as Record<string, unknown> })
      .returning({
        id: memberProfilesTable.id,
        submittedAt: memberProfilesTable.submittedAt,
      });

    res.status(201).json(SubmitMemberProfileResponse.parse(submission));
  } catch (error) {
    req.log.error({ err: error }, "Could not save member profile submission");
    res.status(500).json({
      error: "We could not save your profile. Please try again.",
    });
  }
});

export default router;
