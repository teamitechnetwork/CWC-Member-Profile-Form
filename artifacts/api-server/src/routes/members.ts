import { Router, type IRouter } from "express";
import { SubmitMemberBody } from "@workspace/api-zod";

const router: IRouter = Router();

function getErrorMessage(value: unknown): string | undefined {
  if (!value || typeof value !== "object" || !("error" in value)) return undefined;
  const message = (value as { error?: unknown }).error;
  return typeof message === "string" && message.trim()
    ? message.trim().slice(0, 500)
    : undefined;
}

router.post("/members", async (req, res): Promise<void> => {
  const parsed = SubmitMemberBody.strict().safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Please review the member details and try again." });
    return;
  }

  const sheetUrl = process.env.SHEET_URL;
  const sheetSecret = process.env.SHEET_SECRET;
  if (!sheetUrl || !sheetSecret) {
    req.log.error("Google Sheets submission is missing server configuration");
    res.status(503).json({ error: "Member submissions are not configured. Please contact CWC." });
    return;
  }

  let targetUrl: URL;
  try {
    targetUrl = new URL(sheetUrl);
  } catch {
    req.log.error("Google Sheets submission URL is invalid");
    res.status(503).json({ error: "Member submissions are not configured. Please contact CWC." });
    return;
  }
  if (targetUrl.protocol !== "https:") {
    req.log.error("Google Sheets submission URL must use HTTPS");
    res.status(503).json({ error: "Member submissions are not configured. Please contact CWC." });
    return;
  }

  try {
    const upstream = await fetch(sheetUrl, {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: JSON.stringify({ secret: sheetSecret, member: parsed.data }),
      redirect: "follow",
      signal: AbortSignal.timeout(20_000),
    });

    let responseData: unknown;
    try {
      responseData = await upstream.json();
    } catch {
      req.log.warn({ statusCode: upstream.status }, "Apps Script returned a non-JSON response");
      res.status(502).json({ error: "The member sheet returned an unreadable response. Please try again." });
      return;
    }

    if (
      upstream.ok &&
      responseData &&
      typeof responseData === "object" &&
      "ok" in responseData &&
      (responseData as { ok?: unknown }).ok === true &&
      "row" in responseData &&
      Number.isInteger((responseData as { row?: unknown }).row) &&
      (responseData as { row: number }).row >= 1
    ) {
      res.status(200).json({
        ok: true,
        row: (responseData as { row: number }).row,
      });
      return;
    }

    const message = getErrorMessage(responseData);
    req.log.warn({ statusCode: upstream.status }, "Apps Script did not accept the member submission");
    res.status(502).json({
      error: message ?? "The member sheet could not save this profile. Please try again.",
    });
  } catch (error) {
    req.log.error(
      { errorName: error instanceof Error ? error.name : "UnknownError" },
      "Apps Script member submission request failed",
    );
    res.status(502).json({ error: "We couldn’t reach the member sheet. Please try again." });
  }
});

export default router;
