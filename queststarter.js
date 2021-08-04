const cheerio = require('cheerio');
const fs = require('fs');
const axios = require('axios');
const Scripts = require('./scripts');
const Settings = require('./settings.json');
const CommandLine = require('./classes/CommandLine');

// JS will always return a Promise if the function is async
const getDataForQuestId = async (questId) => {
    try {
        const url = `https://www.wowhead.com/quest=${questId}`;
        const axiosResponse = await axios.get(url)
        const $ = cheerio.load(axiosResponse.data);
        const scriptData = $('script:not([src])'); // A list with all <script> tags from response HTML
        const questName = $('.heading-size-1').text();
        const entities = []; // Stores quest starter/ender id and type (creture/object)
        let index = 0; // This is the index of <script> HTML tag where the info is stored for start/end npc/object
        $(scriptData).each((i, el) => {
            if ($(el.children).text().includes('Start:') || $(el.children).text().includes('End:')) {
                index = i;
                return false; // Break the loop
            }
        })

        const scriptText = $(scriptData[index].children).text();

        // Returns an array of the text from JS script that includes Start:/End:/npc=/object=
        const scriptTextFormatted = scriptText.split(" ").filter((str) => str.includes('npc=') || str.includes('object=') || str.includes('Start:') || str.includes('End:'));

        let isQuestStarter = true;        
        for (const line of scriptTextFormatted) {
            let entityIsObject = false;
    
            if (line.includes('Start:'))
                continue;
    
            if (line.includes('End:')) {
                isQuestStarter = false;
                continue;
            }
    
            if (line.includes('object=')) {
                entityIsObject = true;
            }
    
            // We extract only the numbers from the string
            const entityId = line.replace(/\D/g, '');
            entities.push({
                entityId: entityId,
                isQuestStarter: isQuestStarter,
                isObject: entityIsObject
            })
        }
    
        console.log(`[${questId}] - ${questName}`);
        return {
            questId: questId,
            questName: questName,
            entities: entities
        };
    }  
    catch (err) {
        console.log(err)
    }
}

const generateData = async () => {
    const cmd = new CommandLine(process.argv);
    let questList = [];

    if (cmd.hasOption("-ql")) {
        const questLines = Scripts.intEntries(cmd.getValuesForOption("-ql"));
        
        if (Scripts.isEmpty(questLines)) {
            console.log("No questline ids found after -ql");
            return;
        }
        
        const db = require('./database.js');
        const data = await db.getDataFromDB("SELECT QuestId FROM questlinexquest WHERE QuestLineId IN (?) ORDER BY questlineid, orderindex ASC", questLines);

        for (const itr of data) {
            questList.push(itr.QuestId)
        }

        db.db.end();
    }
    
    if (Scripts.isEmpty(cmd.getOptions())) {
        questList = Scripts.intEntries(cmd.getInput());
    }

    if (Scripts.isEmpty(questList)) {
        console.log('Invalid input arguments');
        return;
    }

    const promises = [];

    const _Date = new Date();
    const sqlDir = Settings.sqlDir;
    const fileName = Scripts.generateFileName("queststarter");
    const filePath = `${sqlDir}/${fileName}`;

    if (!fs.existsSync(sqlDir)) {
        fs.mkdirSync(sqlDir);
        console.log('Created director for sql files.');
    }

    console.log(`\nGetting data from WoWHead for your quests...`)
    for (const questId of questList) {
        promises.push(await getDataForQuestId(questId));
    }
    
    // I don't think we need Promise.allSettled anymore since the promises.push uses await
    Promise.allSettled(promises).then((result) => {
        let failedCount = 0;
        let noDataCount = 0;

        console.log("\nWriting data to SQL file...");
        for (const data of result) {
            if (data.status !== 'fulfilled') {
                console.log(`Fail: ${data.reason}`);
                failedCount++;
                continue;
            }

            if (Scripts.isEmpty(data.value.entities)) {
                console.log(`Quest [${data.value.questId}] - ${data.value.questName} -> no quest starter & ender found. Skipped`);
                noDataCount++;
                continue;
            }

            fs.appendFileSync(filePath, `-- ${data.value.questName}: ${data.value.questId}\n`);
            for (const entity of data.value.entities) {
                const delSQL = `DELETE FROM ${entity.isObject ? 'gameobject' : 'creature'}_${entity.isQuestStarter ? 'queststarter' : 'questender'} WHERE id = ${entity.entityId} AND quest = ${data.value.questId};\n`;
                const insertSQL = `INSERT INTO ${entity.isObject ? 'gameobject' : 'creature'}_${entity.isQuestStarter ? 'queststarter' : 'questender'} (id, quest) VALUES (${entity.entityId}, ${data.value.questId});\n\n`;
                fs.appendFileSync(filePath, delSQL + insertSQL);
            }
        }

        if (failedCount > 0) {
            console.log(`\n\nFailed generating SQL for ${failedCount} quests.`);
        }

        const _EndDate = new Date();            
        console.log(`\nTime spent: ${(_EndDate.getTime() - _Date.getTime()) / 1000} seconds.`);

        if (fs.existsSync(filePath)) {
            console.log(`Generated quest starter/ender for ${questList.length - failedCount - noDataCount} quest(s).`);
            console.log(`Done. Check file ${filePath}`);
        }
        else {
            console.log('No file was created because there is nothing to write in it.')
        }
    })
}

generateData();