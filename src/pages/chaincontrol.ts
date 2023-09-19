import * as activeITS from '@utils/activeITS_api.js';
import * as config from '@utils/config.js';
import { NextApiRequest, NextApiResponse } from 'next';
import { useRouter } from 'next/router';


let operation: any;
let data: any;
let tmcal_data: any;
let goldeneye_username: any;
let har_data:any;
let epage_message:any
let name:any
let received_data :any;
let SERVER_OPERATION:any;
let session: any = null; // Define a variable to store the session



if (config.TESTMODE){
  SERVER_OPERATION = config.TEST_OPERATION  // For Testing Function only
  received_data = {"70": "TESTING"}  // For testing functionality only
}
else{
  // Retrieve the data sent from the client
  received_data = data;
  received_data = JSON.parse(received_data); 
}
  

   



export default async function handler(chaincontrolRequest: NextApiRequest, chaincontrolResponse: NextApiResponse) {
  try {
    const router = useRouter();
    const decodeQueryParam = (param: any) => {
      if (Array.isArray(param)) {
        // Handle an array of strings, if needed
        return param.map(decodeURIComponent);
      } else if (typeof param === 'string') {
        // Handle a single string
        return decodeURIComponent(param);
      } else {
        // Handle other cases, such as undefined
        return '';
      }
    };  
    const queryParams  = Object.fromEntries(
      Object.entries(router.query).map(([key, value]) => [
        key,
        decodeQueryParam(value),
      ])
    );
    operation = queryParams.operation || '';
    data = queryParams.data || '';
    goldeneye_username = queryParams.goldeneye_username || '';
  

    if (operation === config.OPER_GET_CURRENT_MSGS) {
      console.log('Getting messages...');
      await get_messages();

    } else if (operation === config.OPER_CLEAR_CMS_MSGS) {
        clear_messages()

    } else if (operation === config.OPER_CLEAR_CMS_MSGS) {
        push_messages()
    }
     else if (operation === 'dfsdf') {
      const json_data = History.get_last_n_entries();
      chaincontrolResponse.status(200).json(json_data);

    } else {
      // Default: Unknown Operation.
      chaincontrolResponse.status(400).json({ Status: 'Error: Unknown Operation' });
    }
  } catch (error) {
    // Catch ALL exceptions so the client always knows something went wrong.
    const error_msg =
      'An error has occurred. Try again, and if the problem persists, please contact Electrical Systems.';
    console.error('An error has occurred in the main loop:', error);
    chaincontrolResponse.status(500).json({ error: error_msg });
  }
}

const get_messages = () => {  
    
    const res: Record<string, any> = {};
    const [dict_cms_num_to_activeITS_num , xml_queues,mas_security_token]: [any, any, any]= create_session_and_login_to_subsystem();  
  
    // Return the current messages on the cms signs from ActiveITS Database
    // Will return a key value pair of the Caltran's CMS Number and Current Message
    let current_cms_msgs :any;
    let current_msg ;
      current_cms_msgs = activeITS.get_current_cms_msgs();
    for (const cms_id in received_data) {
           current_msg = current_cms_msgs[cms_id.toString()]; 
    //If the message for sign is travel times, if it is then we will NOT return the message. Censoring the travel time.
      if (activeITS.is_travel_time_message(dict_cms_num_to_activeITS_num[cms_id], xml_queues, current_msg)){
        current_msg = ""
       } 
       //Translate the current message with the NTCIP tags to have HTML tags instead
       current_msg = activeITS.ntcip_str_to_html(current_msg)

       //Append the new key value pair to the dictionary response
       res[cms_id.toString()] = current_msg;

      }
      const response = JSON.stringify(res, null, 4);
  }
 

