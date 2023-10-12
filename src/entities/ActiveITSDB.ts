import { ConnectionPool, config } from "mssql";
export default class ActiveITSDB {
  private static instance: ActiveITSDB | null = null;
  private static pool: ConnectionPool | null = null;

  static dbConfig: config = {
    user: process.env.ACTIVEITS_DB_USERNAME,
    password: process.env.ACTIVEITS_DB_PASSWORD,
    server: process.env.ActiveITS_IP!,
    // server: "sv03tmcswridb",
    database: process.env.ACTIVEITS_DB_NAME,
    options: {
      encrypt: true, // Enable encryption
      trustServerCertificate: true, // Bypass certificate validation
    },
  };

  private constructor() {}

  static getClient(): ActiveITSDB {
    if (!ActiveITSDB.instance) {
      ActiveITSDB.instance = new ActiveITSDB();
    }
    ActiveITSDB.initializeDb();
    return ActiveITSDB.instance;
  }

  static initializeDb(): void {
    if (!ActiveITSDB.pool) {
      ActiveITSDB.pool = new ConnectionPool(ActiveITSDB.dbConfig);
    }
  }

  async connect(): Promise<void> {
    if (ActiveITSDB.pool) {
      try {
        await ActiveITSDB.pool.connect();
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
    if (ActiveITSDB.pool) {
      try {
        await this.close();
        console.log("Connection closed");
      } catch (error) {
        console.error("Error closing the connection:", error);
        throw error;
      }
    }
  }

  async executeQuery(query: string, params?: string): Promise<any> {
    if (ActiveITSDB.pool) {
      try {
        const request = ActiveITSDB.pool.request();
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
  public async get_current_cms_msgs() {
    try {
      await ActiveITSDB.getClient().connect();
      const query = `
      SELECT
      ODS_DMS_IDS.DMS_NAME,
      ODS_DMS_IDS.ID,
      DMS_STATUS.DISPLAY_CONTENT
  FROM
      ODS_DMS_IDS
  LEFT JOIN
      DMS_STATUS
      ON ODS_DMS_IDS.SUNGUIDE_ID = DMS_STATUS.RITMS_ID
  ORDER BY
      ODS_DMS_IDS.ID
    `;
      const result = await ActiveITSDB.getClient().executeQuery(query);
      const cms_num_to_current_msg: Record<string, string> = {};
      for (const row of result) {
        const dms_name = row.DMS_NAME;
        const cms_id = dms_name.split(" - ")[0];
        let cms_id_num: number;
        try {
          cms_id_num = parseInt(cms_id);
        } catch (error) {
          cms_id_num = parseInt(row.ID);
        }
        cms_num_to_current_msg[cms_id_num.toString()] = row.DISPLAY_CONTENT ? row.DISPLAY_CONTENT : "";
      }
      return cms_num_to_current_msg;
    } catch (error) {
      console.error("Error executing query:", error);
      return "";
    }
  }
  public async getPassword(username: string): Promise<string> {
    try {
      // Establish the database connection
      await ActiveITSDB.getClient().connect();

      // Define your SQL query with a parameterized query
      const query = `
        SELECT USER_PASSWORD
        FROM CT_USER
        WHERE USER_NAME = @username;
      `;
      const params = { username };
      // Execute the query using the database manager with parameters
      const result = await this.executeQuery(query, username);

      // Extract the password from the result (assuming it's the first row)
      const password = result[0]?.USER_PASSWORD;

      // Close the database connection when done
      await this.close();

      return password;
    } catch (error) {
      console.error("Error executing query:", error);
      return "";
    }
  }
  public async get_cms_id_to_ritms_id_dict() {
    try {
      const query = `
      SELECT DMS_NAME,SUNGUIDE_ID,ID FROM ODS_DMS_IDS`;
      const query_result = await ActiveITSDB.getClient().executeQuery(query);
      const cms_id_to_ritms_id: Record<string, string> = {};
      for (const row of query_result) {
        const dms_name = row.DMS_NAME;
        const cms_id = dms_name.split(" - ")[0];
        let cms_id_num: number;
        try {
          cms_id_num = parseInt(cms_id);
        } catch (error) {
          cms_id_num = parseInt(row.ID);
        }
        cms_id_to_ritms_id[cms_id_num.toString()] = row.SUNGUIDE_ID ? row.SUNGUIDE_ID : "";
      }
      console.log(cms_id_to_ritms_id);
      return cms_id_to_ritms_id;
    } catch (error) {
      console.error("Error executing query:", error);
      return "";
    }
  }
}
