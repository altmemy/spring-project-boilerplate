import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { getPackageFromPath } from '../utils/packageUtils';

export function registerGenerateMissingServices(context: vscode.ExtensionContext) {
  let disposable = vscode.commands.registerCommand(
    'spring-project-boilerplate.generateMissingServices',
    async (uri?: vscode.Uri) => {
      let serviceDir: string | undefined = uri?.fsPath;
      if (!serviceDir || path.basename(serviceDir) !== 'service') {
        vscode.window.showWarningMessage('Please right-click on the service folder.');
        return;
      }
      const basePackageDir = path.dirname(serviceDir);
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

      const serviceFiles = fs.readdirSync(serviceDir).filter(f => f.endsWith('Service.java'));

      const missing = entityFiles
        .map(entityFile => entityFile.replace('.java', ''))
        .filter(entityName => !serviceFiles.includes(entityName + 'Service.java'));

      if (missing.length === 0) {
        vscode.window.showInformationMessage('All entities already have services.');
        return;
      }

      const servicePackage = getPackageFromPath(serviceDir);
      const repositoryPackage = getPackageFromPath(path.join(basePackageDir, 'repository'));
      const modelPackage = getPackageFromPath(modelDir);

      for (const entityName of missing) {
        const servicePath = path.join(serviceDir, `${entityName}Service.java`);
        const serviceContent = `package ${servicePackage};

import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;
import ${modelPackage}.${entityName};
import ${repositoryPackage}.${entityName}Repository;

@Service
public class ${entityName}Service {
    private final ${entityName}Repository repository;

    public ${entityName}Service(${entityName}Repository repository) {
        this.repository = repository;
    }

    public List<${entityName}> getAll() {
        return repository.findAll();
    }

    public Optional<${entityName}> getById(Long id) {
        return repository.findById(id);
    }

    public ${entityName} create(${entityName} entity) {
        return repository.save(entity);
    }

    public ${entityName} update(Long id, ${entityName} entity) {
        if (repository.existsById(id)) {
            entity.setId(id);
            return repository.save(entity);
        } else {
            throw new RuntimeException("${entityName} not found");
        }
    }

    public void delete(Long id) {
        repository.deleteById(id);
    }
}
`;
        if (!fs.existsSync(servicePath)) {
          fs.writeFileSync(servicePath, serviceContent, 'utf8');
        }
      }

      vscode.window.showInformationMessage(`Created Services for: ${missing.join(', ')}`);
    }
  );
  context.subscriptions.push(disposable);
}
