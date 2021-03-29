const _request = require('request');
const cheerio = require('cheerio');
const fs = require('fs');
const { _IntEntries } = require('./Utils');

const generateData = () => {
    const questList = _IntEntries(process.argv.splice(2)[0]);
    const sqlDir = './sqls';
    const promises = [];
    
     // Milliseconds. Required to have a delay between each request
     // Increase the value if the script fails
    const timeoutDelay = 100;
    
    const _Date = new Date();
    const yearMonthDay = `${_Date.getFullYear()}${_Date.getMonth() + 1}${_Date.getDate()}`;
    
    // Not really an UNIX timestamp but we don't need that
    const hourMinutesSeconds = `${_Date.getHours()}${_Date.getMinutes()}${_Date.getSeconds()}`;

    // Create file name
    const fileName = `result_${yearMonthDay}_${hourMinutesSeconds}.sql`;
    const filePath = `${sqlDir}/${fileName}`;

    if (!fs.existsSync(sqlDir)) {
        fs.mkdirSync(sqlDir);
        console.log('Created director for sql files.');
    }
    
    console.log(`Getting data from WoWHead for your quests...`)
    for (const questId of questList) {
        promises.push(new Promise((resolve, reject) => {
            setTimeout(() => {
                _request(`https://www.wowhead.com/quest=${questId}`, (err, res, html) => {
                    if (err) {
                        reject(err);
                    }                    
        
                    if (res && res.statusCode !== 200) {
                        reject(`Access denied. Status code: ${res.statusCode}`);
                    }

                    const $ = cheerio.load(html);
                    const scriptData = $('script:not([src])');
                    const questName = $('.heading-size-1').text();
                    const questStarter = [];
                    const questEnder = [];

                    scriptData.each((index, el) => {
                        if (index === 21) {
                            let isQuestStarter = true;

                            // Get the JS script from HTML <script> tag
                            const scriptText = $(el.children[0]).text();

                            // Returns an array of the text from JS script that includes Start:/End:/npc=/object=
                            const scriptTextFormatted = scriptText.split(" ").filter((str) => str.includes('npc=') || str.includes('object=') || str.includes('Start:') || str.includes('End:'));
                            for (const line of scriptTextFormatted) {
                                if (line.includes('Start:'))
                                    continue;
                
                                if (line.includes('End:')) {
                                    isQuestStarter = false;
                                    continue;
                                }

                                let tableType;
                                if (line.includes('npc=')) {
                                    tableType = 'creature';
                                }
                                else if (line.includes('object=')) {
                                    tableType = 'gameobject';
                                }
                                else {
                                    console.log('The quest starter/ender is not of type creature/gameobject');
                                    continue;
                                }

                                // We extract only the numbers from the string
                                const entityId = line.replace(/\D/g, '');

                                if (isQuestStarter) {
                                    questStarter.push({
                                        entityId: entityId, 
                                        isObject: tableType === 'gameobject' ? true : false
                                    });
                                }
                                else {
                                    questEnder.push({
                                        entityId: entityId, 
                                        isObject: tableType === 'gameobject' ? true : false
                                    })
                                }
                            }

                            console.log(`[${questId}] ${questName}`);
                            resolve({
                                questId: questId,
                                questName: questName,
                                questStarter: questStarter,
                                questEnder: questEnder
                            })
                        }
                    })
                })
            }, questList.indexOf(questId) * timeoutDelay);
        }));
    }
    
    Promise.all(promises).then((result) => {
        for (const data of result) {
            fs.appendFileSync(filePath, `-- ${data.questName}: ${data.questId}\n`);
            for (const entity of data.questStarter) {
                const delSQL = `DELETE FROM ${entity.isObject ? 'gameobject' : 'creature'}_queststarter WHERE id = ${entity.entityId} AND quest = ${data.questId};\n`;
                const insertSQL = `INSERT INTO ${entity.isObject ? 'gameobject' : 'creature'}_queststarter (id, quest) VALUES (${entity.entityId}, ${data.questId});\n\n`;
                fs.appendFileSync(filePath, delSQL + insertSQL);
            }

            for (const entity of data.questEnder) {
                const delSQL = `DELETE FROM ${entity.isObject ? 'gameobject' : 'creature'}_questender WHERE id = ${entity.entityId} AND quest = ${data.questId};\n`;
                const insertSQL = `INSERT INTO ${entity.isObject ? 'gameobject' : 'creature'}_questender (id, quest) VALUES (${entity.entityId}, ${data.questId});\n\n`;
                fs.appendFileSync(filePath, delSQL + insertSQL);
            }
        }

        const _EndDate = new Date();
        console.log(`\n\nGenerated quest starter/ender for ${questList.length} quests.`);
        console.log(`Time spent: ${(_EndDate.getTime() - _Date.getTime()) / 1000} seconds.`);
        console.log(`Done. Check file ${filePath}`);
    })
}

generateData();