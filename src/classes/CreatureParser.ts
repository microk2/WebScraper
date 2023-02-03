import axios from "axios";
import { CreatureTextData, ParsedQuestObject } from "../interfaces";
import List from "./List";
import Parser from "./Parser";
import { CheerioAPI } from "cheerio/lib/load";
import Database from "./Database";

const cheerio: CheerioAPI = require("cheerio").default;

export default class CreatureParser extends Parser {
  constructor() {
    super();
  }

  public async parseCreatureText(entries: List<number>): Promise<CreatureTextData[]> {
    const data: CreatureTextData[] = [];
    const textTypeXValue = {
      s1: { id: 14, text: "yells:" }, // Yell
      s2: { id: 12, text: "says:" }, // Say
      s3: { id: 15, text: "whispers:" }, // Whisper
    };

    for (const entry of entries) {
      const url = `https://www.wowhead.com/npc=${entry}`;
      const axiosResponse = await axios.get(url).catch((err) => {
        throw new Error(err);
      });

      const $ = cheerio.load(axiosResponse.data);
      const quotesList = $(".text div#wougfh349t ul").children();
      let creatureName = $(".text .heading-size-1").text();
      let creatureTitle = "";

      if (creatureName.includes("<") || creatureName.includes(">")) {
        creatureTitle = creatureName.slice(creatureName.indexOf("<"), creatureName.length);
        creatureName = creatureName.slice(0, creatureName.indexOf("<") - 1);
      }

      const textCreature: CreatureTextData = {
        entry: entry,
        name: creatureName,
        title: creatureTitle,
        data: [],
      };

      for (const quote of quotesList) {
        const textElem = $(quote).children("div").children("span");
        const textType: string | undefined = $(quote).children("div").children("span").attr("class") || "s2"; // default is s2 (say) in case there is any unhandled type
        const typeObj = Object.entries(textTypeXValue).find((o) => o[0] == textType)![1];
        const textTypeNumber: number = typeObj.id;
        const text: string = textElem.text().replace(`${creatureName} ${typeObj.text} `, "");

        let soundLink: string | undefined = $(quote).children("div").children("span").children("a").attr("href");
        let soundId: number = 0;
        let broadcastId: number = 0;

        if (soundLink) {
          soundLink = soundLink.replace("/sound=", "");
          soundLink = soundLink.slice(0, soundLink.indexOf("/"));
          soundId = parseInt(soundLink);
        }

        if (soundId) {
          const db = new Database();
          broadcastId = Object.values((await db.getBroadcastIdForSoundId(soundId))[0])[0];
        }

        const id: number = quotesList.index(quote);
        textCreature.data.push({
          id: id,
          text: text,
          type: textTypeNumber,
          soundId: soundId,
          broadcastId: broadcastId,
        });
      }

      data.push(textCreature);
    }

    console.log(data);

    return data;
  }

  public override async writeToFile(filePath: string, data: ParsedQuestObject[]): Promise<void> {}
}
