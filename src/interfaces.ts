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
