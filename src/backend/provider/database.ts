import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Pool } from "pg";

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(currentDirectory, "../../../.env") });

export const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: {
    rejectUnauthorized: false,
  },
  // Cierra conexiones inactivas tras 30 segundos de forma limpia para que la tabla errores_api no registre error
  idleTimeoutMillis: 30000,
  // Tiempo máximo de espera (5s) al intentar conectar si la red parpadea
  connectionTimeoutMillis: 5000,
});

// Maneja errores globales para el pool de PostgreSQL
pool.on("error", (err) => {
  console.error(
    "⚠️ Error inesperado en un cliente inactivo de PostgreSQL:",
    err.message,
  );
});
