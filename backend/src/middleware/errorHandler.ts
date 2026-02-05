import type { Request, Response, NextFunction } from "express"
import { logger } from "../utils/logger.js"

export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction): void {
  logger.error("Unhandled error:", err)

  const statusCode = res.statusCode !== 200 ? res.statusCode : 500

  res.status(statusCode).json({
    error: err.message || "Internal server error",
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  })
}
