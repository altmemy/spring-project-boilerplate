import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { getPackageFromPath } from '../utils/packageUtils';

export function registerGenerateMissingRepositories(context: vscode.ExtensionContext) {
  let disposable = vscode.commands.registerCommand(
    'spring-project-boilerplate.generateMissingRepositories',
    async (uri?: vscode.Uri) => {
      let repositoryDir: string | undefined = uri?.fsPath;
      if (!repositoryDir || path.basename(repositoryDir) !== 'repository') {
        vscode.window.showWarningMessage('Please right-click on the repository folder.');
        return;
      }
      const basePackageDir = path.dirname(repositoryDir);
      const modelDir = path.join(basePackageDir, 'model');
      if (!fs.existsSync(modelDir)) {
        vscode.window.showWarningMessage('model directory not found!');
        return;
      }

      const entityFiles = fs.readdirSync(modelDir).filter(f => f.endsWith('.java'));
      if (entityFiles.length === 0) {
        vscode.window.showInformationMessage('No entity classes found in model directory.');
        return;
      }

      const repositoryFiles = fs.readdirSync(repositoryDir).filter(f => f.endsWith('Repository.java'));

      const missing = entityFiles
        .map(entityFile => entityFile.replace('.java', ''))
        .filter(entityName => !repositoryFiles.includes(entityName + 'Repository.java'));

      if (missing.length === 0) {
        vscode.window.showInformationMessage('All entities already have repositories.');
        return;
      }

      const repositoryPackage = getPackageFromPath(repositoryDir);
      const modelPackage = getPackageFromPath(modelDir);

      for (const entityName of missing) {
        const repositoryPath = path.join(repositoryDir, `${entityName}Repository.java`);
        const repositoryContent = `package ${repositoryPackage};

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import ${modelPackage}.${entityName};

@Repository
public interface ${entityName}Repository extends JpaRepository<${entityName}, Long> {
    // Add query methods if needed
}
`;
        if (!fs.existsSync(repositoryPath)) {
          fs.writeFileSync(repositoryPath, repositoryContent, 'utf8');
        }
      }

      vscode.window.showInformationMessage(`Created Repositories for: ${missing.join(', ')}`);
    }
  );
  context.subscriptions.push(disposable);
}
