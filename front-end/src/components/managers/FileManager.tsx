import _ from "lodash";

import DirectoryTree, {
  FileNode,
  FolderNode,
  Node,
  NodeType,
} from "../../assets/directoryTree";

import Icon from "../common/Icon";
import { Button } from "../ui/button";
import { useState } from "react";
import { Input } from "../ui/input";
import { Separator } from "@radix-ui/react-separator";

type PropsType = {
  directoryTree: DirectoryTree;
  appendFile: (path: string[]) => FileNode | null;
  appendFolder: (path: string[]) => FolderNode | null;
  selectFile: (path: string[] | null) => void;
  selectFolder: (path: string[] | null) => void;
  changeFileName: (path: string[], sendUpdate?: boolean) => void;
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
    const path = directoryTree.selectedFolder
      ? [...directoryTree.selectedFolder.path, name]
      : [name];

    appendFile(path);
  }

  function createFolderInCurrentDirectory(name: string) {
    const path = directoryTree.selectedFolder
      ? [...directoryTree.selectedFolder.path, name]
      : [name];

    appendFolder(path);
  }

  function selectDirectoryNode(node: Node) {
    switch (node.type) {
      case NodeType.FILE_NODE:
        selectFile(node.path);
        break;

      case NodeType.FOLDER_NODE:
        selectFolder(node.path);
        break;
    }
  }

  function renderContent(): React.ReactNode {
    const nodes: Node[] = [];
    const { selectedFolder: folder } = directoryTree;

    if (folder) {
      for (const name in folder.children) {
        const node = directoryTree.getNode([...folder.path, name]);
        if (node) nodes.push(node);
      }
    } else {
      for (const joinedPath in directoryTree.children) {
        if (joinedPath.includes("/")) continue;

        const node = directoryTree.getNode([joinedPath]);
        if (node) nodes.push(node);
      }
    }

    return (
      <div className="max-h-80 overflow-scroll">
        {directoryTree.selectedFolder && (
          <div
            className="cursor-pointer flex border-[#222] py-1 border-b-1 px-2 gap-2"
            onClick={() => {
              if (directoryTree.selectedFolder) {
                let path: string[] | null = directoryTree.selectedFolder.path;

                if (path.length - 1) {
                  path.pop();
                } else {
                  path = null;
                }

                selectFolder(path);
              } else {
                console.log("selecting the null folder");
                selectFolder(null);
              }
            }}
          >
            <Icon name="ellipsis.svg" />
            <span>Back</span>
          </div>
        )}
        {nodes.map((node, index) => {
          return (
            <DirectoryNodeWrapper
              key={index}
              name={node.name}
              type={node.type}
              selected={directoryTree.selectedFile?.path === node.path}
              onClick={() => selectDirectoryNode(node)}
              onSetName={(name: string) => {
                changeFileName([...node.path, name], true);
                node.name = name;
              }}
            />
          );
        })}
      </div>
    );
  }

  return (
    <div className="w-[200px] p-2">
      <section className="flex gap-1 items-center justify-start">
        <Button onClick={() => createFileInCurrentDirectory("file")}>
          <Icon name="new-file.svg" />
        </Button>

        <Button onClick={() => createFolderInCurrentDirectory("folder")}>
          <Icon name="new-folder.svg" />
        </Button>
      </section>

      <Separator className="my-2" />

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
  const [editMode, setEditMode] = useState<boolean>(false);
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
            case NodeType.FOLDER_NODE:
              return "/folder.svg";
            case NodeType.FILE_NODE:
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
