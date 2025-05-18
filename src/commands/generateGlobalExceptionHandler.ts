import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { findBasePackageDir, getPackageFromPath } from '../utils/packageUtils';

export function registerGenerateGlobalExceptionHandler(context: vscode.ExtensionContext) {
  let disposable = vscode.commands.registerCommand(
    'spring-project-boilerplate.generateGlobalExceptionHandler',
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

      // البحث عن مجلد java الأساسي (يعمل مع الضغط على src أو الجذر)
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

      // البحث عن package الأساسي
      const basePackageDir = findBasePackageDir(javaSrcPath);
      if (!basePackageDir) {
        vscode.window.showWarningMessage(
          'Could not detect main package. Please make sure your project contains a Main class in src/main/java.'
        );
        return;
      }

      // انشاء مجلد handler أو exception إذا لم يوجد
      const handlerDir = path.join(basePackageDir, 'exception');
      if (!fs.existsSync(handlerDir)) fs.mkdirSync(handlerDir);

      // اسم الكلاس
      const handlerClass = 'GlobalExceptionHandler';
      const handlerPath = path.join(handlerDir, `${handlerClass}.java`);
      const handlerPackage = getPackageFromPath(handlerDir);

      // الكود الجاهز (مع اشهر الـ Exceptions)
      const handlerContent = `package ${handlerPackage};

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ResponseStatus;

import java.util.HashMap;
import java.util.Map;

@ControllerAdvice
public class ${handlerClass} {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ResponseEntity<Map<String, String>> handleValidationExceptions(MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getFieldErrors().forEach(error ->
            errors.put(error.getField(), error.getDefaultMessage())
        );
        return new ResponseEntity<>(errors, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(MissingServletRequestParameterException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ResponseEntity<String> handleMissingParams(MissingServletRequestParameterException ex) {
        return new ResponseEntity<>("Missing parameter: " + ex.getParameterName(), HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(Exception.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public ResponseEntity<String> handleAllUncaughtException(Exception ex) {
        // سجل الاستثناء إذا كنت تحتاج
        return new ResponseEntity<>("An error occurred: " + ex.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
    }
}
`;

      if (!fs.existsSync(handlerPath)) {
        fs.writeFileSync(handlerPath, handlerContent, 'utf8');
        vscode.window.showInformationMessage(
          `GlobalExceptionHandler.java created successfully in exception package!`
        );
      } else {
        vscode.window.showWarningMessage(
          `GlobalExceptionHandler.java already exists in exception package!`
        );
      }
    }
  );
  context.subscriptions.push(disposable);
}
