export const dbIndexes = [
  {
    table: "users",
    columns: ["email"],
    unique: true,
  },
  {
    table: "users",
    columns: ["created_at"],
  },
  {
    table: "extensions",
    columns: ["name"],
    unique: true,
  },
  {
    table: "extensions",
    columns: ["user_id", "created_at"],
  },
  {
    table: "models",
    columns: ["provider"],
  },
  {
    table: "models",
    columns: ["is_default"],
  },
  {
    table: "metrics",
    columns: ["timestamp"],
  },
  {
    table: "metrics",
    columns: ["metric_type", "timestamp"],
  },
  {
    table: "logs",
    columns: ["level"],
  },
  {
    table: "logs",
    columns: ["created_at"],
  },
]

export function createIndexes(db: any): void {
  dbIndexes.forEach((indexDef) => {
    const columns = indexDef.columns.join(", ")
    const uniqueClause = indexDef.unique ? "UNIQUE" : ""
    const indexName = `idx_${indexDef.table}_${indexDef.columns.join("_")}`

    const sql = `
      CREATE INDEX IF NOT EXISTS ${indexName}
      ON ${indexDef.table} (${columns})
      ${uniqueClause}
    `

    try {
      db.exec(sql)
    } catch (error) {
      console.log(`[v0] Index ${indexName} already exists or skipped`)
    }
  })
}
