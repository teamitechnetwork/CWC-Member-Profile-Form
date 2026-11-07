/// <reference lib="dom" />

import { SubmitMemberBody } from "../lib/api-zod/src/generated/api";
import { submitMemberToSheet } from "../artifacts/api-server/src/lib/member-sheet-proxy";

export default {
  async fetch(request: Request): Promise<Response> {
    if (request.method !== "POST") {
      return Response.json(
        { error: "Only POST is supported for member submissions." },
        { status: 405, headers: { Allow: "POST" } },
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return Response.json(
        { error: "Please send the member details as JSON." },
        { status: 400 },
      );
    }

    const parsed = SubmitMemberBody.strict().safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: "Please review the member details and try again." },
        { status: 400 },
      );
    }

    const result = await submitMemberToSheet(parsed.data);
    return Response.json(result.body, { status: result.status });
  },
};
