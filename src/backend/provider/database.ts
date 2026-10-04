import dotenv from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { Pool } from 'pg'

const currentDirectory = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(currentDirectory, '../../../.env') })

export const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: {
    rejectUnauthorized: false
  }
})
