import { z } from "zod";

const configSchema = z.object({
  SMTP_HOST: z.string().trim().min(1),
  SMTP_PORT: z.coerce.number().int().positive(),
  DEFAULT_EMAIL: z.string().email(),
  KINGVALE_EMAIL: z.string().email(),
  D3_DISPATCHERS_EMAIL: z.string().email(),
  ACTIVEITS_API_HOSTNAME: z.string().trim().min(1),
  ACTIVEITS_API_PORT: z.coerce.number().int().positive(),

  // Example of environment variable with a default value if not set
  OPER_GET_CURRENT_MSGS: z
    .string()
    .optional()
    .transform((val) => val?.trim() || "CMS_Current_Messages"),

  // TODO: implement rest of environment variables
});



const config = configSchema.parse(process.env);


// You can now import config and use its type-checked environment variables
// like config.SMTP_HOST instead of process.env.SMTP_HOST!
export default config;



export const getXLSXSavePath = () => {
  if (process.env.NODE_ENV === "production") {
    return process.env.XLSX_SAVE_PATH_PROD;
  } else if (process.env.NODE_ENV === "development") {
    return process.env.XLSX_SAVE_PATH_TEST;
  }

  // Default path or handle other environments as needed
  return "/public/data";
};
