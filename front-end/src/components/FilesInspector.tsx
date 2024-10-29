import { FileNode } from "./FileBrowser/DirectoryTree";

type FilesInspectorProps = {
  files: FileNode[];
};

function FilesInspector({ files }: FilesInspectorProps) {
  return files.map((file) => {});
}

export default FilesInspector;
