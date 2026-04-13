import type { Response } from "express";

export function sendRouteError(response: Response, error: unknown) {
  const message = error instanceof Error ? error.message : "Unexpected server error.";
  const status = message.includes("required") ? 400 : 500;

  response.status(status).json({
    error: message,
  });
}
