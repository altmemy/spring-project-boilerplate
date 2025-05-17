import * as vscode from 'vscode';
import { registerCreateStructure } from './commands/createStructure';
import { registerCreateEntityWithLayers } from './commands/createEntityWithLayers';
import { registerGenerateDtoAndMapper } from './commands/generateDtoAndMapper';

export function activate(context: vscode.ExtensionContext) {
  registerCreateStructure(context);
  registerCreateEntityWithLayers(context);
  registerGenerateDtoAndMapper(context);
}

export function deactivate() {}
