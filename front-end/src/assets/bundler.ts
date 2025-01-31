import * as acorn from 'acorn';
import { simple } from 'acorn-walk';
import * as bable from "@babel/standalone";

import DirectoryTree, { FileNode } from './directoryTree';

interface Module {
  transpiledCode: string;
};

type Modules = {
  [absolutePath: string]: Module;
};

// Function to create a module graph
function createModuleGraph(directoryTree: DirectoryTree): Modules {
  if (!directoryTree.entryFile) throw new Error("Entry file not specified");

  const modules: Modules = { };

  // Returns the paths pointing to the dependecy files pointed to by the user
  function getDependencies(code: string): string[] {
    const ast = acorn.parse(code, {
      sourceType: 'module',
      ecmaVersion: 'latest',
    });

    const dependencies: string[] = [];
    simple(ast, {
      ImportDeclaration(node: any) {
        // TODO: Make sure the pathes stored here are absolute paths
        dependencies.push(node.source.value);
      },
    });

    return dependencies;
  }

  function traverse(filePath: string): void {
    const fileNode = directoryTree.findNode(filePath.split("/"));
    if (!(fileNode && fileNode instanceof FileNode)) throw new Error("File doesn't exist");

    const code = fileNode.content.join('\n');
    const dependencies = getDependencies(code);

    const { code: transpiledCode } = bable.transform(code, { presets: ["env"] });
    if (!transpiledCode) throw new Error(`Falied to transpile code for ${filePath}`);

    modules[filePath] = {
      transpiledCode
    };

    dependencies.forEach(traverse);
  }

  traverse(directoryTree.entryFile.path.join("/"));

  return modules;
}
  
// Function to bundle all modules into a single file
export function bundle(directoryTree: DirectoryTree): string {
  const modules = createModuleGraph(directoryTree);

  let graph = "";
  
  for (const path in modules) {
    const { transpiledCode } = modules[path];

    graph += `
      "${path}": {
        fn: function(require, module, exports) {
          ${transpiledCode}
        }
      },
    `;
  }

  const result = `
    (function(graph, entryFilePath) {
      function require(path) {
        const { fn } = graph[path];
        const module = { exports: { } };

        fn(require, module, module.exports);

        return module.exports;
      }

      require(entryFilePath);
    })({${graph}}, "${directoryTree.entryFile?.path}");
  `;

  return result;
}