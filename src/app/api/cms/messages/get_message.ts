import ActiveITSClient from "@entities/ActiveITSClient";
import * as env from "@utils/config.js";
import fs from "fs";
import { useRouter } from "next/router";
import { Builder } from "xml2js";

const api_url: string | undefined = process.env.ACTIVEITS_API_HOSTNAME;
const api_port: string | undefined = process.env.ACTIVEITS_API_PORT;

export default async function get_message(req: Request, res: Response) {
  const router = useRouter();
  try {
    const active_client: ActiveITSClient = new ActiveITSClient(
      api_url!,
      Number(api_port)
    );
    const { epage_message, goldeneye_username, name, operator_inputs, data } =
      router.query;
    // Connect to the client
    await active_client.connect();
    console.log("Connected successfully");

    // Read XML data
    const xmlData = fs.readFileSync(env.mas_login_filepath, "utf-8");

    // Parse the XML data
    const result = await active_client.parseXmlAsync(xmlData);

    // Modify the parsed data
    const authenticateReq = result.authenticateRes;

    if (!authenticateReq) {
      throw new Error("XML structure is invalid.");
    }

    authenticateReq.refId[0] = goldeneye_username; // Need to change
    authenticateReq.username[0] = goldeneye_username; // Need to change
    active_client
      .getPassword(String(goldeneye_username))
      .then((password: string) => {
        //need to update
        if (password != "") {
          authenticateReq.password[0] = password;
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
    const xml_queues = await active_client.get_queue_msgs(
      mas_security_token,
      String(goldeneye_username)
    );
    const decoded_cml_queues = await active_client.readData(); // tested and verified till this.
    active_client.close();
    const cms_num_to_current_msg: Promise<"" | Record<string, string>> =
      active_client.get_current_cms_msgs();
    const RECEIVED_DATA: string = data ? String(data) : "";
    const parsedData = JSON.parse(RECEIVED_DATA);
    for (const cms_id in parsedData) {
      const key: string = String(cms_id);
      // const msg = cms_num_to_current_msg[key];
    }
  } catch (error) {
    console.error("Error:", error);
  }
}
