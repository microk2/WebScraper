"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mysql_1 = __importDefault(require("mysql"));
const settings_json_1 = __importDefault(require("../settings.json"));
class Database {
    async connect() {
        if (Database.connection) {
            console.log(">> DB is already connected.");
            return;
        }
        try {
            Database.connection = mysql_1.default.createConnection(settings_json_1.default.database);
            Database.connection.connect();
        }
        catch (error) {
            throw new Error(error);
        }
        console.log("Database connected");
    }
    async getQuestline(id) {
        const stmt = `SELECT * FROM ${settings_json_1.default.database.db2}.questline WHERE ROW_ID IN (?) ORDER BY ROW_ID ASC;`;
        return this.runQuery(stmt, id);
    }
    async getQuestlineXQuest(questlineId) {
        const stmt = `SELECT QuestlineId, QuestId, OrderIndex FROM ${settings_json_1.default.database.db2}.questlinexquest WHERE QuestLineId IN (?) ORDER BY QuestlineId, OrderIndex ASC;`;
        return this.runQuery(stmt, questlineId);
    }
    runQuery(stmt, values) {
        return new Promise((res, rej) => {
            Database.connection.query(stmt, [values], (err, data) => {
                if (err)
                    rej(err);
                res(data);
            });
        });
    }
}
exports.default = Database;
