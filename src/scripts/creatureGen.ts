import CreatureParser from "../classes/CreatureParser";
import Database from "../classes/Database";
import List from "../classes/List";

(async () => {
  const parser = new CreatureParser();
  const db = new Database();
  await db.connect();

  const input: List<string> = new List<string>(process.argv.splice(2));
  const creatureIds: List<number> = input.toNumberList().removeDuplicates();

  const parsedData = await parser.parseCreatureText(creatureIds);
  for (const data of parsedData) {
    console.log(data);
  }

  process.exit(0);
})();
