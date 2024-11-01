import {
  CursorPosition,
  CursorSelection,
} from "../components/Controlled/CodeEditor";

export type DirectoryNode = FolderNode | FileNode;

class DirectoryTreeNode {
  public parent: FolderNode | undefined;
  public indexes: number[];

  constructor(parent: FolderNode | undefined, indexs: number[]) {
    this.parent = parent;
    this.indexes = indexs;
  }
}

export class FileNode extends DirectoryTreeNode {
  public parent: FolderNode | undefined;
  public name: string;
  public content: string[];
  public cursorPosition: CursorPosition;
  public cursorSelection: CursorSelection;

  constructor(parent: FolderNode | undefined, name: string, index: number) {
    super(parent, [...(parent?.indexes || []), index]);
    this.parent = parent;
    this.name = name;
    this.content = ["// write you code here"];
    this.cursorPosition = { line: 0, column: 0 };
    this.cursorSelection = {};
  }
}

export class FolderNode extends DirectoryTreeNode {
  public name: string;
  public children: DirectoryNode[];

  constructor(parent: FolderNode | undefined, name: string, index: number) {
    super(parent, [...(parent?.indexes || []), index]);
    this.name = name;
    this.children = [];
  }

  appendFile = (name: string): FileNode => {
    const fileNode = new FileNode(this, name, this.children.length);
    this.children.push(fileNode);
    return fileNode;
  };

  appendFolder = (name: string): FolderNode => {
    const folderNode = new FolderNode(this, name, this.children.length);
    this.children.push(folderNode);
    return folderNode;
  };
}

class DirectoryTree {
  public selectedFile: FileNode;
  public children: DirectoryNode[];
  public currentDirectory: FolderNode | DirectoryTree;

  constructor() {
    this.children = [];
    this.currentDirectory = this;
    this.selectedFile = {} as FileNode;
  }

  appendFile = (name: string): FileNode => {
    const fileNode = new FileNode(undefined, name, this.children.length);
    this.children.push(fileNode);
    return fileNode;
  };

  appendFolder = (name: string): FolderNode => {
    const folderNode = new FolderNode(undefined, name, this.children.length);
    this.children.push(folderNode);
    return folderNode;
  };

  findNode = (indexes: number[]): DirectoryNode | undefined => {
    if (indexes.length === 1) return this.children[indexes[0]];

    let currentDirectory: FolderNode = this.children[indexes[0]] as FolderNode;
    for (let i = 1; i < indexes.length; i++) {
      if (i + 1 === indexes.length)
        return currentDirectory.children[indexes[i]];

      currentDirectory = currentDirectory.children[indexes[i]] as FolderNode;
    }

    return undefined;
  };
}

export default DirectoryTree;
