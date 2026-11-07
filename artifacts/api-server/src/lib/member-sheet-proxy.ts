declare const process: {
  env: {
    SHEET_URL?: string;
    SHEET_SECRET?: string;
  };
};

type MemberSheetSuccess = {
  ok: true;
};

type MemberSheetError = {
  ok: false;
  error: string;
};

export type MemberSheetProxyResult = {
  status: number;
  body: MemberSheetSuccess | MemberSheetError;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function trimAndLimitValues(value: unknown): unknown {
  if (typeof value === "string") return value.trim().slice(0, 5000);
  if (Array.isArray(value)) return value.map(trimAndLimitValues);
  if (isRecord(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, trimAndLimitValues(item)]),
    );
  }
  return value;
}

function errorResponse(status: number, error: string): MemberSheetProxyResult {
  return { status, body: { ok: false, error } };
}

function getErrorMessage(value: unknown, sensitiveValues: string[]): string | undefined {
  if (!value || typeof value !== "object" || !("error" in value)) return undefined;
  const message = (value as { error?: unknown }).error;
  if (typeof message !== "string" || !message.trim()) return undefined;

  let safeMessage = message.trim().slice(0, 5000);
  for (const sensitiveValue of sensitiveValues) {
    if (sensitiveValue) {
      safeMessage = safeMessage.split(sensitiveValue).join("[redacted]");
    }
  }
  return safeMessage;
}

export async function submitMemberToSheet(
  submission: unknown,
): Promise<MemberSheetProxyResult> {
  const sheetUrl = process.env.SHEET_URL;
  const sheetSecret = process.env.SHEET_SECRET;
  if (!sheetUrl || !sheetSecret) {
    return errorResponse(500, "server not configured");
  }

  try {
    if (new URL(sheetUrl).protocol !== "https:") {
      return errorResponse(500, "server not configured");
    }
  } catch {
    return errorResponse(500, "server not configured");
  }

  if (!isRecord(submission)) {
    return errorResponse(400, "Submission must be a JSON object.");
  }

  const fields = { ...submission };
  delete fields.secret;
  const unchangedFields = new Set([
    "LinkedIn profile",
    "Is this a business or a nonprofit?",
    "Business name",
    "What is your business or nonprofit for?",
  ]);
  const formFields = Object.fromEntries(
    Object.entries(fields)
      .filter(
        ([key, value]) =>
          !unchangedFields.has(key) ||
          !(typeof value === "string" && value.trim() === ""),
      )
      .map(([key, value]) => [
        key,
        unchangedFields.has(key) ? value : trimAndLimitValues(value),
      ]),
  ) as Record<string, unknown>;

  const fullName = formFields["Full name"];
  if (typeof fullName !== "string" || !fullName) {
    return errorResponse(400, "Full name is required.");
  }

  const email = formFields["Email address"];
  if (typeof email !== "string" || !email) {
    return errorResponse(400, "Email address is required.");
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return errorResponse(400, "Email address must be a valid email address.");
  }

  const ownsBusiness = formFields["Do you currently own or operate a business?"];
  if (
    ownsBusiness !== true &&
    ownsBusiness !== false &&
    ownsBusiness !== "true" &&
    ownsBusiness !== "false"
  ) {
    return errorResponse(400, "Do you currently own or operate a business? is required.");
  }

  try {
    const upstream = await fetch(sheetUrl, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ ...formFields, secret: sheetSecret }),
      redirect: "follow",
      signal: AbortSignal.timeout(20_000),
    });

    let responseData: unknown;
    try {
      responseData = await upstream.json();
    } catch {
      return errorResponse(502, "The member sheet returned an unreadable response. Please try again.");
    }

    if (
      isRecord(responseData) &&
      responseData.ok === true
    ) {
      return { status: 200, body: { ok: true } };
    }

    return errorResponse(
      502,
      getErrorMessage(responseData, [sheetUrl, sheetSecret]) ??
        "The member sheet could not save this profile. Please try again.",
    );
  } catch {
    return errorResponse(502, "We couldn’t reach the member sheet. Please try again.");
  }
}
