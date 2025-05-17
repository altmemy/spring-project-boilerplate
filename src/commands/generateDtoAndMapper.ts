import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { getPackageFromPath } from "../utils/packageUtils";

export function registerGenerateDtoAndMapper(context: vscode.ExtensionContext) {
  let disposable = vscode.commands.registerCommand(
    "spring-project-boilerplate.generateDtoAndMapper",
    async (uri?: vscode.Uri) => {
      if (!uri || !uri.fsPath || !uri.fsPath.endsWith(".java")) {
        vscode.window.showWarningMessage(
          "Please select a Java entity class inside the model folder."
        );
        return;
      }

      const entityPath = uri.fsPath;
      const entityFileName = path.basename(entityPath); // User.java
      const entityName = entityFileName.replace(".java", "");

      // 
      const modelDir = path.dirname(entityPath);
      const basePackageDir = path.dirname(modelDir); // .../src/main/java/com/example/demo
      const dtoDir = path.join(basePackageDir, "dto");
      const mapperDir = path.join(basePackageDir, "mapper");

      //Create directories if they don't exist 
      if (!fs.existsSync(dtoDir)){ fs.mkdirSync(dtoDir);}
      if (!fs.existsSync(mapperDir)){ fs.mkdirSync(mapperDir);}

      // get package names 
      const dtoPackage = getPackageFromPath(dtoDir);
      const mapperPackage = getPackageFromPath(mapperDir);
      const modelPackage = getPackageFromPath(modelDir);

      // Paths for DTO and Mapper
      const dtoPath = path.join(dtoDir, `${entityName}Dto.java`);
      const mapperPath = path.join(mapperDir, `${entityName}Mapper.java`);

      const dtoContent = `package ${dtoPackage};

public class ${entityName}Dto {
    // TODO: Add fields and getters/setters based on ${entityName}
}
`;

      // Mapper content 
      const mapperContent = `package ${mapperPackage};

import ${modelPackage}.${entityName};
import ${dtoPackage}.${entityName}Dto;

public class ${entityName}Mapper {

    public static ${entityName}Dto toDto(${entityName} entity) {
        // TODO: Map entity fields to dto
        return new ${entityName}Dto();
    }

    public static ${entityName} toEntity(${entityName}Dto dto) {
        // TODO: Map dto fields to entity
        return new ${entityName}();
    }
}f
`;

      try {
        if (!fs.existsSync(dtoPath)){
          fs.writeFileSync(dtoPath, dtoContent, "utf8");
        }
        if (!fs.existsSync(mapperPath)){
          fs.writeFileSync(mapperPath, mapperContent, "utf8");
        }

        vscode.window.showInformationMessage(
          `DTO and Mapper generated for ${entityName}!`
        );
      } catch (error) {
        vscode.window.showErrorMessage(
          "Error creating DTO or Mapper: " + error
        );
      }
    }
  );
  context.subscriptions.push(disposable);
}
