import { ConnectionPool, config } from "mssql";

class DatabaseManager {
  private static instance: DatabaseManager | null = null;
  private pool: ConnectionPool | null = null;

  private constructor() {}

  static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  initialize(dbConfig: config): void {
    if (!this.pool) {
      this.pool = new ConnectionPool(dbConfig);
    }
  }

  async connect(): Promise<void> {
    if (this.pool) {
      try {
        await this.pool.connect();
        console.log("Connected to SQL Server");
      } catch (error) {
        console.error("SQL Server connection error:", error);
        throw error;
      }
    } else {
      throw new Error("DatabaseManager is not initialized.");
    }
  }

  async close(): Promise<void> {
    if (this.pool) {
      try {
        await this.pool.close();
        console.log("Connection closed");
      } catch (error) {
        console.error("Error closing the connection:", error);
        throw error;
      }
    }
  }

  async executeQuery(query: string, params?: string): Promise<any> {
    if (this.pool) {
      try {
        const request = this.pool.request();
        if (params !== undefined) {
          console.log(params);
          request.input("username", params);
        }
        const result = await request.query(query);
        return result.recordset;
      } catch (error) {
        console.error("Error executing query:", error);
        throw error;
      }
    } else {
      throw new Error("DatabaseManager is not initialized.");
    }
  }
}

export default DatabaseManager;
