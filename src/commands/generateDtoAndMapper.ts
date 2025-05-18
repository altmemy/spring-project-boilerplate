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

      // 1. extract the entity path and name
      const entityPath = uri.fsPath;
      const entityFileName = path.basename(entityPath);
      const entityName = entityFileName.replace(".java", "");

      const modelDir = path.dirname(entityPath);
      const basePackageDir = path.dirname(modelDir);
      const dtoDir = path.join(basePackageDir, "dto");
      const mapperDir = path.join(basePackageDir, "mapper");

      if (!fs.existsSync(dtoDir)) { fs.mkdirSync(dtoDir); }
      if (!fs.existsSync(mapperDir)) { fs.mkdirSync(mapperDir); }

      const dtoPackage = getPackageFromPath(dtoDir);
      const mapperPackage = getPackageFromPath(mapperDir);
      const modelPackage = getPackageFromPath(modelDir);

      const dtoPath = path.join(dtoDir, `${entityName}Dto.java`);
      const mapperPath = path.join(mapperDir, `${entityName}Mapper.java`);

      // ask for the DTO package name
      const mapperType = await vscode.window.showQuickPick(
        ["Manual (Basic Java Class)", "MapStruct (Recommended)"],
        { placeHolder: "Choose Mapper implementation type" }
      );
      if (!mapperType) {return;}

      const entityContent = fs.readFileSync(entityPath, "utf8");
      const fieldRegex = /private\s+([A-Za-z0-9_<>]+)\s+([A-Za-z0-9_]+);/g;
      let fields = [];
      let match: RegExpExecArray | null;
      while ((match = fieldRegex.exec(entityContent)) !== null) {
        if (match[2] === "password") {continue;}
        fields.push({ type: match[1], name: match[2] });
      }

      let dtoContent = `package ${dtoPackage};

public class ${entityName}Dto {
`;
      fields.forEach(f => {
        dtoContent += `    private ${f.type} ${f.name};\n`;
      });
      dtoContent += "\n";
      // Add getters/setters
      fields.forEach(f => {
        const n = f.name.charAt(0).toUpperCase() + f.name.slice(1);
        dtoContent += `    public ${f.type} get${n}() { return ${f.name}; }\n`;
        dtoContent += `    public void set${n}(${f.type} ${f.name}) { this.${f.name} = ${f.name}; }\n`;
      });
      dtoContent += "}\n";

      // 5. build the mapper content
      let mapperContent = "";
      if (mapperType.startsWith("Manual")) {
        // Manual Mapper
        mapperContent = `package ${mapperPackage};

import ${modelPackage}.${entityName};
import ${dtoPackage}.${entityName}Dto;

public class ${entityName}Mapper {

    public static ${entityName}Dto toDto(${entityName} entity) {
        if (entity == null) return null;
        ${entityName}Dto dto = new ${entityName}Dto();
${fields.map(f => `        dto.set${capitalize(f.name)}(entity.get${capitalize(f.name)}());`).join('\n')}
        return dto;
    }

    public static ${entityName} toEntity(${entityName}Dto dto) {
        if (dto == null) return null;
        ${entityName} entity = new ${entityName}();
${fields.map(f => `        entity.set${capitalize(f.name)}(dto.get${capitalize(f.name)}());`).join('\n')}
        return entity;
    }
}
`;
      } else {
        // MapStruct Mapper
        mapperContent = `package ${mapperPackage};

import org.mapstruct.Mapper;
import org.mapstruct.factory.Mappers;
import ${modelPackage}.${entityName};
import ${dtoPackage}.${entityName}Dto;

@Mapper(componentModel = "spring")
public interface ${entityName}Mapper {
    ${entityName}Mapper INSTANCE = Mappers.getMapper(${entityName}Mapper.class);

    ${entityName}Dto toDto(${entityName} entity);
    ${entityName} toEntity(${entityName}Dto dto);
}
`;
      }

      // write the DTO and Mapper files
      try {
        if (!fs.existsSync(dtoPath)) {
          fs.writeFileSync(dtoPath, dtoContent, "utf8");
        }
        if (!fs.existsSync(mapperPath)) {
          fs.writeFileSync(mapperPath, mapperContent, "utf8");
        }

        vscode.window.showInformationMessage(
          `DTO and ${mapperType.startsWith("Manual") ? "manual" : "MapStruct"} Mapper generated for ${entityName}!`
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

// Helper function
function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
