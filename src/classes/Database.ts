import mysql from "mysql";
import { Questline, QuestlineXQuest } from "../interfaces";
import settings from "../settings.json";

export default class Database {
  private static connection: mysql.Connection;

  public async connect(): Promise<void> {
    if (Database.connection) {
      console.log(">> DB is already connected.");
      return;
    }

    try {
      Database.connection = mysql.createConnection(settings.database);
      Database.connection.connect();
    } catch (error) {
      throw new Error(error as string);
    }

    console.log("Database connected");
  }

  public async getQuestline(id: number | number[]): Promise<Questline[]> {
    const stmt = `SELECT * FROM ${settings.database.db2}.questline WHERE ROW_ID IN (?) ORDER BY ROW_ID ASC;`;
    return this.runQuery<Questline>(stmt, id);
  }

  public async getQuestlineXQuest(
    questlineId: number | number[]
  ): Promise<QuestlineXQuest[]> {
    const stmt = `SELECT QuestlineId, QuestId, OrderIndex FROM ${settings.database.db2}.questlinexquest WHERE QuestLineId IN (?) ORDER BY QuestlineId, OrderIndex ASC;`;
    return this.runQuery<QuestlineXQuest>(stmt, questlineId);
  }

  public runQuery<T>(
    stmt: string,
    values: number | string | number[] | string[]
  ): Promise<T[]> {
    return new Promise((res, rej) => {
      Database.connection.query(stmt, [values], (err, data) => {
        if (err) rej(err);

        res(data);
      });
    });
  }
}
