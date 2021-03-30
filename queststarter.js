const cheerio = require('cheerio');
const fs = require('fs');
const { _IntEntries } = require('./Utils');
const axios = require('axios');

const getDataForQuestId = async (questId) => {
    const url = `https://www.wowhead.com/quest=${questId}`;
    const axiosResponse = await axios.get(url, {timeout: 0})
    const $ = cheerio.load(axiosResponse.data);

    const scriptData = $('script:not([src])'); // A list with all <script> tags from response HTML
    const questName = $('.heading-size-1').text();
    const entities = []; // Stores quest starter/ender id and type (creture/object)
    const index = 21; // This is the index of <script> HTML tag where the info is stored for start/end npc/object
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

    console.log(`[${questId}] - ${questName}`)
    return {
        questId: questId,
        questName: questName,
        entities: entities
    }
}

const generateData = () => {
    const questList = _IntEntries(process.argv.splice(2)[0]);
    if (questList.length === 0) {
        console.log('Invalid input arguments');
        return;
    }

    const sqlDir = './sqls';
    const promises = [];

    const _Date = new Date();
    const yearMonthDay = `${_Date.getFullYear()}${_Date.getMonth() + 1}${_Date.getDate()}`;
    
    // Not really an UNIX timestamp but we don't need that
    const hourMinutesSeconds = `${_Date.getHours()}${_Date.getMinutes()}${_Date.getSeconds()}`;

    // Create file name
    const fileName = `queststarter_${yearMonthDay}_${hourMinutesSeconds}.sql`;
    const filePath = `${sqlDir}/${fileName}`;

    if (!fs.existsSync(sqlDir)) {
        fs.mkdirSync(sqlDir);
        console.log('Created director for sql files.');
    }

    console.log(`\nGetting data from WoWHead for your quests...`)
    for (const questId of questList) {
        promises.push(getDataForQuestId(questId));
    }

    Promise.allSettled(promises).then((result) => {
        let failed = 0;
        for (const data of result) {
            if (data.status !== 'fulfilled') {
                console.log(`Fail: ${data.reason.config.url}`)
                failed++;
                continue;
            }

            fs.appendFileSync(filePath, `-- ${data.value.questName}: ${data.value.questId}\n`);
            for (const entity of data.value.entities) {
                const delSQL = `DELETE FROM ${entity.isObject ? 'gameobject' : 'creature'}_${entity.isQuestStarter ? 'queststarter' : 'questender'} WHERE id = ${entity.entityId} AND quest = ${data.value.questId};\n`;
                const insertSQL = `INSERT INTO ${entity.isObject ? 'gameobject' : 'creature'}_${entity.isQuestStarter ? 'queststarter' : 'questender'} (id, quest) VALUES (${entity.entityId}, ${data.value.questId});\n\n`;
                fs.appendFileSync(filePath, delSQL + insertSQL);
            }
        }

        if (failed > 0) {
            console.log(`\n\nFailed generating SQL for ${failed} quests.`);
        }

        const _EndDate = new Date();            
        console.log(`\nGenerated quest starter/ender for ${questList.length - failed} quest(s).`);
        console.log(`Time spent: ${(_EndDate.getTime() - _Date.getTime()) / 1000} seconds.`);
        console.log(`Done. Check file ${filePath}`);
    })
}
generateData();