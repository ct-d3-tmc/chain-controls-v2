import fs from "fs";
import { Socket } from "net";
import * as xml2js from "xml2js";
import { Builder, parseString } from "xml2js";
import * as env from "../utils/config.js";
import ActiveITSDB from "./ActiveITSDB.js";

interface LoginRequest {
  authenticateReq: {
    $: {
      "xmlns:xsd": string;
      "xmlns:xsi": string;
      providerName: string;
      providerType: string;
    };
    refId: string[];
    icdVersion: string[];
    username: string[];
    password: string[];
  };
}

interface LoginResponse {
  authenticateResp: {
    $: {
      providerName: string;
    };
    refId: string[];
    icdVersion: string[];
    securityToken: string[];
    data: LoginResponseDataItem[];
  };
}

interface LoginResponseDataItem {
  authenticateReq: {
    $: {
      "xsi:type": string;
      "xmlns:xsi": string;
    };
    securityToken: string[];
  };
}

interface RetrieveRequest {
  retrieveDataReq: {
    $: {
      "xmlns:xsd": string;
      "xmlns:xsi": string;
      providerName: string;
      providerType: string;
    };
    refId: string[];
    icdVersion: string[];
    username: string[];
    securityToken: string[];
    queueData: string[];
  };
}

interface RetrieveResponse {
  retrieveDataResp: {
    $: {
      "xmlns:xsi": string;
      providerName: string;
      providerType: string;
    };
    refId: string[];
    icdVersion: string[];
    securityToken: string[];
    data: DataItem[];
  };
}

interface DataItem {
  $: {
    "xsi:type": string;
  };
  queueData: QueueDataItem[];
}

interface QueueDataItem {
  queue: QueueItem[];
}

interface QueueItem {
  $: {
    state: string;
  };
  id: IdItem[];
  queueMsg: QueueMsgItem[];
}

interface IdItem {
  _: string; // Example: '29:7'
  $: {
    priority: string; // Example: '255'
    position: string; // Example: '1'
  };
}

interface QueueMsgItem {
  msgId: string[];
  msgText: string[];
  receivedTime: string[];
  expiration: string[];
  multiMsg: MultiMsgItem[];
  autoMergePrimary: string[];
  autoMergeSecondary: string[];
  linkMsgAutoMerged: string[];
}

interface MultiMsgItem {
  multiText: string[];
  owner: string[];
  priority: string[];
  duration: string[];
  beaconsEnabled: string[];
  pixelServiceEnabled: string[];
  sendAsIs: string[];
}

/*mock data
    {
      multiText: ['[pt30o0][jl3]ICE AND SNOW[nl][jl3]TAKE IT SLOW'],
      owner: ['chainControl'],
      priority: ['2'],
      duration: ['-1'],
      beaconsEnabled: ['false'],
      pixelServiceEnabled: ['false'],
      sendAsIs: ['false'],
    },
  ];*/

interface RemoveMsgRequest {
  removeMsgReq: {
    $: {
      "xmlns:xsd": string;
      "xmlns:xsi": string;
      providerName: string;
      providerType: string;
    };
    refId: string[];
    icdVersion: string[];
    username: string[];
    securityToken: string[];
    id: number[];
    msgId: string[];
  };
}

interface ID {
  _: string;
  $: {
    providerName: string;
    resourceType: string;
    centerId: string;
  };
}
interface AddMsgRequest {
  addMsgReq: {
    $: {
      providerName: string;
      providerType: string;
    };
    refId: string[];
    icdVersion: string[];
    username: string[];
    securityToken: string[];
    id: number[];
    multiMsg: MultiMsgItem[];
    autoMergePrimary: string[];
    autoMergeSecondary: string[];
  };
}

export default class ActiveITSClient {
  private client: Socket;
  private hostname: string;
  private port: number;
  server_url: string | undefined = process.env.DB_HOST;

  /*dbConfig: config = {
    server: this.server_url!,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
  };*/

