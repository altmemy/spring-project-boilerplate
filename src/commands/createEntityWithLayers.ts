import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { findBasePackageDir, getPackageFromPath } from '../utils/packageUtils';

export function registerCreateEntityWithLayers(context: vscode.ExtensionContext) {
  let disposable = vscode.commands.registerCommand(
    'spring-project-boilerplate.createEntityWithLayers',
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

      let modelDir: string;
      let repositoryDir: string;
      let serviceDir: string;
      let controllerDir: string;
      let basePackageDir: string;

      if (path.basename(baseDir) === 'model') {
        modelDir = baseDir;
        basePackageDir = path.dirname(path.dirname(baseDir));
        repositoryDir = path.join(basePackageDir, 'repository');
        serviceDir = path.join(basePackageDir, 'service');
        controllerDir = path.join(basePackageDir, 'controller');
      } else if (path.basename(baseDir) === 'src') {
        basePackageDir = findBasePackageDir(path.join(baseDir, 'main', 'java')) || '';
        modelDir = path.join(basePackageDir, 'model');
        repositoryDir = path.join(basePackageDir, 'repository');
        serviceDir = path.join(basePackageDir, 'service');
        controllerDir = path.join(basePackageDir, 'controller');
      } else {
        basePackageDir = findBasePackageDir(path.join(baseDir, 'src', 'main', 'java')) || '';
        modelDir = path.join(basePackageDir, 'model');
        repositoryDir = path.join(basePackageDir, 'repository');
        serviceDir = path.join(basePackageDir, 'service');
        controllerDir = path.join(basePackageDir, 'controller');
      }

      if (!modelDir || !repositoryDir || !serviceDir || !controllerDir) {
        vscode.window.showWarningMessage('Project structure is incomplete or not detected!');
        return;
      }

      for (const dir of [modelDir, repositoryDir, serviceDir, controllerDir]) {
        if (!fs.existsSync(dir)) {fs.mkdirSync(dir);}
      }

      const entityName = await vscode.window.showInputBox({
        prompt: 'Enter Entity Name (e.g., User)',
        placeHolder: 'User',
        validateInput: (val) => (!val || !/^[A-Z][a-zA-Z0-9]*$/.test(val)) ? 'Use CamelCase and start with uppercase' : undefined
      });
      if (!entityName)
         {return;}

      const entityNameCamel = entityName.charAt(0).toLowerCase() + entityName.slice(1);
      const modelPackage = getPackageFromPath(modelDir);
      const repositoryPackage = getPackageFromPath(repositoryDir);
      const servicePackage = getPackageFromPath(serviceDir);
      const controllerPackage = getPackageFromPath(controllerDir);

      const modelPath = path.join(modelDir, `${entityName}.java`);
      const repositoryPath = path.join(repositoryDir, `${entityName}Repository.java`);
      const servicePath = path.join(serviceDir, `${entityName}Service.java`);
      const controllerPath = path.join(controllerDir, `${entityName}Controller.java`);

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

      const repositoryContent = `package ${repositoryPackage};

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import ${modelPackage}.${entityName};

@Repository
public interface ${entityName}Repository extends JpaRepository<${entityName}, Long> {
    // Add query methods if needed
}
`;

      // Service with CRUD
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

      // Controller with CRUD
      const controllerContent = `package ${controllerPackage};

import org.springframework.web.bind.annotation.*;
import org.springframework.beans.factory.annotation.Autowired;
import java.util.List;
import java.util.Optional;
import ${modelPackage}.${entityName};
import ${servicePackage}.${entityName}Service;

@RestController
@RequestMapping("/${entityName.toLowerCase()}s")
public class ${entityName}Controller {

    private final ${entityName}Service ${entityNameCamel}Service;

    @Autowired
    public ${entityName}Controller(${entityName}Service ${entityNameCamel}Service) {
        this.${entityNameCamel}Service = ${entityNameCamel}Service;
    }

    @GetMapping
    public List<${entityName}> getAll() {
        return ${entityNameCamel}Service.getAll();
    }

    @GetMapping("/{id}")
    public Optional<${entityName}> getById(@PathVariable Long id) {
        return ${entityNameCamel}Service.getById(id);
    }

    @PostMapping
    public ${entityName} create(@RequestBody ${entityName} entity) {
        return ${entityNameCamel}Service.create(entity);
    }

    @PutMapping("/{id}")
    public ${entityName} update(@PathVariable Long id, @RequestBody ${entityName} entity) {
        return ${entityNameCamel}Service.update(id, entity);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        ${entityNameCamel}Service.delete(id);
    }
}
`;

      try {
        if (!fs.existsSync(modelPath)) {fs.writeFileSync(modelPath, modelContent, 'utf8');}
        if (!fs.existsSync(repositoryPath)) {fs.writeFileSync(repositoryPath, repositoryContent, 'utf8');}
        if (!fs.existsSync(servicePath)) {fs.writeFileSync(servicePath, serviceContent, 'utf8');}
        if (!fs.existsSync(controllerPath)) {fs.writeFileSync(controllerPath, controllerContent, 'utf8');}

        vscode.window.showInformationMessage(
          `Entity ${entityName} created with Repository, Service (CRUD), and Controller (CRUD) classes!`
        );
      } catch (error) {
        vscode.window.showErrorMessage('Error creating files: ' + error);
      }
    }
  );
  context.subscriptions.push(disposable);
}
