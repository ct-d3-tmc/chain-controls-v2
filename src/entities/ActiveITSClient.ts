import DatabaseManager from "@utils/DatabaseManager";
import { config } from "mssql";
import { Socket } from "net";
require("dotenv").config({ path: ".env.local" });

export default class ActiveITSClient {
  private client: Socket;
  private hostname: string;
  private port: number;
  private dbManager;
  server_url: string | undefined = process.env.DB_HOST;

  dbConfig: config = {
    server: this.server_url!,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
  };

  constructor(hostname: string, port: number) {
    this.client = new Socket();
    this.hostname = hostname;
    this.port = port;
    this.dbManager = DatabaseManager.getInstance();
    this.dbManager.initialize(this.dbConfig);
  }

  public async connect(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.client.connect(this.port, this.hostname, () => {
        console.log("Connected to server!");
        resolve();
      });

      this.client.on("error", (err) => {
        console.error("Connection error:", err);
        reject(err);
      });
    });
  }

  public async sendData(data: string): Promise<void> {
    const len = data.length;
    const decompressionSize = 0;

    console.log("Sending data payload:\n", data);

    // convert integer to byte array
    const conv = (num: number) => [
      (num >> 24) & 255,
      (num >> 16) & 255,
      (num >> 8) & 255,
      num & 255,
    ];

    const buf1 = Buffer.from(conv(len));
    const buf2 = Buffer.from(conv(decompressionSize));
    const buf3 = Buffer.from(data, "utf8");
    const buf = Buffer.concat([buf1, buf2, buf3]);

    return new Promise<void>((resolve, reject) => {
      this.client.write(buf, () => {
        console.log("Data sent to ActiveITS.");
        resolve();
      });

      this.client.on("error", (err) => {
        console.error("Connection error while writing:", err);
        reject(err);
      });
    });
  }
  public async readData(): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      this.client.once("data", (data) => {
        console.log("data received:\n", data.toString());
        resolve(data.toString());
      });

      this.client.on("error", (err) => {
        console.error("Connection error while reading:", err);
        reject(err);
      });
    });
  }
  public async getPassword(username: string): Promise<string> {
    try {
      // Establish the database connection
      await this.dbManager.connect();

      // Define your SQL query with a parameterized query
      const query = `
        SELECT USER_PASSWORD
        FROM CT_USER
        WHERE USER_NAME = @username;
      `;
      const params = { username };
      // Execute the query using the database manager with parameters
      const result = await this.dbManager.executeQuery(query, username);

      // Extract the password from the result (assuming it's the first row)
      const password = result[0]?.USER_PASSWORD;

      // Close the database connection when done
      await this.dbManager.close();

      return password;
    } catch (error) {
      console.error("Error executing query:", error);
      return "";
    }
  }
}
