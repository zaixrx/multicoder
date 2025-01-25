import { Vector2 } from "./messageTypes";
import DirectoryTree from "../directoryTree";
import Queue from "../queue";

export interface Member {
    id: string;
    mousePositionQueue: Queue<Vector2>;
};

export interface Room {
    id: string;
    members: Member[];
    directoryTree: DirectoryTree;
};