import { ThemedToken } from "shiki";

export abstract class DirectoryTreeNode {
  constructor(
    public parent: FolderNode | undefined,
    public name: string,
    public path: string[]
  ) {}
}

export interface Line {
  content: string;
  tokens: ThemedToken[];
}

export class FileNode extends DirectoryTreeNode {
  public lines: Line[];

  constructor(parent: FolderNode | undefined, name: string) {
    super(parent, name, [...(parent?.path || []), name]);
    this.lines = [{ content: "", tokens: [] }];
  }
}

type Children = {
  [name: string]: DirectoryTreeNode;
};

export class FolderNode extends DirectoryTreeNode {
  public children: Children;

  constructor(parent: FolderNode | undefined, name: string) {
    super(parent, name, [...(parent?.path || []), name]);
    this.children = {};
  }
}

class DirectoryTree {
  public children: Children;
  public entryFile: FileNode | undefined;
  public selectedFile: FileNode | undefined;
  public selectedFolder: FolderNode | undefined;

  constructor() {
    this.children = {};
  }

  nodeExists = (
    container: FolderNode | DirectoryTree,
    name: string
  ): boolean => {
    for (const node in container.children) {
      if (node === name) return true;
    }

    return false;
  };

  appendFileToSelectedDir = (name: string): FileNode | undefined => {
    const selectedDirectory = this.selectedFolder || this;
    const originalName = name;
    let i = 0;
    while (this.nodeExists(selectedDirectory, name)) {
      name = originalName + i++;
    }

    const fileNode = new FileNode(this.selectedFolder, name);
    selectedDirectory.children[name] = fileNode;

    if (!this.entryFile) this.entryFile = fileNode;
    return fileNode;
  };

  appendFolderToSelectedDir = (name: string): FolderNode | undefined => {
    const selectedDirectory = this.selectedFolder || this;
    if (this.nodeExists(selectedDirectory, name)) return undefined;

    selectedDirectory.children[name] = new FolderNode(
      this.selectedFolder,
      name
    );
    return selectedDirectory.children[name] as FolderNode;
  };

  findNode = (path: string[]): DirectoryTreeNode | undefined => {
    if (path.length === 0) return;

    let curr: DirectoryTreeNode = this.children[path[0]],
      i = 1;
    while (curr instanceof FolderNode && i < path.length) {
      curr = curr.children[path[i++]];
    }

    return curr;
  };
}

export function typeOfDirectoryNode(node: DirectoryTreeNode) {
  if (node && typeof node === "object") {
    if (node instanceof FolderNode) return FolderNode;
    else if (node instanceof FileNode) return FileNode;
  }
}

export default DirectoryTree;
