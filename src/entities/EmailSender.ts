import config from "@utils/config";
import nodemailer from "nodemailer";

class EmailSender {
  private transporter: nodemailer.Transporter;
  private readonly DISABLED: boolean = false;
  private readonly ENVIRONMENT: string = "PRODUCTION";

  private readonly SMTP_HOST: string = config.SMTP_HOST;
  private readonly SMTP_PORT: number = config.SMTP_PORT;
  private readonly TIMEOUT_SECS: number = 30; // Replace with your desired timeout value
  private readonly DEFAULT_EMAIL: string = config.DEFAULT_EMAIL;
  private readonly KINGVALE_EMAIL: string = config.KINGVALE_EMAIL;
  private readonly D3_DISPATCHERS_EMAIL: string =  config.D3_DISPATCHERS_EMAIL!;
  private readonly SEND_TO_TEST_LIST: string[] = ["jared.sun@dot.ca.gov"];
  private readonly BCC_RECIPIENTS_LIST: string[] = ["jared.sun@dot.ca.gov"];

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: this.SMTP_HOST,
      secure: false,
      port: this.SMTP_PORT,
      tls: {
        rejectUnauthorized: false,
      },
    });
  }

  async sendEmail(e_msg: string): Promise<string> {
    if (this.DISABLED) {
      return "Success";
    }

    const from_email = process.env.DEFAULT_EMAIL;
    let to_email_list: string[] = [];

    if (process.env.ENVIRONMENT === "PRODUCTION") {
      if (e_msg.includes("I-80")) {
        to_email_list.push(this.KINGVALE_EMAIL);
      } else if (e_msg.includes("US-50") || e_msg.includes("CA-89")) {
        to_email_list.push(this.D3_DISPATCHERS_EMAIL);
      } else {
        to_email_list.push(this.DEFAULT_EMAIL);
      }
    } else {
      to_email_list.push(...this.SEND_TO_TEST_LIST);
    }
    const subject = e_msg;
    const body_text = e_msg;

    const mailOptions = {
      from: from_email,
      subject: subject,
      text: body_text,
      to: to_email_list.join(", "),
      bcc: this.BCC_RECIPIENTS_LIST.join(", "),
    };

    console.log(
      "Sending email:",
      subject,
      "to",
      to_email_list.join(", "),
      "BCC",
      this.BCC_RECIPIENTS_LIST
    );

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log("Email sent:", info.response);
      return "Success";
    } catch (error) {
      console.error("Email sending failed:", error);
      return "";
    }
  }
}

export default EmailSender;
