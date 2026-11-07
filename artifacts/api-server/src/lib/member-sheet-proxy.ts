import type { CwcMemberFormSubmission, MemberSheetSuccess } from "@workspace/api-zod";

export type MemberSheetProxyResult = {
  status: number;
  body: MemberSheetSuccess | { error: string };
};

function getErrorMessage(value: unknown): string | undefined {
  if (!value || typeof value !== "object" || !("error" in value)) return undefined;
  const message = (value as { error?: unknown }).error;
  return typeof message === "string" && message.trim()
    ? message.trim().slice(0, 500)
    : undefined;
}

export async function submitMemberToSheet(
  member: CwcMemberFormSubmission,
): Promise<MemberSheetProxyResult> {
  const sheetUrl = process.env.SHEET_URL;
  const sheetSecret = process.env.SHEET_SECRET;
  if (!sheetUrl || !sheetSecret) {
    return {
      status: 503,
      body: { error: "Member submissions are not configured. Please contact CWC." },
    };
  }

  try {
    if (new URL(sheetUrl).protocol !== "https:") {
      return {
        status: 503,
        body: { error: "Member submissions are not configured. Please contact CWC." },
      };
    }
  } catch {
    return {
      status: 503,
      body: { error: "Member submissions are not configured. Please contact CWC." },
    };
  }

  try {
    const upstream = await fetch(sheetUrl, {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: JSON.stringify({ secret: sheetSecret, member }),
      redirect: "follow",
      signal: AbortSignal.timeout(20_000),
    });

    let responseData: unknown;
    try {
      responseData = await upstream.json();
    } catch {
      return {
        status: 502,
        body: { error: "The member sheet returned an unreadable response. Please try again." },
      };
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
      return {
        status: 200,
        body: { ok: true, row: (responseData as { row: number }).row },
      };
    }

    return {
      status: 502,
      body: {
        error: getErrorMessage(responseData) ??
          "The member sheet could not save this profile. Please try again.",
      },
    };
  } catch {
    return {
      status: 502,
      body: { error: "We couldn’t reach the member sheet. Please try again." },
    };
  }
}
