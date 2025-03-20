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
  content: string[];
}

interface FolderNode extends Node {}

class DirectoryTree {
  private children: Record<string, Node>;

  public entryFile: FileNode | null;

  public selectedFile: FileNode | null;
  public selectedFolder: FolderNode | null;

  constructor() {
    this.children = {};
    this.entryFile = null;
    this.selectedFile = null;
    this.selectedFolder = null;
  }

  joinPath = (path: string[]): string => path && path.join("/");

  nodeExists = (path: string[]): boolean => {
    return this.children[this.joinPath(path)] ? true : false;
  };

  appendFile = (path: string[]): FileNode | null => {
    const name = path.pop();

    if (!name || (path.length > 1 && !this.nodeExists(path))) return null;

    path.push(name);

    const file: FileNode = {
      type: NodeType.FILE_NODE,
      name,
      path,
      content: [""],
    };

    this.children[this.joinPath(path)] = file;
    if (!this.entryFile) this.entryFile = file;

    return file;
  };

  appendFolder = (path: string[]): FolderNode | null => {
    const name = path.pop();

    if (!name || (path.length > 1 && !this.nodeExists(path))) return null;

    path.push(name);

    const folder: FolderNode = {
      type: NodeType.FOLDER_NODE,
      name,
      path,
    };

    this.children[this.joinPath(path)] = folder;

    return folder;
  };

  getNode = (path: string[]): Node | null => {
    return this.children[this.joinPath(path)] || null;
  };
}

export { type FolderNode, type FileNode, NodeType };
export default DirectoryTree;
