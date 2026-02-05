import { describe, it, expect, afterAll } from "vitest"
import request from "supertest"
import { app, server } from "../server.js"

describe("Chat API", () => {
  const apiKey = process.env.API_KEY || "test-api-key"

  afterAll(() => {
    server.close()
  })

  it("should require authentication", async () => {
    const response = await request(app).post("/v1/chat/stream").send({
      prompt: "Hello",
      context: {},
    })

    expect(response.status).toBe(401)
  })

  it("should reject invalid API key", async () => {
    const response = await request(app).post("/v1/chat/stream").set("Authorization", "Bearer invalid-key").send({
      prompt: "Hello",
      context: {},
    })

    expect(response.status).toBe(401)
  })

  it("should accept valid API key", async () => {
    const response = await request(app).post("/v1/chat/stream").set("Authorization", `Bearer ${apiKey}`).send({
      prompt: "Hello",
      context: {},
    })

    expect(response.status).toBe(200)
    expect(response.headers["content-type"]).toContain("text/event-stream")
  })

  it("should require prompt", async () => {
    const response = await request(app).post("/v1/chat").set("Authorization", `Bearer ${apiKey}`).send({
      context: {},
    })

    expect(response.status).toBe(400)
    expect(response.body.error).toBe("Prompt is required")
  })

  it("should return health status", async () => {
    const response = await request(app).get("/v1/health")

    expect(response.status).toBe(200)
    expect(response.body.status).toBe("ok")
    expect(response.body).toHaveProperty("timestamp")
    expect(response.body).toHaveProperty("uptime")
  })
})
