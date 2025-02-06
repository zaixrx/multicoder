import DirectoryTree from "../directoryTree";
import { Color, CursorPosition, CursorSelection } from "./messageTypes";

export interface Member {
  readonly id: string;
  readonly isOwner: boolean;
  readonly color: Color;
  cursorPosition: CursorPosition;
  cursorSelection: CursorSelection;
}

export interface Room {
  readonly id: string;
  members: Member[];
  directoryTree: DirectoryTree;
}
