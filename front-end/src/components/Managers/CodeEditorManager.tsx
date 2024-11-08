import { useEffect, useState, createContext } from "react";
import { FileNode } from "../../utils/directoryTree";
import FilesInspector from "../Controlled/FilesInspector";
import CodeEditor from "../Controlled/CodeEditor";

function CodeEditorManager({
  selectedFile,
  setSelectedFile,
  interpretJSCode,
}: CodeEditorManagerProps) {
  const [loadedFiles, setLoadedFiles] = useState<FileNode[]>([] as FileNode[]);

  useEffect(() => {
    if (
      !selectedFile.indexes ||
      loadedFiles.find((file) => file.indexes === selectedFile.indexes)
    )
      return;

    setLoadedFiles([selectedFile].concat(loadedFiles));
  }, [selectedFile]);

  function handleFileClose(fileIndex: number) {
    const newLoadedFiles = [...loadedFiles];
    if (newLoadedFiles[fileIndex].indexes === selectedFile.indexes) {
      let selectedFileResult = {} as FileNode;

      if (loadedFiles.length > 1)
        if (fileIndex) selectedFileResult = loadedFiles[fileIndex - 1];
        else selectedFileResult = loadedFiles[fileIndex + 1];

      setSelectedFile(selectedFileResult);
    }
    newLoadedFiles.splice(fileIndex, 1);
    setLoadedFiles(newLoadedFiles);
  }

  return (
    <div>
      <FilesInspector
        inspectedFiles={loadedFiles}
        selectedFile={selectedFile}
        onFileSelect={setSelectedFile}
        onFileClose={handleFileClose}
      />
      <CodeEditorContext.Provider
        value={{ selectedFile, setSelectedFile, interpretJSCode }}
      >
        <CodeEditor />
      </CodeEditorContext.Provider>
    </div>
  );
}

type CodeEditorManagerProps = {
  selectedFile: FileNode;
  interpretJSCode: (fileContent: string[]) => void;
  setSelectedFile: (
    newFile: FileNode | ((previousSelectedFile: FileNode) => FileNode)
  ) => void;
};

export type CodeEditorData = {
  selectedFile: FileNode;
  interpretJSCode: (fileContent: string[]) => void;
  setSelectedFile: (
    newFile: FileNode | ((previousSelectedFile: FileNode) => FileNode)
  ) => void;
};

export const CodeEditorContext = createContext<CodeEditorData>(
  null as unknown as CodeEditorData
);

export default CodeEditorManager;
