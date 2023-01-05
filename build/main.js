"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Database_1 = __importDefault(require("./classes/Database"));
(async () => {
    const db = new Database_1.default();
    await db.connect();
    console.log(await db.getQuestline([1314, 1315, 1316, 1317]));
    process.exit(0);
})();
