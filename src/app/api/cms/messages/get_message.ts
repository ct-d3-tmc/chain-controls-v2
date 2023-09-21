import ActiveITSClient from "@entities/ActiveITSClient";
import * as env from "@utils/config.js";
import fs from "fs";
import { Builder, parseString } from "xml2js";

const api_url: string | undefined = process.env.ACTIVEITS_API_HOSTNAME;
const api_port: string | undefined = process.env.ACTIVEITS_API_PORT;

export default async function get_message(req: Request, res: Response) {
  try {
    const active_client: ActiveITSClient = new ActiveITSClient(
      api_url!,
      Number(api_port)
    );

    // Connect to the client
    await active_client.connect();
    console.log("Connected successfully");

    // Read XML data
    const xmlData = fs.readFileSync(env.mas_login_filepath, "utf-8");

    // Parse the XML data
    const result = await parseXmlAsync(xmlData);

    // Modify the parsed data
    const authenticateReq = result.authenticateReq;

    if (!authenticateReq) {
      throw new Error("XML structure is invalid.");
    }

    authenticateReq.refId[0] = "testuser"; // Need to change
    authenticateReq.username[0] = "testuser"; // Need to change
    active_client.getPassword("testuser").then((password: string) => {
      //need to update
      if (password != "") {
        authenticateReq.password[0] = "password";
        console.log("Password:", password);
      } else {
        console.log("User not found or password is null/undefined.");
      }
    });
    // Convert the modified data back to XML
    const builder = new Builder();
    const modifiedXml: string = builder.buildObject(result);

    // Send the modified data
    const sendDataResult = await active_client.sendData(modifiedXml);
    const mas_security_token: string = await active_client.readData();
    console.log("Data sent successfully:", sendDataResult);
  } catch (error) {
    console.error("Error:", error);
  }
}

// Utility function to parseString from xml2js
function parseXmlAsync(xmlData: string): Promise<any> {
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
