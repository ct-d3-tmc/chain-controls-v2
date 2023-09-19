import { ConnectionPool, config } from "mssql";
require("dotenv").config({ path: ".env.local" });

const server_url: string | undefined = process.env.DB_HOST;

const dbConfig: config = {
  server: server_url!,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
};

const pool = new ConnectionPool(dbConfig);

async function connectToDatabase() {
  try {
    await pool.connect();
    console.log("Connected to SQL Server");
  } catch (error) {
    console.error("SQL Server connection error:", error);
  }
}

connectToDatabase();
export default pool;
