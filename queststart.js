const _request = require('request');
const cheerio = require('cheerio');
const fs = require('fs');

const _IntEntries = (values) => {
    // 1. Create an array by splitting commas from input
    // 2. Convert all elements from the array to Numbers
    // 3. Return an array containing ONLY numbers and numbers > 0
    return values.split(",").map(Number).filter(num => (!isNaN(num) && num > 0))
}

const generateData = () => {
    const questList = _IntEntries(process.argv[2]);
    const timeoutTimer = 500; //Miliseconds
    
    const _Date = new Date();
    const yearMonthDay = `${_Date.getFullYear()}_${_Date.getMonth() + 1}_${_Date.getDate()}`;
    
    // Not really an UNIX timestamp but we don't need that
    const hourMinutesSeconds = `${_Date.getHours()}_${_Date.getMinutes()}_${_Date.getSeconds()}`;

    // Create file name
    const fileName = `result_${yearMonthDay}_${hourMinutesSeconds}`;
    const filePath = `./sqls/${fileName}.sql`;

    for (const i in questList) {
        setTimeout(() => {
            _request(`https://www.wowhead.com/quest=${questList[i]}`, (err, res, html) => {
                if (err)
                    return console.log(err)
    
                if (res.statusCode !== 200)
                    return console.log(`Access denied. Status code: ${res.statusCode}`)
    
                const $ = cheerio.load(html);
                const scriptData = $('script');
                const questName = $('.heading-size-1').text();
                const questStarter = [];
                const questEnder = [];
                scriptData.each((i, el) => {
                    // i = index of all <script> tags. We access position 35 because here is the info we need
                    if (i === 35) {
                        let start = true;
                        const text = $(el.children[0]).text();
                        const textFormatted = text.split(" ").filter((str) => str.includes('npc=') || str.includes('object=') || str.includes('Start:') || str.includes('End:'));
                        for (const itr in textFormatted) {
                            if (textFormatted[itr].includes('Start:'))
                                continue;
            
                            if (textFormatted[itr].includes('End:')) {
                                start = false;
                                continue;
                            }
                            
                            let tableType;
                            if (textFormatted[itr].includes('npc=')) {
                                tableType = 'creature';
                            }
                            else if (textFormatted[itr].includes('object=')) {
                                tableType = 'gameobject';
                            }
            
                            if (start) {
                                questStarter.push({id: textFormatted[itr].replace(/\D/g, ''), isObject: tableType === 'gameobject' ? true : false});
                            }
                            else {
                                questEnder.push({id: textFormatted[itr].replace(/\D/g, ''), isObject: tableType === 'gameobject' ? true : false})
                            }
                        }
                    }
                })
                
                console.log(`QuestID: ${questList[i]}, Starter: ${questStarter.map(v => v.id)}, Ender: ${questEnder.map(v => v.id)}`);
                fs.appendFileSync(filePath, `-- ${questName}: ${questList[i]}\n`);
                for (const itr in questStarter) {
                    const delSQL = `DELETE FROM ${questStarter[itr].isObject ? 'gameobject' : 'creature'}_queststarter WHERE id = ${questStarter[itr].id} AND quest = ${questList[i]};\n`;
                    const insertSQL = `INSERT INTO ${questStarter[itr].isObject ? 'gameobject' : 'creature'}_queststarter (id, quest) VALUES (${questStarter[itr].id}, ${questList[i]});\n\n`;
                    fs.appendFileSync(filePath, delSQL + insertSQL);
                }
    
                for (const itr in questEnder) {
                    const delSQL = `DELETE FROM ${questEnder[itr].isObject ? 'gameobject' : 'creature'}_questender WHERE id = ${questEnder[itr].id} AND quest = ${questList[i]};\n`;
                    const insertSQL = `INSERT INTO ${questEnder[itr].isObject ? 'gameobject' : 'creature'}_questender (id, quest) VALUES (${questEnder[itr].id}, ${questList[i]});\n\n`;
                    fs.appendFileSync(filePath, delSQL + insertSQL);
                }
            })
        }, i * timeoutTimer);
    }

    setTimeout(() => {
        const _EndDate = new Date();
        console.log(`Time spent: ${(_EndDate.getTime() - _Date.getTime()) / 1000} seconds.`);
        console.log(`Done. Check file ${filePath}`);
    }, (questList.length) * timeoutTimer);
}

generateData()