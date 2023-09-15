import { Session } from 'inspector';
import pool from './database_pool';
import net from 'net';
import { Socket } from 'dgram';


export async function get_cms_id_to_ritms_id_dict() {
      const database_connection = pool.request();
      const db_data = await database_connection.query(`
      SELECT
      DMS_NAME,
      SUNGUIDE_ID,
      ID
      FROM
      ODS_DMS_IDS;
      `);  
      const cms_id_to_ritms_id = {} as Record<string, string>;
      db_data.recordset.forEach((entry) => {
        const dms_name = entry.DMS_NAME ;
        const cms_id = dms_name.split(' - ')[0];
        let cms_id_num: number;
  
        try {
            cms_id_num = parseInt(cms_id);
        } catch (error) {
          // Handle the error if needed
          cms_id_num = parseInt(entry.ID) // Default value for invalid ID
        }
  
        cms_id_to_ritms_id[cms_id_num.toString()] = entry.SUNGUIDE_ID.toString();
        
      });
  
} 

export function create_session(){
// Create a socket connection
const session = new net.Socket();
// Connect to the specified host and port
session.connect(config.ACTIVEITS_API_PORT, config.ACTIVEITS_API_HOSTNAME, () => {
 
}); 

return session; 
}
export function destroy_session (api_session:any){
  if (api_session) {
    // Close the socket connection
    api_session.end();
    api_session.destroy();
    console.log('Session closed.');
  }
}

export function login_to_subsystem (session :any, subsystem :String, username :String){

}
export function get_queue_msgs (session:any, token :any, goldeneye_username:String){
    
}
export function generate_apply_command (){
    
}
export function generate_remove_command (security_token:any, cms_id:any, msg_id:any, username:any){
    
}
export function is_cms_out_of_service (){
    
}
export function get_user_password (){
    
}
export function get_current_cms_msgs (){
    
}

export function create_message (){
    
}

export function  send_message(session: Socket, data: string): Buffer {
  return Buffer.alloc(0);;
    
}
export function read_response (){
    
}
export function xml_to_string (){
    
}
export function parse_msg_id_list(cmsId: number, xmlData: Uint8Array): string[] {
return [];
    
}
export function is_travel_time_message (id_num: any, xml_data: any, message: any){
   return true; 
}
export function ntcip_str_to_html (current_msg:any){
    
}
export  function html_to_ntcip_str (){
    
}





 