import _ from "lodash";

import DirectoryTree, {
  FileNode,
  FolderNode,
  DirectoryTreeNode,
  typeOfDirectoryNode,
} from "../../assets/directoryTree";
import Icon from "../common/Icon";
import { Button } from "../ui/button";
import { useState } from "react";
import { Input } from "../ui/input";
import { Separator } from "@radix-ui/react-separator";

type PropsType = {
  directoryTree: DirectoryTree;
  appendFile: (fileName: string) => FileNode | undefined;
  appendFolder: (folderName: string) => FolderNode | undefined;
  selectFile: (path: string[] | undefined) => void;
  selectFolder: (path: string[] | undefined) => void;
  changeFileName: (
    nodePath: string[],
    newName: string,
    sendUpdate?: boolean
  ) => void;
};

function FileManager({
  directoryTree,
  appendFile,
  appendFolder,
  selectFile,
  selectFolder,
  changeFileName,
}: PropsType) {
  function createFileInCurrentDirectory(name: string) {
    appendFile(name);
  }

  function createFolderInCurrentDirectory(name: string) {
    appendFolder(name);
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
      nodes.push(container.children[node]);
    }

    return nodes.map((node, index) => {
      return (
        <DirectoryNodeWrapper
          key={index}
          name={node.name}
          type={typeOfDirectoryNode(node)}
          selected={directoryTree.selectedFile?.path === node.path}
          onClick={() => selectDirectoryNode(node)}
          onSetName={(name: string) => {
            changeFileName(node.path, name, true);
            node.name = name;
          }}
        />
      );
    });
  }

  return (
    <div className="h-100 w-[200px] p-2">
      <section className="flex gap-1 items-center justify-start">
        <Button onClick={() => createFileInCurrentDirectory("file")}>
          <Icon name="new-file.svg" />
        </Button>

        <Button onClick={() => createFolderInCurrentDirectory("folder")}>
          <Icon name="new-folder.svg" />
        </Button>
      </section>

      <Separator className="my-2" />

      {directoryTree.selectedFolder && (
        <div
          className="cursor-pointer flex border-[#222] py-1 border-b-1 px-2 gap-2"
          onClick={() => {
            if (directoryTree.selectedFolder?.parent)
              selectFolder(directoryTree.selectedFolder.parent.path);
            else selectFolder(undefined);
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

function DirectoryNodeWrapper({
  selected,
  type,
  name,
  onClick,
  onSetName,
}: any) {
  const [editMode, setEditMode] = useState<boolean>(true);
  const [editName, setEditName] = useState<string>("");

  return (
    <div
      className={`cursor-pointer flex border-[#222] py-1 border-b-1 px-2 gap-2 ${
        selected ? "text-gray-200" : "text-gray-400"
      }`}
      onClick={() => !editMode && onClick()}
    >
      <Icon
        name={(() => {
          switch (type) {
            case FolderNode:
              return "/folder.svg";
            case FileNode:
              return "/json.svg";
            default:
              return "/";
          }
        })()}
      />
      {editMode ? (
        <Input
          value={editName}
          placeholder={name}
          onChange={(e) => {
            setEditName(e.target.value);
          }}
          onKeyDown={({ key }) => {
            if (key === "Enter") {
              if (editName) onSetName(editName);
              setEditMode(false);
              setEditName("");
            }
          }}
        />
      ) : (
        <span>{name}</span>
      )}
    </div>
  );
}

export default FileManager;
