import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { getPackageFromPath } from '../utils/packageUtils';

export function registerGenerateMissingControllers(context: vscode.ExtensionContext) {
  let disposable = vscode.commands.registerCommand(
    'spring-project-boilerplate.generateMissingControllers',
    async (uri?: vscode.Uri) => {
      // 1. تحديد مجلد controller
      let controllerDir: string | undefined = uri?.fsPath;
      if (!controllerDir || path.basename(controllerDir) !== 'controller') {
        vscode.window.showWarningMessage('Please right-click on the controller folder.');
        return;
      }
      // 2. اكتشاف مجلد model في نفس الـ basePackage
      const basePackageDir = path.dirname(controllerDir); // one level up (the main package)
      const modelDir = path.join(basePackageDir, 'model');
      if (!fs.existsSync(modelDir)) {
        vscode.window.showWarningMessage('model directory not found!');
        return;
      }

      // 3. جلب جميع الكلاسات من model
      const entityFiles = fs.readdirSync(modelDir).filter(f => f.endsWith('.java'));
      if (entityFiles.length === 0) {
        vscode.window.showInformationMessage('No entity classes found in model directory.');
        return;
      }

      // 4. جلب جميع الكلاسات من controller
      const controllerFiles = fs.readdirSync(controllerDir).filter(f => f.endsWith('Controller.java'));

      // 5. تحديد الـ entity التي لا يوجد لها Controller
      const missing = entityFiles
        .map(entityFile => entityFile.replace('.java', ''))
        .filter(entityName => !controllerFiles.includes(entityName + 'Controller.java'));

      if (missing.length === 0) {
        vscode.window.showInformationMessage('All entities already have controllers.');
        return;
      }

      // 6. توليد Controller لكل كيان ناقص
      const controllerPackage = getPackageFromPath(controllerDir);
      const servicePackage = getPackageFromPath(path.join(basePackageDir, 'service'));
      const modelPackage = getPackageFromPath(modelDir);

      for (const entityName of missing) {
        const entityNameCamel = entityName.charAt(0).toLowerCase() + entityName.slice(1);
        const controllerPath = path.join(controllerDir, `${entityName}Controller.java`);
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
        if (!fs.existsSync(controllerPath)) {
          fs.writeFileSync(controllerPath, controllerContent, 'utf8');
        }
      }

      vscode.window.showInformationMessage(`Created Controllers for: ${missing.join(', ')}`);
    }
  );
  context.subscriptions.push(disposable);
}
