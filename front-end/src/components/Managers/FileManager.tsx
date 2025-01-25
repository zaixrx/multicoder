import { useContext } from "react";
import DirectoryTree, {
  DirectoryNode,
  FileNode,
  FolderNode,
} from "../../assets/directoryTree";
import { ContextMenuContext } from "../ContextMenuWrapper";
import Icon from "../../common/Icon";

type FileManagerProps = {
  directoryTree: DirectoryTree;
  appendFile: (fileName: string) => FileNode;
  appendFolder: (folderName: string) => FolderNode;
  setSelectedFile: (fileToSelect: FileNode) => void;
  setCurrentDirectory: (directory: FolderNode) => void;
};

function FileManager({
  directoryTree,
  appendFile,
  appendFolder,
  setSelectedFile,
  setCurrentDirectory,
}: FileManagerProps) {
  const [showMenu, hideMenu] = useContext(ContextMenuContext);

  function createFileInCurrentDirectory(name: string) {
    appendFile(name);
    hideMenu();
  }

  function createFolderInCurrentDirectory(name: string) {
    appendFolder(name);
    hideMenu();
  }

  function handleContextMenuTrigger(
    e: React.MouseEvent<HTMLDivElement, MouseEvent>
  ) {
    e.preventDefault();
    showMenu(
      [
        <span onClick={() => createFileInCurrentDirectory("untitled.js")}>
          Create File
        </span>,
        <span onClick={() => createFolderInCurrentDirectory("untitled")}>
          Create Folder
        </span>,
      ],
      { x: e.clientX, y: e.clientY }
    );
  }

  function selectDirectoryNode(directoryNode: DirectoryNode) {
    switch (typeOfDirectoryNode(directoryNode)) {
      case FolderNode:
        setCurrentDirectory(directoryNode as FolderNode);
        break;

      case FileNode:
        setSelectedFile(directoryNode as FileNode);
        break;
    }
  }

  return (
    <div
      className="fill-vertically fill-screen-vertically dir-tab"
      onContextMenu={handleContextMenuTrigger}
    >
      <section className="d-flex gap-1 px-1 align-items-center justify-content-end">
        <button onClick={() => createFileInCurrentDirectory("untitled.js")}>
          <Icon name="new-file.svg" width={20} />
        </button>

        <button onClick={() => createFolderInCurrentDirectory("untitled")}>
          <Icon name="new-folder.svg" width={20} />
        </button>
      </section>

      {directoryTree.selectedDirectory instanceof FolderNode && (
        <div
          className="d-flex gap-2 px-2 clickable border-bottom border-2"
          onClick={() => {
            setCurrentDirectory(
              (directoryTree.selectedDirectory as FolderNode)
                .parent as FolderNode
            );
          }}
        >
          <Icon name="ellipsis.svg" />
          <span>Back</span>
        </div>
      )}

      {directoryTree.selectedDirectory.children.map((directoryNode, index) => {
        return (
          <DirectoryNodeWrapper
            selected={
              directoryTree.selectedFile.indexes === directoryNode.indexes
            }
            key={index}
            name={directoryNode.name}
            type={typeOfDirectoryNode(directoryNode)}
            onClick={() => selectDirectoryNode(directoryNode)}
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
        return "/json.svg";
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
      <Icon name={getIconName()} />
      <span>{name}</span>
    </div>
  );
}

export default FileManager;
