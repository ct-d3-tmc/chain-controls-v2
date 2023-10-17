import { ConnectionPool, config } from "mssql";
export default class ActiveITSDBClient {
  private static instance: ActiveITSDBClient | null = null;
  private pool: ConnectionPool | null = null;

  dbConfig: config = {
    user: "readonlyuser",
    password: "Caltrans2018",
    server: "10.28.27.238",
    // server: "sv03tmcswridb",
    database: "SGDB",
    options: {
      encrypt: true, // Enable encryption
      trustServerCertificate: true, // Bypass certificate validation
    },
  };

  private constructor() {}

  static getInstance(): ActiveITSDBClient {
    if (!ActiveITSDBClient.instance) {
      ActiveITSDBClient.instance = new ActiveITSDBClient();
    }
    return ActiveITSDBClient.instance;
  }

  initialize(): void {
    if (!this.pool) {
      this.pool = new ConnectionPool(this.dbConfig);
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
  public async get_current_cms_msgs() {
    try {
      await ActiveITSDBClient.getInstance().connect();
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
      const result = await ActiveITSDBClient.getInstance().executeQuery(query);
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
      await ActiveITSDBClient.getInstance().connect();

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
      const query_result = await ActiveITSDBClient.getInstance().executeQuery(query);
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
