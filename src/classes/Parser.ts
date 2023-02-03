import { ParsedDataType, ParsedQuestObject } from "../interfaces";
import fs from "fs";
import FileManager from "./FileManager";

export default class Parser {
  constructor() {
    if (!fs.existsSync(`${FileManager.sqlDirPath}`)) {
      fs.mkdirSync(`${FileManager.sqlDirPath}`);
    }
  }

  public async writeToFile(filePath: string, data: ParsedQuestObject[]): Promise<void> {}
}
