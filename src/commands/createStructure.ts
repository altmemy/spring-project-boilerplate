import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { findBasePackageDir } from '../utils/packageUtils';

export function registerCreateStructure(context: vscode.ExtensionContext) {
  let disposable = vscode.commands.registerCommand(
    'spring-project-boilerplate.createStructure',
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

      const basePackageDir = findBasePackageDir(javaSrcPath);
      if (!basePackageDir) {
        vscode.window.showWarningMessage(
          'Could not detect main package. Please make sure your project contains a Main class in src/main/java.'
        );
        return;
      }

      const folders = ['model', 'controller', 'service', 'repository'];
      try {
        folders.forEach(folder => {
          const dir = path.join(basePackageDir, folder);
          if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir);
          }
        });
        vscode.window.showInformationMessage(
          'Subfolders created inside your base package: model, controller, service, repository.'
        );
      } catch (error) {
        vscode.window.showErrorMessage('Error creating folders: ' + error);
      }
    }
  );
  context.subscriptions.push(disposable);
}