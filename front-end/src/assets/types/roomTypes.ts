import DirectoryTree from "../directoryTree";
import { Color, CursorPosition, CursorSelection } from "./messageTypes";

export interface Member {
  readonly id: string;
  readonly color: Color;
  readonly isOwner: boolean;
  cursorPosition: CursorPosition;
  cursorSelection: CursorSelection;
}

export interface Room {
  readonly id: string;
  currentMember: Member;
  members: Map<string, Member>;
  directoryTree: DirectoryTree;
}
