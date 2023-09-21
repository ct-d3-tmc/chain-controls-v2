import * as env from "@utils/config.js";
import { Request, Response } from "express";
import fs from "fs";
import multer from "multer";
import path from "path";
import xlsx from "xlsx";

const storage = multer.memoryStorage(); // Use memory storage instead of disk storage
const upload = multer({ storage });
const DATA_DIR = env.getXLSXSavePath();

export const config = {
  api: {
    bodyParser: false, // Disable built-in bodyParser to handle FormData
  },
};

export default async function upload_cc(req: Request, res: Response) {
  try {
    upload.single("excelFile")(req, res, async (error: any) => {
      if (error) {
        console.error(error);
        return res.status(400).json({ error: "File upload failed." });
      }

      if (!req.file) {
        console.error("No file uploaded.");
        return res.status(400).json({ error: "No file uploaded." });
      }

      // Access the uploaded file's buffer
      const buffer = req.file.buffer;

      // Parse the Excel file from the buffer
      const workbook = xlsx.read(buffer, { type: "buffer" });
      const sheetName = workbook.SheetNames[0]; // Assuming it's the first sheet
      const sheet = workbook.Sheets[sheetName];
      console.log(sheet);
      // Access data from the sheet
      let data = xlsx.utils.sheet_to_json(sheet);
      console.log("data" + data);
      // Remove columns with names starting with 'Unnamed'
      data = data.filter((row: any) =>
        Object.keys(row).every((key) => !key.startsWith("Unnamed"))
      );

      // Remove rows that are all blank
      data = data.filter((row: any) =>
        Object.values(row).some((value) => value !== null)
      );

      // Convert data to JSON string
      const jsonStr = JSON.stringify(data);
      console.log("jsonStr" + jsonStr);
      // Export data as CSV
      fs.writeFileSync(path.join(DATA_DIR, `cc_${sheetName}.csv`), jsonStr);

      // Write JSON data to a JSON file
      fs.writeFileSync(path.join(DATA_DIR, "cc.json"), jsonStr);

      // Now 'data' contains the cleaned data from the Excel file
      res.status(200).json({ data });
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
}
