import Icon from "../../common/Icon";
import { FileNode } from "../../utils/directoryTree";

type FilesInspectorProps = {
  inspectedFiles: FileNode[];
  selectedFile: FileNode;
  onFileSelect: (file: FileNode) => void;
  onFileClose: (fileIndex: number) => void;
};

function FilesInspector({
  inspectedFiles,
  selectedFile,
  onFileSelect,
  onFileClose,
}: FilesInspectorProps) {
  return (
    <div className="d-flex">
      {inspectedFiles.map((file, index) => (
        <div
          key={index}
          className={`d-flex clickable gap-2 align-items-center p-2 border border-black border-2${
            selectedFile.indexes === file.indexes && " selected"
          }`}
        >
          <div onClick={() => onFileSelect(file)}>
            <Icon width={20} name="json.svg" />
            <span>{file.name}</span>
          </div>
          <button>
            <Icon onClick={() => onFileClose(index)} name="close.svg" />
          </button>
        </div>
      ))}
    </div>
  );
}

export default FilesInspector;
