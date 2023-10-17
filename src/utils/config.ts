export const OPER_GET_CURRENT_MSGS = "CMS_Current_Messages";
export const OPER_NEW_CMS_MSGS = "CMS_New_Messages";
export const OPER_CLEAR_CMS_MSGS = "CMS_Clear_Messages";
export const OPER_RETRIEVE_HISTORY = "Retrieve_History";

export const TESTMODE = false; // If True, use a bogus CMS ID/Msg for internal testing
export const TEST_OPERATION = OPER_NEW_CMS_MSGS;

export const DATABUS_SUBSYSTEM = "saa"; // Databus subsystem identifier - static
export const MAS_SUBSYSTEM = "mas"; // MAS subsystem identifier - static
export const DMS_SUBSYSTEM = "dms"; // DMS subsystem identifier - static
export const MSG_PRIORITY: number = 2; // Priority for sign messages. Can be 1-256 but default is 1.

export const SECURITY_TOKEN_TAG = "securityToken";
export const ID_TAG = "id"; // Tag within xml that will need to be updated with cms id
export const MULTITEXT_TAG = "multiText"; // For CMS message to be updated
export const MSG_ID_TAG = "msgId"; // used to check msg priority level and text

export const mas_login_filepath: string = "../data/xml/mas_login.xml";
export const mas_apply_filepath: string = "../data/xml/mas_apply.xml";
export const mas_remove_filepath: string = "../data/xml/mas_remove_message.xml";
export const dms_login_filepath: string = "../data/xml/dms_login.xml";
export const databus_login_filepath: string = "../data/xml/databus_login.xml";

export const retrieve_cms_filepath = "../data/xml/mas_retrieve_cms_queues.xml";
export const write = "../data/getquerydata.txt";

// Sets the cms messages to transition between the 2 messages every 3 seconds
export const CMS_MESSAGE_TRANSITION = "[pt30o0]";

export const getXLSXSavePath = () => {
  if (process.env.NODE_ENV === "production") {
    return process.env.XLSX_SAVE_PATH_PROD;
  } else if (process.env.NODE_ENV === "development") {
    return process.env.XLSX_SAVE_PATH_TEST;
  }

  // Default path or handle other environments as needed
  return "/public/data";
};
