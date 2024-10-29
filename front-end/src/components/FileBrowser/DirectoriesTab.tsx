import { useContext } from "react";
import { DirectoryNode, FileNode, FolderNode } from "./DirectoryTree";
import { ContextMenuContext } from "../ContextMenuWrapper";
import Icon, { IconMode } from "../../common/Icon";
import { RoomContext, RoomContextType } from "../../App";

function DirectoriesTab({ className, ...rest }: { className: string }) {
  const [room, setRoom] = useContext<RoomContextType>(RoomContext);
  const [showMenu, hideMenu] = useContext(ContextMenuContext);

  function handleNodeClick(node: DirectoryNode) {
    const newRoom = { ...room };
    if (node instanceof FolderNode)
      newRoom.directoryTree.currentDirectory = node;
    else if (node instanceof FileNode) newRoom.selectedFile = node;
    setRoom(newRoom);
  }

  function setCurrentDirectory(directory: FolderNode) {
    const newRoom = { ...room };
    newRoom.directoryTree.currentDirectory = directory || newRoom.directoryTree;
    setRoom(newRoom);
  }

  function createFile(name = "") {
    const newRoom = { ...room };
    newRoom.directoryTree.currentDirectory.appendFile(name);

    hideMenu();
    setRoom(newRoom);
  }

  function createFolder(name = "untitled-folder") {
    const newRoom = { ...room };
    newRoom.directoryTree.currentDirectory.appendFolder(name);

    hideMenu();
    setRoom(newRoom);
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
    <div
      className={`fill-vertically ${className}`}
      onContextMenu={handleContextMenuTrigger}
      {...rest}
    >
      {room.directoryTree.currentDirectory instanceof FolderNode && (
        <div
          onClick={() => {
            // nothing much, its just typescript being typtypescript
            setCurrentDirectory(
              (room.directoryTree.currentDirectory as FolderNode)
                .parent as FolderNode
            );
          }}
        >
          Back
        </div>
      )}

      {room.directoryTree.currentDirectory.children.map((child, index) => {
        return (
          <DirectoryNodeWrapper
            selected={room.selectedFile === child}
            key={index}
            name={child.name}
            type={typeOfDirectoryNode(child)}
            onClick={() => handleNodeClick(child)}
          />
        );
      })}
    </div>
  );
}

function typeOfDirectoryNode(node: DirectoryNode) {
  if (node && typeof node === "object") {
    if (node instanceof FolderNode) return FolderNode;
    else if (node instanceof FileNode) return FileNode;
  }
}

function DirectoryNodeWrapper({ selected, type, name, onClick }: any) {
  function getIconName() {
    switch (type) {
      case FolderNode:
        return "/folder.svg";
      case FileNode:
        return "/file.svg";
      default:
        return "/";
    }
  }

  return (
    <div
      className={`d-flex border-2 border-bottom px-2 gap-2 clickable${
        selected ? " selected" : ""
      }`}
      onClick={onClick}
    >
      <Icon name={getIconName()} mode={IconMode.Dark} />
      <span>{name}</span>
    </div>
  );
}

export default DirectoriesTab;
