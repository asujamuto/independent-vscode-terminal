import * as vscode from 'vscode';
import { terminal } from './terminal/terminal';


export function activate(context: vscode.ExtensionContext) {
	
	console.log('"pretty-command-line" has started');
	
	let currentPanel: vscode.WebviewPanel | undefined = undefined;	
	
	
	const terminalDisposable = vscode.commands.registerCommand('pretty-command-line.terminal',
								() => terminal(currentPanel, context));

	context.subscriptions.push(terminalDisposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}
