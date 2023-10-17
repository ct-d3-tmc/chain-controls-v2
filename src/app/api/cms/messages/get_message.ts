import ActiveITSClient from "@entities/ActiveITSClient";
import ActiveITSDB from "@entities/ActiveITSDB";
import * as env from "@utils/config.js";
import { NextResponse, type NextRequest } from "next/server";

const api_url: string | undefined = process.env.ACTIVEITS_API_HOSTNAME;
const api_port: string | undefined = process.env.ACTIVEITS_API_PORT;

export default async function get_message(req: NextRequest, res: NextResponse) {
  const dict_response: Record<string, string> = {};
  try {
    const active_client: ActiveITSClient = new ActiveITSClient(api_url!, Number(api_port));
    const db_client = ActiveITSDB.getClient();
    const searchParams = req.nextUrl.searchParams;
    const goldeneye_username: string | null = searchParams.get("goldeneye_username");
    const data = searchParams.get("data"); //need to verify data type
    await active_client.connect();
    await db_client.connect();
    try {
      const dict_cms_num_to_activeITS_num: Promise<"" | Record<string, string>> | any = db_client.get_cms_id_to_ritms_id_dict();
      const mas_security_token: string = await active_client.login_to_subsystem(env.DATABUS_SUBSYSTEM, goldeneye_username, db_client);
      const decoded_cml_queues: string = await active_client.get_queue_msgs(mas_security_token, String(goldeneye_username));

      const cms_num_to_current_msg: Promise<"" | Record<string, string>> | any = await db_client.get_current_cms_msgs();
      const RECEIVED_DATA: string = data ? String(data) : "";
      const parsedData = JSON.parse(RECEIVED_DATA);
      let current_msg = "";
      for (const cms_id in parsedData) {
        const key: string = String(cms_id);
        current_msg = cms_num_to_current_msg[key];
        active_client
          .is_travel_time_message(parseInt(dict_cms_num_to_activeITS_num[cms_id]), decoded_cml_queues, current_msg)
          .then((result) => {
            if (result) current_msg = "";
            else {
              current_msg = active_client.translateNTCIPToHTML(current_msg);
              dict_response[String(cms_id)] = current_msg;
              const get_cms_message_response = JSON.stringify(dict_response, null, 4);
              return get_cms_message_response;
            }
          })
          .catch((error) => {
            console.error(error);
          });
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      active_client.close();
      db_client.close();
    }
    return "";
  } catch (error) {
    console.error("Unable to get messages", error);
  }
}
