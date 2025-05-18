import * as vscode from 'vscode';
import { registerCreateStructure } from './commands/createStructure';
import { registerCreateEntityWithLayers } from './commands/createEntityWithLayers';
import { registerGenerateDtoAndMapper } from './commands/generateDtoAndMapper';
import { registerGenerateSecurityClasses } from './commands/generateSecurityClasses';
import { registerGenerateMissingControllers } from './commands/generateMissingControllers';
import { registerGenerateMissingServices } from './commands/generateMissingServices';
import { registerGenerateMissingRepositories } from './commands/generateMissingRepositories';
import { registerCreateEntity } from './commands/createEntity';
import { registerGenerateGlobalExceptionHandler } from './commands/generateGlobalExceptionHandler';

export function activate(context: vscode.ExtensionContext) {
  registerCreateStructure(context);
  registerCreateEntityWithLayers(context);
  registerCreateEntity(context);
  registerGenerateDtoAndMapper(context);
  registerGenerateSecurityClasses(context);
  registerGenerateMissingControllers(context);
  registerGenerateMissingServices(context);
  registerGenerateMissingRepositories(context);
  registerGenerateGlobalExceptionHandler(context);
}

export function deactivate() {}
