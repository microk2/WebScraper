import Database from "./classes/Database";

(async () => {
  const db = new Database();
  await db.connect();
  console.log(await db.getQuestline([1314, 1315, 1316, 1317]));

  process.exit(0);
})();
