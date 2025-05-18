import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { findBasePackageDir, getPackageFromPath } from '../utils/packageUtils';

export function registerGenerateSecurityClasses(context: vscode.ExtensionContext) {
  let disposable = vscode.commands.registerCommand(
    'spring-project-boilerplate.generateSecurityClasses',
    async (uri?: vscode.Uri) => {
      // 1. اختيار مجلد src أو المشروع
      let baseDir: string | undefined;
      if (uri && uri.fsPath) {
        baseDir = uri.fsPath;
      } else {
        const options: vscode.OpenDialogOptions = {
          canSelectFolders: true,
          canSelectMany: false,
          openLabel: 'Select src Folder'
        };
        const folderUri = await vscode.window.showOpenDialog(options);
        if (!folderUri || folderUri.length === 0) {
          vscode.window.showWarningMessage('No folder selected.');
          return;
        }
        baseDir = folderUri[0].fsPath;
      }

      // 2. تحديد src/main/java
      let javaSrcPath = path.join(baseDir, 'main', 'java');
      if (path.basename(baseDir) !== 'src') {
        javaSrcPath = path.join(baseDir, 'src', 'main', 'java');
      }
      if (!fs.existsSync(javaSrcPath)) {
        vscode.window.showWarningMessage('src/main/java not found!');
        return;
      }

      // 3. البحث عن الباكيج الأساسي
      const basePackageDir = findBasePackageDir(javaSrcPath);
      if (!basePackageDir) {
        vscode.window.showWarningMessage('Main class not found! Make sure your project contains a Main class in src/main/java.');
        return;
      }

      // 4. تحديد المسار النهائي security
      const securityDir = path.join(basePackageDir, 'config', 'security');
      fs.mkdirSync(securityDir, { recursive: true });

      // 5. استخرج اسم الباكيج
      const securityPackage = getPackageFromPath(securityDir);

      // 6. محتوى SecurityConfig.java
      const securityConfigContent = `package ${securityPackage};

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/auth/**").permitAll()
                .anyRequest().authenticated()
            )
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            );

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
`;

      // 7. توليد الملف
      const configPath = path.join(securityDir, 'SecurityConfig.java');
      if (!fs.existsSync(configPath)) {
        fs.writeFileSync(configPath, securityConfigContent, 'utf8');
        vscode.window.showInformationMessage('SecurityConfig.java created successfully in config/security!');
      } else {
        vscode.window.showWarningMessage('SecurityConfig.java already exists.');
      }
    }
  );
  context.subscriptions.push(disposable);
}
