export enum Messages {
    ROOM_JOIN_REQUEST = "roomJoinRequest",
    ROOM_JOIN_RESPONSE = "roomJoinResponse",
    ROOM_JOIN_DECLINED = "roomJoinDecliened",
    ROOM_CREATED = "roomCreated",
    MOUSE_POSITION = "mousePosition",
    KEYS_PRESSED = "keysPressed",
    FILE_CREATED = "fileCreated",
    FILE_SELECTED = "folderCreated",
    FOLDER_CREATED = "folderCreated",
    DIRECTORY_SELECTED = "directorySelected",
};

export type KeyPress = {
    key: string;
    shift: boolean;
};

export type Vector2 = {
    x: number;
    y: number;
}