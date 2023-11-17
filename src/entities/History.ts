import * as env from "@utils/config.constant";
import fs from 'fs';
import path from "path";

interface HistoryEntry {
  Epoch: number;
  
}

export  default class History {
  private static readonly HISTORY_JSON_PATH = env.HISTORY_JSON_PATH;
  private static readonly DISPLAY_LENGTH = env.DISPLAY_LENGTH;
  private static readonly MAX_LENGTH = env.MAX_LENGTH;
  private static readonly CHAIN_CONTROL_HISTORY = env.CHAIN_CONTROL_HISTORY;
  filePath = path.join(__dirname, History.HISTORY_JSON_PATH);

  public static create_entry(
    entry_data: any,
    operator_selections: any,
    goldeneye_username: string,
    operator_full_name: string,
    optional_tmcal: any,
    optional_har: any,
    epage: string
  ) :void {
    const now: Date = new Date();
    type Dict = { [key: string]: any };
    // Make sure the new entry is in this order. It should start with Epoch/Date.
    const newEntry: Dict = {
        "Epoch": Math.floor(Date.now() / 1000), 
        "Date": now.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' }),
        "Time": now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        "CMS_Messages": entry_data,
    };

    Object.assign(newEntry, operator_selections);

    if (optional_tmcal) {
        newEntry["TMCAL_Messages"] = optional_tmcal;
    }
    if (optional_har) {
        newEntry["HAR_Messages"] = optional_har;
    }

    newEntry["Owner"] = goldeneye_username;
    newEntry["Operator_Full_Name"] = operator_full_name;
    newEntry["Epage"] = epage;

    console.log(`Creating new history entry: ${JSON.stringify(newEntry)}`);
    History.append(newEntry); 
}
public static append(data: any): void {
  const history = JSON.parse(fs.readFileSync(History.HISTORY_JSON_PATH, 'utf-8'));

  history[History.CHAIN_CONTROL_HISTORY].push(data);

  History.writeJson(history);
}
public static  writeJson(data: any): void {
  const jsonData = JSON.stringify(data, null, 4); 
  fs.writeFileSync(History.HISTORY_JSON_PATH, jsonData, { encoding: 'utf-8' });
}
public static  loadHistory(): any[] {
  const data = fs.readFileSync(History.HISTORY_JSON_PATH, 'utf-8');
  const jsonData = JSON.parse(data);
  return jsonData[History.CHAIN_CONTROL_HISTORY] || []; 
}

public static  maintainLength(): void {
  let history = History.loadHistory();
  if (history.length > History.MAX_LENGTH) {
      history.sort((a:any, b:any) => a.Epoch - b.Epoch); 
      history = history.slice(-History.MAX_LENGTH); 
      History.writeJson(history);
  }
}
public static  getLastNentries(): { Historical_Content: HistoryEntry[] } {
  let history = History.loadHistory();
  history.sort((a, b) => b.Epoch - a.Epoch); 
  const lastNEntries = history.slice(0, History.DISPLAY_LENGTH);
  return { Historical_Content: lastNEntries };
}
}
