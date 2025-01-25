import { Vector2 } from "./messageTypes";
import DirectoryTree from "../directoryTree";
import Queue from "../queue";

export interface Member {
    id: string;
    mousePositionBuffer: Queue<Vector2>;
};

export interface Room {
    id: string;
    members: Member[];
    directoryTree: DirectoryTree;
};