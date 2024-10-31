import Icon, { IconMode } from "../common/Icon";
import { FileNode } from "./FileBrowser/DirectoryTree";

type FilesInspectorProps = {
  files: FileNode[];
  onFileClose: (fileIndex: number) => void;
};

function FilesInspector({ files, onFileClose }: FilesInspectorProps) {
  return (
    <div className="d-flex">
      {files.map((file, index) => (
        <div
          key={index}
          className="d-flex gap-2 align-items-center p-2 border border-black border-2"
        >
          <Icon width={20} mode={IconMode.Light} name="json.svg" />
          <span>{file.name}</span>
          <Icon
            className="clickable bg-secondary rounded-circle"
            width={20}
            onClick={() => onFileClose(index)}
            mode={IconMode.Dark}
            name="close.svg"
          />
        </div>
      ))}
    </div>
  );
}

export default FilesInspector;