const clear_messages = () => {
 //CLEAR CMS MESSAGES TO ACTIVEITS
  const res: Record<string, any> = {};
  const [dict_cms_num_to_activeITS_num , xml_queues, mas_security_token]: [any, any, any]= create_session_and_login_to_subsystem();
  // We received the cms_numbers:blank from the client lets remove the current messages on the cms signs
  for (const key in received_data) {
    // We need to translate Caltran's CMS # to ActiveITS/Sunguides ID.
    //cms_num_to_id converts Caltran's CMS # (key) to
    //ActiveITS/Sunguide's CMS ID (RITMS_ID).

    const cms_num_to_id:any = activeITS.get_cms_id_to_ritms_id_dict();
    const cms_id = cms_num_to_id[key.toString()];   // return ActiveITS ID
    //  CODE TO DELETE MESSAGES WITH <=(LESS THAN OR EQUAL TO) PRIORITY AND SEND TO ACTIVEITS FOR DELETION
    // Retrieve a list of msgIDs for all messages needing to be deleted for this specific cms.
    const list_msgIDs_delete:any = activeITS.parse_msg_id_list(cms_id, xml_queues)
    for (const item in list_msgIDs_delete) {
      // for every msgID in the list returned lets delete the msg using the
      // cms_id and msgid.
      // Lets generate the XML message to delete the message
      const clear_command:any = activeITS.generate_remove_command(
          mas_security_token, cms_id, item, goldeneye_username
      )
      let response:any;
      if (config.TESTMODE || !config.PUSH_MESSAGES_TO_ACTIVEITS) {
        response = clear_command;
    } else {
        activeITS.send_message(session, clear_command);
        response = "Message removed from  with msgID: " + clear_command;
      //Populate the dict_response to be transmitted back to the client
      res["Deleted_Message_From_CMS#" + key.toString] = response
      
    }
    // END OF CODE TO DELETE <= PRIORITY MESSAGES 

    } 
  }
  //########################### HISTORY MAINTENANCE ############################
  //The client has the feedback now lets log the history into the text file
  History.create_entry(
      RECEIVED_DATA, OPERATOR_SELECTIONS, GOLDENEYE_USERNAME,
      OPERATOR_FULL_NAME, None, None, EPAGE_MESSAGE
  )
  // Lets make sure the history is not more than a certain amount of entries
  History.maintain_history_length()
  //Send email assuming everything went well
  if EPAGE_MESSAGE:
      email_result = send_message(EPAGE_MESSAGE)
      dict_response["EmailResult"] = email_result

  // All messages have been cleared lets now give the client the feedback
  response = json.dumps(dict_response, indent=4)
   //CLOSE THE SOCKET CONNECTION
  api_session.close()

  
};

const push_messages = () => {
    
  };
const create_session_and_login_to_subsystem = (): [any, any, any] =>{
  let dict_cms_num_to_activeITS_num:any;
  dict_cms_num_to_activeITS_num = activeITS.get_cms_id_to_ritms_id_dict() ;
  const api_session = activeITS.create_session();
  setSession(api_session);
  let mas_security_token ;
  try{
    mas_security_token =  activeITS.login_to_subsystem(api_session, config.MAS_SUBSYSTEM, goldeneye_username);
  }    
  catch (error) {
      // Catch ALL exceptions so the client always knows something went wrong.
      const LOGIN_ERROR_MSG =
        'Failed to login to MAS Subsystem")';
      console.error('An error has occurred in the main loop:', error);
      console.log(JSON.stringify({ error: LOGIN_ERROR_MSG }));
      return [null, null, null];

    }
    const xml_queues:any  = activeITS.get_queue_msgs(api_session, mas_security_token, goldeneye_username);
    const textDecoder = new TextDecoder('utf-8');
    const decodedQueue = textDecoder.decode(xml_queues);
    activeITS.destroy_session(api_session);
    return [dict_cms_num_to_activeITS_num, decodedQueue, mas_security_token];
}


// Set the session
function setSession(sessionData: any): void {
    session = sessionData;
}

// Get the session
function getSession(): any {
    return session;
}
//remove session
function removeSession(sessionData: any): void {
  session = null;
}
