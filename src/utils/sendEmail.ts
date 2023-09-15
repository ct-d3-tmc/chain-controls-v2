
import * as nodemailer from 'nodemailer';

const SMTP_HOST = 'smtp.dot.ca.gov'
const  SMTP_PORT = 25

// Kingvale and D3 dispatcher emails should have Outlook auto-redirect rules to forward messages to the relevant e-page groups.
const KINGVALE_EMAIL = 'KGVA Comm Center <kgva.comm.center@dot.ca.gov>'
const D3_DISPATCHERS_EMAIL = 'Dispatchers D3 <Dispatchers.D3@dot.ca.gov>'

//Do not change this email. If you do, the Kingvale and D3 Dispatcher emails must have their redirect rules updated with the new email.
const DEFAULT_EMAIL = 'D3 Chain Control Automated E-Page <D3ChainControl.EPage@dot.ca.gov>'


const TEST_EMAIL = 'Test CC Email <testcc.emailer@dot.ca.gov>'
const SEND_TO_TEST_LIST = ['jared.sun@dot.ca.gov']
const BCC_RECIPIENTS_LIST = ['jared.sun@dot.ca.gov']
const TIMEOUT_SECS = 15  //Timeout until email send attempt fails

/*#################################################
# Adjust these in production/test environments. #
#################################################*/
const ENVIRONMENT :string= 'TEST'
const  DISABLED = false
//#################################################


export function send_message(epage_message: string): string {
    // Send message using Caltrans's SMTP host. No authentication required.
    if (DISABLED) return "Success";
  
    const from_email: string = DEFAULT_EMAIL;
    let to_email_list: string[] = [];
  
    if (ENVIRONMENT === 'PRODUCTION') {  
      if (epage_message.includes('I-80')) {
        to_email_list = [KINGVALE_EMAIL];
      } else if (epage_message.includes('US-50') || epage_message.includes('CA-89')) {
        to_email_list = [D3_DISPATCHERS_EMAIL];
      } else {
        to_email_list = [DEFAULT_EMAIL];
      }

    } else {
      // Testing/Dev server email list
      const to_email_list: string[] = SEND_TO_TEST_LIST; 
      
    }
    const body_text: string = epage_message;
    const subject: string = epage_message;
    const TIMEOUT_SECS: number = 5000; // adjust the timeout as needed
    // Create a transporter to send emails using SMTP
    const email_format = nodemailer.createTransport({
        host: SMTP_HOST,
        port: SMTP_PORT,
        secure: false, 
    });
    // Create the email message
    const mailOptions = {
        from: from_email,
        to: to_email_list,
        subject: subject,
        text: body_text,
        bcc: BCC_RECIPIENTS_LIST
    };
    // Send the email
    email_format.sendMail(mailOptions, (error, info) => {
        if (error) {
        console.error('Error sending email:', error);
        return `Error: ${error.message}`;
        } else {
        console.log('Email sent:', info.response);
        console.log('Successfully sent email.');
        }
    });   
  
    return "Success"; // Return value as per your logic
  }
  