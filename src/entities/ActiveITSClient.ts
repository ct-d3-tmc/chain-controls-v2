//import DatabaseManager from "@utils/DatabaseManager";
//import * as env from "@utils/config.js";
import fs from "fs";
import { config } from "mssql";
import { Socket } from "net";
import { Builder, parseString } from "xml2js";
import DatabaseManager from "../utils/DatabaseManager";
import * as env from "../utils/config.js";
//require("dotenv").config({ path: ".env.local" });

export default class ActiveITSClient {
  private client: Socket;
  private hostname: string;
  private port: number;
  public dbManager;
  server_url: string | undefined = process.env.DB_HOST;

  /*dbConfig: config = {
    server: this.server_url!,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
  };*/
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
  public async close(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.client.end(() => {
        console.log("Connection closed gracefully.");
        resolve();
      });
      this.client.on("error", (err) => {
        console.error("Error while closing connection:", err);
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
        console.log("data received:\n", data.toString("utf-8"));
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
  } // Utility function to parseString from xml2js
  public parseXmlAsync(xmlData: string): Promise<any> {
    return new Promise((resolve, reject) => {
      parseString(xmlData, (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  }

  public async get_queue_msgs(security_token: string, username: string) {
    const path = require("path");
    const filePath = path.resolve(__dirname, env.retrieve_cms_filepath);
    const xmlData = fs.readFileSync(filePath, "utf-8");
    // Parse the XML data
    const result = await this.parseXmlAsync(xmlData);
    // Modify the parsed data
    const retrieveDataReq = result.retrieveDataReq;

    if (!retrieveDataReq) {
      throw new Error("XML structure is invalid.");
    }
    retrieveDataReq.refId[0] = username;
    retrieveDataReq.username[0] = username;
    retrieveDataReq.securityToken = security_token;

    // Convert the modified data back to XML
    const builder = new Builder();
    const modifiedXml: string = builder.buildObject(result);
    const sendDataResult = await this.sendData(modifiedXml);
    console.log(sendDataResult);
    return sendDataResult;
  }
  public async get_current_cms_msgs() {
    try {
      await this.dbManager.connect();
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
      const result = await this.dbManager.executeQuery(query);
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
        cms_num_to_current_msg[cms_id_num.toString()] = row.DISPLAY_CONTENT
          ? row.DISPLAY_CONTENT
          : "";
      }
      return cms_num_to_current_msg;
    } catch (error) {
      console.error("Error executing query:", error);
      return "";
    }
  }
}
