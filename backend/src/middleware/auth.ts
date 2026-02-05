import type { Request, Response, NextFunction } from "express"
import { logger } from "../utils/logger.js"

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    logger.warn("Authentication failed: Missing or invalid authorization header")
    res.status(401).json({ error: "Unauthorized: Missing or invalid authorization header" })
    return
  }

  const token = authHeader.substring(7) // Remove 'Bearer ' prefix
  const expectedApiKey = process.env.API_KEY

  if (!expectedApiKey) {
    logger.error("API_KEY not configured in environment")
    res.status(500).json({ error: "Server configuration error" })
    return
  }

  if (token !== expectedApiKey) {
    logger.warn("Authentication failed: Invalid API key")
    res.status(401).json({ error: "Unauthorized: Invalid API key" })
    return
  }

  // Authentication successful
  next()
}
