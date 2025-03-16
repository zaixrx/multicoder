export enum Messages {
  ROOM_JOIN_REQUEST = "roomJoinRequest",
  ROOM_JOIN_RESPONSE = "roomJoinResponse",
  ROOM_JOIN_DECLINED = "roomJoinDecliened",
  ROOM_CREATED = "roomCreated",
  FILE_CREATED = "fileCreated",
  FILE_SELECTED = "fileSelected",
  FOLDER_CREATED = "folderCreated",
  FOLDER_SELECTED = "folderSelected",
  NODE_NAME_CHANGED = "nodeNameChanged",
  FILE_MEMBER_CURSOR = "fileMemberCursor",
  EXECUTE_CODE = "executeCode",
}

export type KeyPress = {
  key: string;
  shift: boolean;
};

export type Vector2 = {
  x: number;
  y: number;
};

export type CursorPosition = {
  line: number;
  column: number;
};

export type CursorSelection = {
  start: CursorPosition;
  end: CursorPosition;
};

export type MouseClick = {
  type: string;
  position: Vector2;
};

export type Color = {
  r: number;
  g: number;
  b: number;
};