  constructor(hostname: string, port: number) {
    this.client = new Socket();
    this.hostname = hostname;
    this.port = port;
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
    const conv = (num: number) => [(num >> 24) & 255, (num >> 16) & 255, (num >> 8) & 255, num & 255];

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
      this.client.on("data", (data) => {
        //console.log("data received:\n", data.toString("utf-8"));
        const dataToProcess = data.slice(8);
        resolve(dataToProcess.toString("utf-8"));
      });

      this.client.on("error", (err) => {
        console.error("Connection error while reading:", err);
        reject(err);
      });
    });
  }
  public async readRetrievalData(): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      let dataBuffer: Buffer[] = [];

      // Listen for 'data' events and accumulate data
      this.client.on("data", (chunk) => {
        dataBuffer.push(chunk);

        // Check if the received data meets your condition (e.g., ends with a delimiter)
        const dataString = Buffer.concat(dataBuffer).toString("utf-8");
        if (dataString.includes("</retrieveDataResp>")) {
          const path = require("path");
          // Resolve the promise with the accumulated data
          /* fs.writeFile(path.join(__dirname, env.write), dataString, (err) => {
            if (err) {
              console.error("Error writing to the file:", err);
            } else {
              console.log("Output written to file");
            }
          });*/
          resolve(dataString.slice(8));
        }
      });

      // Listen for errors during the data reading operation
      this.client.on("error", (err) => {
        console.error("Connection error while reading:", err);
        reject(err);
      });
    });
  }

  // Utility function to parseString from xml2js
  public async parseXmlAsync(xmlData: string): Promise<any> {
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

  public async get_queue_msgs(security_token: string, username: string): Promise<string> {
    const path = require("path");
    const filePath = path.join(__dirname, env.retrieve_cms_filepath);
    const xmlData = await fs.readFileSync(filePath, "utf-8");
    // Parse the XML data
    const retrieveTemplate: RetrieveRequest = await this.parseXmlAsync(xmlData);
    fs.writeFile(path.join(__dirname, env.write), JSON.stringify(retrieveTemplate), (err) => {
      if (err) {
        console.error("Error writing to the file:", err);
      } else {
        console.log("Data written to the file successfully");
      }
    });
    if (!retrieveTemplate) {
      throw new Error("XML structure is invalid.");
    }
    if (retrieveTemplate && retrieveTemplate.retrieveDataReq) {
      retrieveTemplate.retrieveDataReq.refId[0] = String(username);
      retrieveTemplate.retrieveDataReq.username[0] = String(username);
      retrieveTemplate.retrieveDataReq.securityToken[0] = security_token;
    }
    // Convert the modified data back to XML
    const builder = new Builder();
    const modifiedXml: string = builder.buildObject(retrieveTemplate);
    await this.sendData(modifiedXml);
    const retrieval_response: string = await this.readRetrievalData();
    return retrieval_response;
  }
  public async login_to_subsystem(subsystem: string, goldeneye_username: string | null, db_client: ActiveITSDB) {
    let xmlPath = "";
    switch (subsystem) {
      case env.DATABUS_SUBSYSTEM:
        xmlPath = env.mas_login_filepath;
        break;
      case env.DMS_SUBSYSTEM:
        xmlPath = env.dms_login_filepath;
        break;
      case env.MAS_SUBSYSTEM:
        xmlPath = env.mas_login_filepath;
        break;
      default:
        throw new Error(`Incorrect subsystem login: ${subsystem}`);
    }
    const path = require("path");
    //const filePath = path.resolve(__dirname, xmlPath);
    const relativePath = path.join(__dirname, xmlPath);

    const xmlData = fs.readFileSync(relativePath, "utf-8");
    const login_template: LoginRequest = await this.parseXmlAsync(xmlData);
    console.log(login_template);
    const password = await db_client.getPassword(String(goldeneye_username));

    if (!login_template) {
      throw new Error("XML structure is invalid.");
    }
    if (login_template && login_template.authenticateReq) {
      login_template.authenticateReq.refId[0] = String(goldeneye_username);
      login_template.authenticateReq.username[0] = String(goldeneye_username);
      login_template.authenticateReq.password[0] = password;
    }

    const builder = new Builder();
    const updated_login_request: string = builder.buildObject(login_template);
    await this.sendData(updated_login_request);
    const response_with_security_token: string = await this.readData();
    return new Promise<string>((resolve, reject) => {
      xml2js.parseString(response_with_security_token, (error, result) => {
        if (error) {
          console.error("Parsing error:", error);
          reject(error);
        } else {
          const authenticateResp: LoginResponse = result.authenticateResp;
          console.log(result.authenticateResp.data);
          if (result && result.authenticateResp && result.authenticateResp.securityToken && result.authenticateResp.securityToken[0]) {
            const mas_security_token = result.authenticateResp.securityToken[0];
            resolve(mas_security_token);
          } else {
            reject(new Error("Security Token missing in login response"));
          }
        }
      });
    });
  }

  public removePtTags(message: string): string {
    // Remove [pt..] tags from the message
    message = message.replace(/\[pt[^\]]*\]/g, "");
    return message.trim();
  }

  public is_travel_time_message(id_num: number, xml_data: any, message: string): Promise<boolean> {
    const path = require("path");
    message = this.removePtTags(message);
    fs.writeFile(path.join(__dirname, env.write), xml_data, (err) => {
      if (err) {
        console.error("Error writing to the file:", err);
      } else {
        console.log("Output written to file");
      }
    });
    return new Promise<boolean>((resolve, reject) => {
      xml2js.parseString(xml_data, (error, result) => {
        if (error) {
          console.error("Parsing error:", error);
          reject(error);
        } else {
          const retrievalResp: RetrieveResponse = result;
          if (
            retrievalResp &&
            retrievalResp.retrieveDataResp &&
            retrievalResp.retrieveDataResp.data &&
            retrievalResp.retrieveDataResp.data[0].queueData
          ) {
            const queueArray = retrievalResp.retrieveDataResp.data[0].queueData[0].queue;
            const msgIds = queueArray
              .flatMap((item) => (item.queueMsg || []).filter((queueMsgItem) => queueMsgItem.msgId))
              .map((queueMsgItem) => queueMsgItem.msgId[0]);
            console.log(msgIds);
            const filteredQueueArray = queueArray.filter((item) => {
              const cmdid = parseInt(item.id[0]._);
              return cmdid === id_num;
            });
            const messageExists = filteredQueueArray.some((item) => {
              return item.queueMsg.some((msg) => {
                const msgText = msg.msgText[0];
                const owner = msg.multiMsg[0].owner[0];
                return msgText === message && owner === "tvtMain";
              });
            });
          }
        }
      });
    });
  }

  public translateNTCIPToHTML(message: string): string {
    message = this.removePtTags(message);
    const ntcipToHtml: { [key: string]: string } = {
      "[np]": "<newpanel>", // New Page
      "[jpx]": "", // Justification - page
      "[jp2]": "", // Justification - Top Page
      "[jp3]": "", // Justification - Middle Page
      "[jp4]": "", // Justification - Bottom Page
      "[nlx]": "<br>", // New Line
      "[nl]": "</span><br>", // New Line
      "[jlx]": "", // Justification - Line
      "[jl2]": '<span class="messageLeft">', // Left Justification - Line
      "[jl3]": "</span>", // Center Justification - Line
      "[jl4]": '</span><span class="messageRight">', // Right Justification - Line
      "[jl5]": "", // Full Justification - Line
      "[g61,1,1]": "&lt&lt&ltUnknown&gt&gt&gt<br> &lt&lt&ltGraphic&gt&gt&gt",
      "[pb]": "", // Default Page Background Color
      "[pb0]": "", // Black Page Background Color
      "[cf]": "", // Default Color Foreground
    };
    for (const key in ntcipToHtml) {
      if (ntcipToHtml.hasOwnProperty(key)) {
        const value = ntcipToHtml[key];
        message = message.replace(new RegExp(key, "g"), value);
      }
    }
    if (message === "None") {
      message = "";
    }

    return message;
  }

  public parse_msg_id_list(cms_id: number, xmlQueue: string): Promise<string[]> {
    const msg_id_list: string[] = [];
    return new Promise<string[]>((resolve, reject) => {
      xml2js.parseString(xmlQueue, (error, result) => {
        if (error) {
          console.error("Parsing error:", error);
          reject(error);
        } else {
          const retrievalResp: RetrieveResponse = result as RetrieveResponse;
          if (
            retrievalResp &&
            retrievalResp.retrieveDataResp &&
            retrievalResp.retrieveDataResp.data &&
            retrievalResp.retrieveDataResp.data[0].queueData
          ) {
            const queueArray = retrievalResp.retrieveDataResp.data[0].queueData[0].queue;
            const msgIds: string[] = queueArray
              .flatMap((item) => (item.queueMsg || []).flatMap((queueMsgItem) => queueMsgItem.msgId || []))
              .map((msgId) => msgId || "");
            console.log(msgIds);
            const idItems: IdItem[] = this.convertToIdItems(msgIds);
            for (const item of idItems) {
              const msg_id_text = item._;
              const [cms_id_from_msg, msg_id] = msg_id_text.split(":");

              if (cms_id !== parseInt(cms_id_from_msg)) {
                continue;
              }
              const priority = parseInt(item.$.priority);
              if (priority <= env.MSG_PRIORITY) {
                msg_id_list.push(msg_id_text);
              }
            }

            resolve(msg_id_list);
          } else {
            reject("Invalid XML structure");
          }
        }
      });
    });
  }
  public convertToIdItems(data: any[]): IdItem[] {
    return data.map((item) => {
      return {
        _: item._,
        $: {
          priority: item.$.priority,
          position: item.$.position,
        },
      };
    });
  }
  public async generate_remove_command(security_token: string, cms_id: number, msg_id: string, username: string): Promise<string> {
    const path = require("path");
    const filePath = path.join(__dirname, env.mas_remove_filepath);
    const xmlData = await fs.readFileSync(filePath, "utf-8");
    // Parse the XML data
    const removalTemplate: RemoveMsgRequest = await this.parseXmlAsync(xmlData);
    if (!removalTemplate) {
      throw new Error("XML structure is invalid.");
    }
    if (removalTemplate && removalTemplate.removeMsgReq) {
      removalTemplate.removeMsgReq.refId[0] = username;
      removalTemplate.removeMsgReq.username[0] = username;
      removalTemplate.removeMsgReq.id[0] = cms_id;
      removalTemplate.removeMsgReq.msgId[0] = msg_id;
      removalTemplate.removeMsgReq.securityToken[0] = security_token;
    }
    // Convert the modified data back to XML
    const builder = new Builder();
    const modifiedXml: string = builder.buildObject(removalTemplate);
    await this.sendData(modifiedXml);
    const msg_removal_response: string = await this.readRetrievalData();
    return msg_removal_response;
  }
  public html_to_ntcip_str(message: string): string {
    if (message === "") {
      return message;
    }
    // Need to add center justification to the first line in the message
    message = "[jl3]" + message;
    // Replace all "\n" with "[nl]" for a new line and center justification
    message = message.replace(/\n/g, "[nl][jl3]");
    // If there are multiple pages, add the page transitioning tag
    message = message.replace("[np]", "[np]" + env.CMS_MESSAGE_TRANSITION + "[jl3]");
    // Add the transitioning tag to the first message
    message = env.CMS_MESSAGE_TRANSITION + message;

    return message;
  }
  public async generate_apply_command(security_token: string, cms_id: number, message: string, username: string) {
    const path = require("path");
    const filePath = path.join(__dirname, env.mas_apply_filepath);
    const xmlData = await fs.readFileSync(filePath, "utf-8");
    // Parse the XML data
    const applyMsgTemplate: AddMsgRequest = await this.parseXmlAsync(xmlData);
    console.log(applyMsgTemplate.addMsgReq.id);
    console.log(applyMsgTemplate.addMsgReq.multiMsg);
    if (!applyMsgTemplate) {
      throw new Error("XML structure is invalid.");
    }
    if (applyMsgTemplate && applyMsgTemplate.addMsgReq) {
      applyMsgTemplate.addMsgReq.refId[0] = username;
      applyMsgTemplate.addMsgReq.username[0] = username;
      applyMsgTemplate.addMsgReq.id[0] = cms_id;
      applyMsgTemplate.addMsgReq.multiMsg[0].multiText[0] = message;
      applyMsgTemplate.addMsgReq.securityToken[0] = security_token;
    }
    // Convert the modified data back to XML
    const builder = new Builder();
    const modifiedXml: string = builder.buildObject(applyMsgTemplate);
    await this.sendData(modifiedXml);
    const msg_removal_response: string = await this.readRetrievalData();
    return msg_removal_response;
  }
}
