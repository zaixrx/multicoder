import { ThemedToken } from "shiki";

// User data
interface Line {
  content: string;
  tokens: ThemedToken[];
}

// Directory Tree Specific
enum NodeType {
  FILE_NODE,
  FOLDER_NODE,
}

interface Node {
  type: NodeType;
  name: string;
  path: string[];
}

interface FileNode extends Node {
  lines: Line[];
}

interface FolderNode extends Node {
  children: Record<string, string>;
}

class DirectoryTree {
  public children: Record<string, Node>;

  public entryFile: FileNode | null;
  public selectedFile: FileNode | null;
  public selectedFolder: FolderNode | null;

  constructor() {
    this.children = {};
    this.entryFile = null;
    this.selectedFile = null;
    this.selectedFolder = null;
  }

  joinPath = (path: string[]): string => path.join("/");

  nodeExists = (path: string[]): boolean => {
    return this.children[this.joinPath(path)] ? true : false;
  };

  appendFile = (path: string[]): FileNode | null => {
    const name = path.pop();

    if (!name || (path.length && !this.nodeExists(path))) return null;

    const directory = path.length ? this.getFolder(path) : null;
    path.push(name);

    const file: FileNode = {
      type: NodeType.FILE_NODE,
      name,
      path,
      lines: [{ tokens: [], content: "" }],
    };

    this.children[this.joinPath(path)] = file;
    if (!this.entryFile) this.entryFile = file;

    if (directory) directory.children[name] = name;

    return file;
  };

  appendFolder = (path: string[]): FolderNode | null => {
    const name = path.pop();

    if (!name || (path.length > 1 && !this.nodeExists(path))) return null;

    const directory = path.length ? this.getFolder(path) : null;
    path.push(name);

    const folder: FolderNode = {
      type: NodeType.FOLDER_NODE,
      name,
      path,
      children: {},
    };

    this.children[this.joinPath(path)] = folder;

    if (directory) directory.children[name] = name;

    return folder;
  };

  getNode = (path: string[]): Node | null => {
    return this.children[this.joinPath(path)] || null;
  };

  getFile = (path: string[]): FileNode | null => {
    const file = this.children[this.joinPath(path)];
    return file?.type === NodeType.FILE_NODE ? (file as FileNode) : null;
  };

  getFolder = (path: string[]): FolderNode | null => {
    const folder = this.children[this.joinPath(path)];
    return folder?.type === NodeType.FOLDER_NODE
      ? (folder as FolderNode)
      : null;
  };

  getNodeParent = (path: string[]): string => {
    return path.length >= 2 ? path[path.length - 2] : "";
  };
}

export { type Node, type FileNode, type FolderNode, type Line, NodeType };
export default DirectoryTree;
