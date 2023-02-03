import { CheerioAPI } from "cheerio/lib/load";
import Database from "../classes/Database";
import List from "../classes/List";
import { ParsedQuestObject, Questline, QuestlineObject, QuestlineXQuest } from "../interfaces";
import fs from "fs";
import FileManager from "../classes/FileManager";
import { generateFileName } from "./random";
import QuestParser from "../classes/QuestParser";

const cheerio: CheerioAPI = require("cheerio").default;

(async () => {
  const qparser = new QuestParser();
  const db = new Database();
  await db.connect();

  if (!fs.existsSync(`${FileManager.sqlDirPath}`)) {
    fs.mkdirSync(`${FileManager.sqlDirPath}`);
  }

  const QuestLineObject: QuestlineObject[] = [];
  const questIdList: List<number> = new List<number>();
  const input: List<string> = new List<string>(process.argv.splice(2));

  if (input.includes("-ql")) {
    for (const questlineId of input.toNumberList().removeDuplicates()) {
      const qline: Questline = (await db.getQuestline(questlineId))[0];
      if (!qline) {
        console.log(`\n>> QuestlineID ${questlineId} not found in Questline db2.`);
        continue;
      }

      const data: QuestlineXQuest[] = await db.getQuestlineXQuest(questlineId);
      if (!data) {
        console.log(`>> No QuestlineXQuest data found for questlineid ${questlineId} in db2.`);
        continue;
      }

      QuestLineObject.push({
        id: questlineId,
        name: qline.Name,
        questIds: new List<number>(data.map((val) => val.QuestId)).removeDuplicates(),
      });
    }
  } else {
    questIdList.push(...input.toNumberList().removeDuplicates());
  }

  if (QuestLineObject.length) {
    for (const questlineData of QuestLineObject) {
      const filePath: string = `${FileManager.sqlDirPath}/questline_${questlineData.id}.sql`;
      fs.writeFileSync(filePath, `/*\n\tQuestline: ${questlineData.name} (${questlineData.id})\n*/\n\n`);

      console.log(`>> Questline ${questlineData.name} (${questlineData.id})`);

      const questParsedData: ParsedQuestObject[] = await qparser.parseQuestStarters(questlineData.questIds);

      qparser.writeToFile(filePath, questParsedData);
    }
  }

  if (questIdList.length) {
    const filePath: string = `${FileManager.sqlDirPath}/${generateFileName("questlist")}`;

    const questParsedData: ParsedQuestObject[] = await qparser.parseQuestStarters(questIdList);

    qparser.writeToFile(filePath, questParsedData);
  }

  process.exit(0);
})();
