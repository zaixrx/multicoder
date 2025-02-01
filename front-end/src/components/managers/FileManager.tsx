import { useContext } from "react";
import { ContextMenuContext } from "../ContextMenuWrapper";
import DirectoryTree, {
  FileNode, FolderNode,
  DirectoryTreeNode,
  typeOfDirectoryNode
} from "../../assets/directoryTree";
import Icon from "../common/Icon";

type PropsType = {
  directoryTree: DirectoryTree;
  appendFile: (fileName: string) => FileNode | undefined;
  appendFolder: (folderName: string) => FolderNode | undefined;
  selectFile: (path: string[] | undefined) => void;
  selectFolder: (path: string[] | undefined) => void;
};

function FileManager({
  directoryTree,
  appendFile,
  appendFolder,
  selectFile,
  selectFolder,
}: PropsType) {
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
        <span onClick={() => createFileInCurrentDirectory("file")}>
          Create File
        </span>,
        <span onClick={() => createFolderInCurrentDirectory("folder")}>
          Create Folder
        </span>,
      ],
      { x: e.clientX, y: e.clientY }
    );
  }

  function selectDirectoryNode(directoryNode: DirectoryTreeNode) {
    switch (typeOfDirectoryNode(directoryNode)) {
      case FileNode:
        selectFile(directoryNode.path);
        break;

      case FolderNode:
        selectFolder(directoryNode.path);
        break;
    }
  }

  function renderContent(): React.ReactNode {
    const nodes: DirectoryTreeNode[] = [];
    const container = directoryTree.selectedFolder || directoryTree;

    for (const node in container.children) {
      nodes.push(container.children[node])
    }

    return nodes.map((node, index) => {
      return (
        <DirectoryNodeWrapper
          key={index}
          name={node.name}
          type={typeOfDirectoryNode(node)}
          
          selected={directoryTree.selectedFile?.path === node.path}
          onClick={() => selectDirectoryNode(node)}
        />
      );
    })
  }

  return (
    <div
      className="fill-vertically fill-screen-vertically dir-tab"
      onContextMenu={handleContextMenuTrigger}
    >
      <section className="d-flex gap-1 px-1 align-items-center justify-content-end">
        <button onClick={() => createFileInCurrentDirectory("file.js")}>
          <Icon name="new-file.svg" width={20} />
        </button>

        <button onClick={() => createFolderInCurrentDirectory("folder")}>
          <Icon name="new-folder.svg" width={20} />
        </button>
      </section>

      {directoryTree.selectedFolder && (
        <div
          className="d-flex gap-2 px-2 clickable border-bottom border-2"
          onClick={() => {
            if (directoryTree.selectedFolder?.parent)
              selectFolder(directoryTree.selectedFolder.parent.path);
            else
              selectFolder(undefined);
          }}
        >
          <Icon name="ellipsis.svg" />
          <span>Back</span>
        </div>
      )}

      {renderContent()}
    </div>
  );
}


function DirectoryNodeWrapper({ selected, type, name, onClick }: any) {
  return (
    <div
      className={`d-flex border-2 border-bottom px-2 gap-2 clickable${
        selected ? " selected" : ""
      }`}
      onClick={onClick}
    >
      <Icon name={() => {
        switch (type) {
          case FolderNode:
            return "/folder.svg";
          case FileNode:
            return "/json.svg";
          default:
            return "/";
        }
      }} />
      <span>{name}</span>
    </div>
  );
}

export default FileManager;
