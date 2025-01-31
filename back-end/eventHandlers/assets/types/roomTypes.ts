import Queue from "../queue";
import DirectoryTree from "../directoryTree";
import { Color, CursorPosition, CursorSelection, Vector2 } from "./messageTypes";

export interface Member {
    id: string;
    isOwner: boolean,
    cursorPosition: CursorPosition;
    cursorSelection: CursorSelection;
    mousePositionQueue: Queue<Vector2>;
    color: Color;
};

export interface Room {
    id: string;
    members: Member[];
    directoryTree: DirectoryTree;
};