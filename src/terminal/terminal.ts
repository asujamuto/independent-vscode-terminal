import { getTerminalWebviewContent } from './terminalWebView';
import * as vscode from 'vscode';
import { execSync } from 'child_process';
import * as path from 'path';
import os from 'os';

export const terminal = (currentPanel: vscode.WebviewPanel | undefined, context: vscode.ExtensionContext) => {

        
        const columnToShowIn = vscode.window.activeTextEditor?.viewColumn;
        if(currentPanel)
        {
                currentPanel.reveal(columnToShowIn);
        } 
        currentPanel = vscode.window.createWebviewPanel(
            'pretty-command-line',
            'Pretty Terminal',
             columnToShowIn || vscode.ViewColumn.One,
             {
                enableScripts: true,
                retainContextWhenHidden: true
             });
        
        let icon = vscode.Uri.file(
            path.join(context.extensionPath, 'src/icons/terminal_icon.png')
        );
        currentPanel.iconPath = icon;
        
        const iconUri = currentPanel.webview.asWebviewUri(icon);

        let userPath: String;

        if (os.platform() === "win32") 
        {
            let path = execSync('echo %cd%').toString().trim();
            console.log(path);
            userPath = `${path}>`;
        }
        else if (os.platform() === "linux")
        {
            let path = execSync('pwd').toString().trim();
            userPath = `user@linux: ${path}`;
        }

        const updateWebview = () => {
            
            if(currentPanel)
            {
                const fontColor = 'white';
                currentPanel.webview.html = getTerminalWebviewContent(userPath, iconUri.toString(), fontColor);
            }
        };

        
        currentPanel.webview.onDidReceiveMessage(
            message => {
                switch (message.command) {
                    case 'terminal-command':
                        try {
                        
                        if(message.text === "clear" || message.text === "clear ")
                        {
                            return;	
                        }
                        if (message.text.startsWith('cd ')) {
                            const newPath = message.text.slice(3).trim();
                            process.chdir(newPath);  
                            
                            let currentTerminalPath: String;
                            switch (os.platform()) {
                                case "win32":
                                    currentTerminalPath = process.cwd() + ">";
                                    break;
                                case "linux":
                                    currentTerminalPath = "user@linux: " + process.cwd();
                                    break;
                                default:
                                    currentTerminalPath = process.cwd() + ">";
                                    break;
                            }


                            return currentPanel?.webview.postMessage({
                                command: 'output-data',
                                newDirectory: process.cwd(),
                                output: JSON.stringify([`${currentTerminalPath}`])
                            });
                        }
                        else
                        {
                            const output = execSync(message.text, {encoding: 'utf-8'});
                            const splitted = output.split("\n").filter(line => line !== '');
                            
                            currentPanel?.webview.postMessage({ 
                                command: 'output-data',
                                output: JSON.stringify(splitted)  
                            });    
                        }

                        
                        }
                        catch(e: unknown)
                        {
                            if(e instanceof Error)
                            {
                                let errorMesage = e.message.split("\n");
                                currentPanel?.webview.postMessage({ 
                                    command: 'output-data',
                                    output: JSON.stringify(errorMesage)  });
                                return;
                            }
                        }
                    break;
                }
            }
        );

        updateWebview();

        // const interval = setInterval(updateWebview, 1000);

        currentPanel.onDidDispose(() => { currentPanel = undefined },
                    null, 
                    context.subscriptions
        ); 
};
