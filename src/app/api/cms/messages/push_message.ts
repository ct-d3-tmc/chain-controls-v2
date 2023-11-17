import ActiveITSClient from "@entities/ActiveITSClient";
import ActiveITSDB from "@entities/ActiveITSDB";
import EmailSender from "@entities/EmailSender";
import History from "@entities/History";
import config from "@utils/config";
import * as constants from "@utils/config.constant";
import { NextResponse, type NextRequest } from "next/server";

const api_url = config.ACTIVEITS_API_HOSTNAME;
const api_port= config.ACTIVEITS_API_PORT;

export default async function get_message(req: NextRequest, res: NextResponse) {
  const dict_response: Record<string, string> = {};
  try {
    const active_client: ActiveITSClient = new ActiveITSClient(api_url!, Number(api_port));
    const db_client = ActiveITSDB.getClient();
    const emailService: EmailSender = new EmailSender();
    const searchParams = req.nextUrl.searchParams;
    const goldeneye_username: string | null = searchParams.get("goldeneye_username");
    const operator_selection: string | null = searchParams.get("operator_inputs");
    const operator_full_name: string | null = searchParams.get("name");
    const data = searchParams.get("data");
    const epage_message = searchParams.get("epage_message");
    const tm_data = searchParams.get("tmcal_data"); //need to verify data type
    const h_data = searchParams.get("har_data");
    await active_client.connect();
    await db_client.connect();
    try {
      const dict_cms_num_to_activeITS_num: Promise<"" | Record<string, string>> | any = db_client.get_cms_id_to_ritms_id_dict();
      const mas_security_token: string = await active_client.login_to_subsystem(constants.DATABUS_SUBSYSTEM, goldeneye_username, db_client);
      const decoded_cml_queues: string = await active_client.get_queue_msgs(mas_security_token, String(goldeneye_username));
      const tmcal_messages: Record<string, string> = JSON.parse(tm_data!);
      const har_messages: Record<string, string> = JSON.parse(h_data!);

      const RECEIVED_DATA: string = data ? String(data) : "";
      const parsedData = JSON.parse(RECEIVED_DATA);
      let current_msg = "";
      for (const key in parsedData) {
        const cms_id: number = dict_cms_num_to_activeITS_num.get(String(key));
        if (await db_client.is_cms_out_of_service(key)) {
          console.log("Skipping CMS because it is out of service" + key);
          continue;
        }
        const list_msgIDs_delete = await active_client.parse_msg_id_list(cms_id, decoded_cml_queues);
        for (const item of list_msgIDs_delete) {
          const clear_command = await active_client.generate_remove_command(mas_security_token, cms_id, item, String(goldeneye_username));
          dict_response["Deleted_Message_From_CMS#" + String(key)] = clear_command;
        }
        let new_msg_str: any = parsedData[key];
        if (new_msg_str === undefined || new_msg_str === "") continue;
        new_msg_str = active_client.html_to_ntcip_str(new_msg_str);
        const generated_message = await active_client.generate_apply_command(
          mas_security_token,
          cms_id,
          new_msg_str,
          String(goldeneye_username)
        );
        dict_response["Adding_Message_To_CMS#" + String(key)] = generated_message;
        if (epage_message) {
          const email_result = await emailService.sendEmail(epage_message);
          dict_response["EmailResult"] = email_result;
          const push_cms_message_response = JSON.stringify(dict_response, null, 4);
           History.create_entry( // working on history
            RECEIVED_DATA,
            operator_selection,
            goldeneye_username!,
            operator_full_name!,
            tmcal_messages,
            har_messages,
            epage_message
          );
          History.maintainLength();
        }
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      active_client.close();
      db_client.close();
    }
  } catch (error) {
    console.error("Unable to push messages", error);
  }
}
