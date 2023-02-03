import { ParsedQuestObject } from "../interfaces";
import Parser from "./Parser";
import fs from "fs";
import List from "./List";
import axios from "axios";
import { CheerioAPI } from "cheerio/lib/load";

const cheerio: CheerioAPI = require("cheerio").default;

export default class QuestParser extends Parser {
  constructor() {
    super();
  }

  public async parseQuestStarters(questIds: List<number>): Promise<ParsedQuestObject[]> {
    const entities: ParsedQuestObject[] = [];

    for (const questId of questIds) {
      const url = `https://www.wowhead.com/quest=${questId}`;
      const axiosResponse = await axios.get(url).catch((err) => {
        throw new Error(err);
      });

      const $ = cheerio.load(axiosResponse.data);
      const scriptData = $("script:not([src])"); // A list with all <script> tags from response HTML
      const questName = $(".heading-size-1").text();

      let index = 0; // This is the index of <script> HTML tag where the info is stored for start/end npc/object
      $(scriptData).each((i: number, el) => {
        if ($(el.children).text().includes("Start:") || $(el.children).text().includes("End:")) {
          index = i;
          return false; // Break the loop
        }
      });

      const scriptText = $(scriptData[index].children).text();

      // Returns an array of the text from JS script that includes Start:/End:/npc=/object=
      const scriptTextFormatted = scriptText
        .split(" ")
        .filter(
          (str: string) =>
            str.includes("npc=") || str.includes("object=") || str.includes("Start:") || str.includes("End:")
        );

      let isQuestStarter = true;

      const questData: ParsedQuestObject = {
        questId: questId,
        questName: questName,
        entities: [],
      };

      for (const line of scriptTextFormatted) {
        let entityIsObject = false;

        if (line.includes("Start:")) continue;

        if (line.includes("End:")) {
          isQuestStarter = false;
          continue;
        }

        if (line.includes("object=")) {
          entityIsObject = true;
        }

        // We extract only the numbers from the string
        const entityId: number = parseInt(line.replace(/\D/g, ""));
        questData.entities.push({
          entityId: entityId,
          isQuestStarter: isQuestStarter,
          isObject: entityIsObject,
        });
      }

      entities.push(questData);
      console.log(`[${questId}] - ${questName}`);
    }

    return entities;
  }

  public override async writeToFile(filePath: string, data: ParsedQuestObject[]): Promise<void> {
    for (const qdata of data) {
      fs.appendFileSync(filePath, `-- ${qdata.questName}: ${qdata.questId}\n`);

      if (!qdata.entities.length) {
        fs.appendFileSync(filePath, `-- No data found.\n\n`);
        continue;
      }

      for (const entity of qdata.entities) {
        const delSQL = `DELETE FROM ${entity.isObject ? "gameobject" : "creature"}_${
          entity.isQuestStarter ? "queststarter" : "questender"
        } WHERE id = ${entity.entityId} AND quest = ${qdata.questId};\n`;

        const insertSQL = `INSERT INTO ${entity.isObject ? "gameobject" : "creature"}_${
          entity.isQuestStarter ? "queststarter" : "questender"
        } (id, quest) VALUES (${entity.entityId}, ${qdata.questId});\n\n`;

        fs.appendFileSync(filePath, delSQL + insertSQL);
      }
    }

    fs.appendFileSync(filePath, `DELETE FROM quest_template_addon WHERE ID IN (${data.map((d) => d.questId)});\n`);

    fs.appendFileSync(
      filePath,
      `INSERT INTO quest_template_addon (ID, PrevQuestId, NextQuestId, ExclusiveGroup, FromPatch) VALUES\n`
    );

    for (const qdata of data) {
      const isLast: boolean = data.indexOf(qdata) === data.length - 1;
      fs.appendFileSync(filePath, `(${qdata.questId}, 0, 0, 0, 0)${isLast ? ";" : ","} -- ${qdata.questName}\n`);
    }

    fs.appendFileSync(filePath, `\n/*\n\t============ PHASE ============\n*/\n`);

    fs.appendFileSync(filePath, `\n/*\n\t============  PHASE END ============\n*/\n`);

    for (const qdata of data) {
      fs.appendFileSync(filePath, `\n/*\n\tQuest: ${qdata.questName} (${qdata.questId})\n*/\n`);
    }

    fs.appendFileSync(filePath, `\n/*\n\t============ UPDATES ============\n*/`);
  }
}
