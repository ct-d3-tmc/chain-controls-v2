import * as env from "@utils/config.constant";
import fs from 'fs';

interface HistoryEntry {
  Epoch: number;
  
}

export class SaveHistory {
  private readonly HISTORY_JSON_PATH = env.HISTORY_JSON_PATH;
  private readonly DISPLAY_LENGTH = env.DISPLAY_LENGTH;
  private readonly MAX_LENGTH = env.MAX_LENGTH;
  private readonly CHAIN_CONTROL_HISTORY = env.CHAIN_CONTROL_HISTORY;
  path = require("path");
  filePath = this.path.join(__dirname, this.HISTORY_JSON_PATH);

  public create_entry(
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
    this.appendToHistory(newEntry); 
}
public appendToHistory(data: any): void {
  const history = JSON.parse(fs.readFileSync(this.HISTORY_JSON_PATH, 'utf-8'));

  history[this.CHAIN_CONTROL_HISTORY].push(data);

  this.write_history_json(history);
}
public write_history_json(data: any): void {
  const jsonData = JSON.stringify(data, null, 4); 
  fs.writeFileSync(this.HISTORY_JSON_PATH, jsonData, { encoding: 'utf-8' });
}
public loadHistory(): any[] {
  const data = fs.readFileSync(this.HISTORY_JSON_PATH, 'utf-8');
  const jsonData = JSON.parse(data);
  return jsonData[this.CHAIN_CONTROL_HISTORY] || []; 
}

public  maintain_history_length(): void {
  let history = this.loadHistory();
  if (history.length > this.MAX_LENGTH) {
      history.sort((a:any, b:any) => a.Epoch - b.Epoch); 
      history = history.slice(-this.MAX_LENGTH); 
      this.write_history_json(history);
  }
}
public get_last_n_entries(): { Historical_Content: HistoryEntry[] } {
  let history = this.loadHistory();
  history.sort((a, b) => b.Epoch - a.Epoch); 
  const lastNEntries = history.slice(0, this.DISPLAY_LENGTH);
  return { Historical_Content: lastNEntries };
}
}
