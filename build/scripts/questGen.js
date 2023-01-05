"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const Database_1 = __importDefault(require("../classes/Database"));
const List_1 = __importDefault(require("../classes/List"));
const random_1 = require("./random");
const fs_1 = __importDefault(require("fs"));
const FileManager_1 = __importDefault(require("../classes/FileManager"));
const cheerio = require("cheerio").default;
(async () => {
    const db = new Database_1.default();
    await db.connect();
    const fileName = (0, random_1.generateFileName)("queststarter");
    const filePath = `${FileManager_1.default.buildDirPath}/sqls/${fileName}`;
    const input = new List_1.default(process.argv.splice(2));
    const QuestlineObject = [];
    if (!fs_1.default.existsSync(`${FileManager_1.default.buildDirPath}/sqls`)) {
        fs_1.default.mkdirSync(`${FileManager_1.default.buildDirPath}/sqls`);
        console.log("Created director for sql files.");
    }
    if (input.includes("ql")) {
        for (const questlineId of input.toNumberList().removeDuplicates()) {
            const qlineName = (await db.getQuestline(questlineId))[0].Name;
            const data = await db.getQuestlineXQuest(questlineId);
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
        fs_1.default.appendFileSync(filePath, `-- ## ${questline.name} (${questline.id}) ##\n`);
        const questIdXName = [];
        for (const questId of questline.questIds) {
            const url = `https://www.wowhead.com/quest=${questId}`;
            const axiosResponse = await axios_1.default.get(url).catch((err) => {
                throw new Error(err);
            });
            const $ = cheerio.load(axiosResponse.data);
            const scriptData = $("script:not([src])"); // A list with all <script> tags from response HTML
            const questName = $(".heading-size-1").text();
            const entities = [];
            let index = 0; // This is the index of <script> HTML tag where the info is stored for start/end npc/object
            $(scriptData).each((i, el) => {
                if ($(el.children).text().includes("Start:") ||
                    $(el.children).text().includes("End:")) {
                    index = i;
                    return false; // Break the loop
                }
            });
            const scriptText = $(scriptData[index].children).text();
            // Returns an array of the text from JS script that includes Start:/End:/npc=/object=
            const scriptTextFormatted = scriptText
                .split(" ")
                .filter((str) => str.includes("npc=") ||
                str.includes("object=") ||
                str.includes("Start:") ||
                str.includes("End:"));
            let isQuestStarter = true;
            for (const line of scriptTextFormatted) {
                let entityIsObject = false;
                if (line.includes("Start:"))
                    continue;
                if (line.includes("End:")) {
                    isQuestStarter = false;
                    continue;
                }
                if (line.includes("object=")) {
                    entityIsObject = true;
                }
                // We extract only the numbers from the string
                const entityId = parseInt(line.replace(/\D/g, ""));
                entities.push({
                    entityId: entityId,
                    isQuestStarter: isQuestStarter,
                    isObject: entityIsObject,
                });
            }
            fs_1.default.appendFileSync(filePath, `-- ${questName}: ${questId}\n`);
            for (const entity of entities) {
                const delSQL = `DELETE FROM ${entity.isObject ? "gameobject" : "creature"}_${entity.isQuestStarter ? "queststarter" : "questender"} WHERE id = ${entity.entityId} AND quest = ${questId};\n`;
                const insertSQL = `INSERT INTO ${entity.isObject ? "gameobject" : "creature"}_${entity.isQuestStarter ? "queststarter" : "questender"} (id, quest) VALUES (${entity.entityId}, ${questId});\n\n`;
                fs_1.default.appendFileSync(filePath, delSQL + insertSQL);
            }
            questIdXName.push({ id: questId, name: questName });
            console.log(`[${questId}] - ${questName}`);
        }
        fs_1.default.appendFileSync(filePath, `DELETE FROM quests_template_addon WHERE ID IN (${questline.questIds});\nINSERT INTO quest_template_addon (ID, PrevQuestId, NextQuestId, ExclusiveGroup, FromPatch) VALUES \n`);
        for (const questObj of questIdXName) {
            fs_1.default.appendFileSync(filePath, `(${questObj.id}, 0, 0, 0, 0), -- ${questObj.name}\n`);
        }
        fs_1.default.appendFileSync(filePath, `\n\n`);
    }
    process.exit(0);
})();
