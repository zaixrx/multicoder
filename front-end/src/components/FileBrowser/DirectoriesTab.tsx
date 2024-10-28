import { useContext, useEffect, useRef, useState } from "react";
import DirectoryTree, { DirectoryTreeNodes, FolderNode } from "./DirectoryTree";
import { ContextMenuContext } from "../ContextMenuWrapper";

function DirectoriesTab() {
  const [showMenu, hideMenu] = useContext(ContextMenuContext);

  const initializedDirectories = useRef<boolean>(false);
  const [directoryTree, setDirectoryTree] = useState<DirectoryTree>(
    new DirectoryTree()
  );

  const [currentDirectory, setCurrentDirectory] = useState<
    FolderNode | undefined
  >();

  useEffect(() => {
    if (initializedDirectories.current) return;

    const _directoryTree: DirectoryTree = {
      ...directoryTree,
    };
    const rootDirectory: FolderNode = _directoryTree.rootNodes[0] as FolderNode;
    const foldersData = ["node_modules", "public", "src"];
    foldersData.forEach((folderName) => rootDirectory.appendFolder(folderName));
    setDirectoryTree(_directoryTree);

    initializedDirectories.current = true;
  }, []);

  function handleNodeClick(node: DirectoryTreeNodes) {
    if (node instanceof FolderNode) setCurrentDirectory(node);
  }

  function createFile(name = "untitled-file") {
    const _directoryTree = { ...directoryTree };
    let parentNodeRefrence = undefined;
    if (currentDirectory) {
      parentNodeRefrence = _directoryTree.findNode(
        currentDirectory.indexes
      ) as FolderNode;
    } else {
      parentNodeRefrence = _directoryTree;
    }
    parentNodeRefrence?.appendFile(name);

    hideMenu();
    setDirectoryTree(_directoryTree);
  }

  function createFolder(name = "untitled-folder") {
    const _directoryTree = { ...directoryTree };
    let parentNodeRefrence = undefined;
    if (currentDirectory) {
      parentNodeRefrence = _directoryTree.findNode(
        currentDirectory.indexes
      ) as FolderNode;
    } else {
      parentNodeRefrence = _directoryTree;
    }
    parentNodeRefrence?.appendFolder(name);

    hideMenu();
    setDirectoryTree(_directoryTree);
  }

  function handleContextMenuTrigger(
    e: React.MouseEvent<HTMLDivElement, MouseEvent>
  ) {
    e.preventDefault();
    showMenu(
      [
        <span onClick={() => createFile()}>Create File</span>,
        <span onClick={() => createFolder()}>Create Folder</span>,
      ],
      { x: e.clientX, y: e.clientY }
    );
  }

  return (
    <div className="fill-vertically" onContextMenu={handleContextMenuTrigger}>
      {currentDirectory ? (
        <>
          <div onClick={() => setCurrentDirectory(currentDirectory.parent)}>
            Back
          </div>
          {currentDirectory.children.map((child, index) => (
            <DirectoryNode
              key={index}
              name={child.name}
              onClick={() => {
                handleNodeClick(child);
              }}
            />
          ))}
        </>
      ) : (
        directoryTree.rootNodes.map((node, index) => (
          <DirectoryNode
            key={index}
            name={node.name}
            onClick={() => {
              handleNodeClick(node);
            }}
          />
        ))
      )}
    </div>
  );
}

function DirectoryNode({ name, onClick }: any) {
  return <div onClick={onClick}>{name}</div>;
}

export default DirectoriesTab;
