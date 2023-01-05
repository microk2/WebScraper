import axios from "axios";
import { CheerioAPI } from "cheerio/lib/load";
import Database from "../classes/Database";
import List from "../classes/List";
import { QuestlineXQuest } from "../interfaces";
import { generateFileName } from "./random";
import fs from "fs";
import FileManager from "../classes/FileManager";
const cheerio: CheerioAPI = require("cheerio").default;

(async () => {
  const db = new Database();
  await db.connect();

  const fileName = generateFileName("queststarter");
  const filePath = `${FileManager.projectDirPath}/sqls/${fileName}`;
  const input: List<string> = new List<string>(process.argv.splice(2));
  const QuestlineObject: { id: number; name?: string; questIds: number[] }[] =
    [];

  if (!fs.existsSync(`${FileManager.buildDirPath}/sqls`)) {
    fs.mkdirSync(`${FileManager.buildDirPath}/sqls`);
    console.log("Created director for sql files.");
  }

  if (input.includes("ql")) {
    for (const questlineId of input.toNumberList().removeDuplicates()) {
      const qlineName: string = (await db.getQuestline(questlineId))[0].Name;
      const data: QuestlineXQuest[] = await db.getQuestlineXQuest(questlineId);
      if (data) {
        QuestlineObject.push({
          id: questlineId,
          name: qlineName,
          questIds: data.map((val) => val.QuestId),
        });
      }
    }
  }

  for (const questline of QuestlineObject) {
    console.log(`>> Questline: ${questline.name} (${questline.id})`);

    fs.appendFileSync(
      filePath,
      `-- ## ${questline.name} (${questline.id}) ##\n`
    );

    const questIdXName: { id: number; name: string }[] = [];
    for (const questId of questline.questIds) {
      const url = `https://www.wowhead.com/quest=${questId}`;
      const axiosResponse = await axios.get(url).catch((err) => {
        throw new Error(err);
      });

      const $ = cheerio.load(axiosResponse.data);
      const scriptData = $("script:not([src])"); // A list with all <script> tags from response HTML
      const questName = $(".heading-size-1").text();
      const entities: {
        entityId: number;
        isQuestStarter: boolean;
        isObject: boolean;
      }[] = [];

      let index = 0; // This is the index of <script> HTML tag where the info is stored for start/end npc/object
      $(scriptData).each((i, el) => {
        if (
          $(el.children).text().includes("Start:") ||
          $(el.children).text().includes("End:")
        ) {
          index = i;
          return false; // Break the loop
        }
      });

      const scriptText = $(scriptData[index].children).text();

      // Returns an array of the text from JS script that includes Start:/End:/npc=/object=
      const scriptTextFormatted = scriptText
        .split(" ")
        .filter(
          (str) =>
            str.includes("npc=") ||
            str.includes("object=") ||
            str.includes("Start:") ||
            str.includes("End:")
        );

      let isQuestStarter = true;
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
        entities.push({
          entityId: entityId,
          isQuestStarter: isQuestStarter,
          isObject: entityIsObject,
        });
      }

      fs.appendFileSync(filePath, `-- ${questName}: ${questId}\n`);
      for (const entity of entities) {
        const delSQL = `DELETE FROM ${
          entity.isObject ? "gameobject" : "creature"
        }_${entity.isQuestStarter ? "queststarter" : "questender"} WHERE id = ${
          entity.entityId
        } AND quest = ${questId};\n`;
        const insertSQL = `INSERT INTO ${
          entity.isObject ? "gameobject" : "creature"
        }_${
          entity.isQuestStarter ? "queststarter" : "questender"
        } (id, quest) VALUES (${entity.entityId}, ${questId});\n\n`;
        fs.appendFileSync(filePath, delSQL + insertSQL);
      }

      questIdXName.push({ id: questId, name: questName });
      console.log(`[${questId}] - ${questName}`);
    }

    fs.appendFileSync(
      filePath,
      `DELETE FROM quests_template_addon WHERE ID IN (${questline.questIds});\nINSERT INTO quest_template_addon (ID, PrevQuestId, NextQuestId, ExclusiveGroup, FromPatch) VALUES \n`
    );

    for (const questObj of questIdXName) {
      const islast: boolean =
        questIdXName.indexOf(questObj) === questIdXName.length - 1;

      fs.appendFileSync(
        filePath,
        `(${questObj.id}, 0, 0, 0, 0)${islast ? ";" : ","} -- ${
          questObj.name
        }\n`
      );
    }

    fs.appendFileSync(filePath, `\n\n`);
  }

  process.exit(0);
})();
