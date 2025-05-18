// src/commands/createEntity.ts
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { findBasePackageDir, getPackageFromPath } from '../utils/packageUtils';

export function registerCreateEntity(context: vscode.ExtensionContext) {
  let disposable = vscode.commands.registerCommand(
    'spring-project-boilerplate.createEntity',
    async (uri?: vscode.Uri) => {
      let baseDir: string | undefined;
      if (uri && uri.fsPath) {
        baseDir = uri.fsPath;
      } else {
        const options: vscode.OpenDialogOptions = {
          canSelectFolders: true,
          canSelectMany: false,
          openLabel: 'Select Project Folder'
        };
        const folderUri = await vscode.window.showOpenDialog(options);
        if (!folderUri || folderUri.length === 0) {
          vscode.window.showWarningMessage('No folder selected.');
          return;
        }
        baseDir = folderUri[0].fsPath;
      }

      // if the selected folder is not a valid Java project, show a warning
      let javaSrcPath = '';
      if (path.basename(baseDir) === 'src') {
        javaSrcPath = path.join(baseDir, 'main', 'java');
      } else {
        javaSrcPath = path.join(baseDir, 'src', 'main', 'java');
      }
      if (!fs.existsSync(javaSrcPath)) {
        vscode.window.showWarningMessage('src/main/java not found in selected folder!');
        return;
      }

      // search for the base package directory
      const basePackageDir = findBasePackageDir(javaSrcPath);
      if (!basePackageDir) {
        vscode.window.showWarningMessage(
          'Could not detect main package. Please make sure your project contains a Main class in src/main/java.'
        );
        return;
      }

      // if the model directory does not exist, create it
      const modelDir = path.join(basePackageDir, 'model');
      if (!fs.existsSync(modelDir)) {fs.mkdirSync(modelDir);}

      const entityName = await vscode.window.showInputBox({
        prompt: 'Enter Entity Name (e.g., User)',
        placeHolder: 'User',
        validateInput: (val) => (!val || !/^[A-Z][a-zA-Z0-9]*$/.test(val)) ? 'Use CamelCase and start with uppercase' : undefined
      });
      if (!entityName) {return;}

      const modelPackage = getPackageFromPath(modelDir);
      const modelPath = path.join(modelDir, `${entityName}.java`);
      const modelContent = `package ${modelPackage};

import jakarta.persistence.Entity;
import jakarta.persistence.Id;

@Entity
public class ${entityName} {
    @Id
    private Long id;

    // Add fields, getters and setters
    public Long getId() {
        return id;
    }
    public void setId(Long id) {
        this.id = id;
    }
}
`;

      if (!fs.existsSync(modelPath)) {
        fs.writeFileSync(modelPath, modelContent, 'utf8');
        vscode.window.showInformationMessage(
          `Entity ${entityName} created successfully in model package!`
        );
      } else {
        vscode.window.showWarningMessage(
          `Entity ${entityName} already exists in model package!`
        );
      }
    }
  );
  context.subscriptions.push(disposable);
}
