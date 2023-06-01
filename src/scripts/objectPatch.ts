import { CheerioAPI } from "cheerio/lib/load";
import axios from "axios";

const cheerio: CheerioAPI = require("cheerio").default;

(async () => {
  const creatureIds: Set<number> = new Set();
  const zones: number[] = [
    13644, 13646, 13647, 13645, 14022, 14433, 13642, 14620, 13643,
  ];

  for (const entry of zones) {
    const url: string = `https://www.wowhead.com/npcs?filter=6:13;${entry}:3;0:100005`;
    // const url: string = `https://www.wowhead.com/objects?filter=1:6;${entry}:3;0:100000`;

    const axiosResponse = await axios.get(url).catch((err) => {
      throw new Error(err);
    });

    const $ = cheerio.load(axiosResponse.data);
    const listString: string = $("script:contains('new Listview')")
      .text()
      .replace("new Listview(", "")
      .replace(`,"extraCols":[Listview.extraCols.popularity]`, "")
      .replace(`);`, "");

    if (listString.length == 0) {
      console.log(`-> No data found for zoneId: ${entry}`);
      continue;
    }

    console.log(`-> Parsing data for zoneId: ${entry}`);
    const object = JSON.parse(listString);

    if (!object.data || object.data.length === 0) {
      console.log("-> No data object");
      continue;
    }

    if (object.data.length > 1000) {
      console.log(
        `-> There are more than 1000 entries found for zoneId: ${entry} (WoWHead limit)`
      );
    }

    object.data.forEach((e: any) => {
      creatureIds.add(e.id);
    });
  }

  console.log(
    `UPDATE gameobject_template SET FromPatch = 1010 WHERE entry IN (${Array.from(
      creatureIds
    )});`
  );

  console.log(`-> Found ${creatureIds.size} entries.`);
})();
