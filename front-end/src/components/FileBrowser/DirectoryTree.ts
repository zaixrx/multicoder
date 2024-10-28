export type DirectoryTreeNodes = FolderNode | FileNode;

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

  constructor(parent: FolderNode | undefined, name: string, index: number) {
    super(parent, [...(parent?.indexes || []), index]);
    this.parent = parent;
    this.name = name;
  }
}

export class FolderNode extends DirectoryTreeNode {
  public name: string;
  public children: DirectoryTreeNodes[];

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
  public rootNodes: DirectoryTreeNodes[];

  constructor(rootFolderName = "main") {
    let intialRootNode = new FolderNode(undefined, rootFolderName, 0);
    this.rootNodes = [intialRootNode];
  }

  appendFile = (name: string): FileNode => {
    const fileNode = new FileNode(undefined, name, this.rootNodes.length);
    this.rootNodes.push(fileNode);
    return fileNode;
  };

  appendFolder = (name: string): FolderNode => {
    const folderNode = new FolderNode(undefined, name, this.rootNodes.length);
    this.rootNodes.push(folderNode);
    return folderNode;
  };

  findNode = (indexes: number[]): DirectoryTreeNodes | undefined => {
    if (indexes.length === 1) return this.rootNodes[indexes[0]];

    let currentDirectory: FolderNode = this.rootNodes[indexes[0]] as FolderNode;
    for (let i = 1; i < indexes.length; i++) {
      if (i + 1 === indexes.length)
        return currentDirectory.children[indexes[i]];

      currentDirectory = currentDirectory.children[indexes[i]] as FolderNode;
    }

    return undefined;
  };
}

export default DirectoryTree;
