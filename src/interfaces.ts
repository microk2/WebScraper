import List from "./classes/List";

export interface Questline {
  ROW_ID: number;
  Name: string;
  Description: string;
  QuestId: number;
  PlayerConditionId: number;
}

export interface QuestlineXQuest {
  ROW_ID: number;
  QuestLineId: number;
  QuestId: number;
  OrderIndex: number;
  Flags: number;
}

export interface QuestTemplate {
  ID: number;
  LogTitle: string;
}

export interface QuestlineObject {
  id: number;
  name?: string;
  questIds: List<number>;
}

export interface ParsedQuestObject {
  questId: number;
  questName: string;
  entities: {
    entityId: number;
    isQuestStarter: boolean;
    isObject: boolean;
  }[];
}

export interface ParsedDataType {
  type: ParsedQuestObject[];
}

export interface CreatureTextData {
  entry: number;
  name: string;
  title: string;
  data: {
    id: number;
    text: string;
    type: number;
    soundId: number;
    broadcastId: number;
  }[];
}
