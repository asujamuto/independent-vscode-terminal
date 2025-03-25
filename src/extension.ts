import * as vscode from 'vscode';
import { execSync } from 'child_process';


export function activate(context: vscode.ExtensionContext) {
	
	console.log('"pretty-command-line" has started');
	
	let currentPanel: vscode.WebviewPanel | undefined = undefined;	
	
	const terminalDisposable = vscode.commands.registerCommand('pretty-command-line.terminal', () => {

		const columnToShowIn = vscode.window.activeTextEditor ? vscode.window.activeTextEditor?.viewColumn : undefined;
		if(currentPanel)
		{
				currentPanel.reveal(columnToShowIn);
		} 
		else 
		{
		  	currentPanel = vscode.window.createWebviewPanel(
			'terminal',
			'Pretty Terminal',
			 columnToShowIn || vscode.ViewColumn.One,
			{
				enableScripts: true
			}
		  );
		}
		
		const updateWebview = () => {
			
			if(currentPanel)
			{
				const fontColor = 'white';
				currentPanel.webview.html = getTerminalWebviewContent(fontColor);
			}
		};
		currentPanel.webview.onDidReceiveMessage(
			message => {
				switch (message.command) {
					case 'terminal-command':
						try {
						
						if(message.text === "clear")
						{
							return;	
						}
						if (message.text.startsWith('cd ')) {
							const newPath = message.text.slice(3).trim();
							process.chdir(newPath);  
							return currentPanel?.webview.postMessage({
								command: 'output-data',
								newDirectory: process.cwd(),
								output: JSON.stringify([`${process.cwd()}`])
							});
						}

						const output = execSync(message.text, {encoding: 'utf-8'});
						const splitted = output.split("\n").filter(line => line !== '');
						
						currentPanel?.webview.postMessage({ 
							command: 'output-data',
							output: JSON.stringify(splitted)  
						});
						
						
							return;
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
				}
			}
		);

		updateWebview();

		const interval = setInterval(updateWebview, 1000);

		currentPanel.onDidDispose(() => { currentPanel = undefined; clearInterval(interval); },
					null, 
					context.subscriptions
		);
		  
	});

	context.subscriptions.push(terminalDisposable);
}

function getTerminalWebviewContent(fontColor: string)
{
	return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Linux Terminal</title>
    <style>
		@import url('https://fonts.googleapis.com/css2?family=Work+Sans:ital,wght@0,100..900;1,100..900&display=swap');



        body {
            background-color: #1e1e1e;
			font-family: "Work Sans", sans-serif;
  			font-optical-sizing: auto;
  			font-weight: <weight>;
  			font-style: normal;
        }
		

        .terminal {
            border-radius: 5px;
			margin: 0;
		    padding: 15px;
		    border-radius: 5px;
        }
        .prompt {
            color: ${fontColor};
        }
        input {
            background: none;
            border: none;
            color: ${fontColor};
            width: auto;
            outline: none;
        }
		input:focus {
            outline: none;
		}
		.output-text {
			color: pin;
			margin: 0;
			padding: 0;
			margin-bottom: 10px;
		}
		.output-container {
			margin-bottom: 20px;
		}
		
}

		
	</style>
	
</head>
<body>
<script>
    const vscode = acquireVsCodeApi(); 

    document.addEventListener("DOMContentLoaded", function () {
         const terminalInput = document.querySelector("#terminal-input-container");
         terminalInput.querySelector("#terminal-input").focus()
         const inputField = document.querySelector("input");
         inputField.addEventListener("keypress", handleEnter);
     }); 
	
	 window.addEventListener('message', event => {

            const message = event.data; 

            const terminal = document.querySelector(".terminal");
            const terminalInput = document.querySelector("#terminal-input-container");
			let currentDir;

            switch (message.command) {
                case 'output-data':
					
					let outputParsed = JSON.parse(message.output);
					let outputContainer = document.createElement("div");
					outputContainer.className = "output-container";
					
				
					outputParsed.forEach(i => {
                		let outputParagraph = document.createElement("p");
                		outputParagraph.innerHTML = "<span style='color: ${fontColor}'>" + i + "</span>";
						outputParagraph.className = "output-text"

                		outputContainer.appendChild(outputParagraph); 
            		});
					terminal.appendChild(outputContainer);
					terminal.appendChild(terminalInput); 
					terminalInput.querySelector("#terminal-input").focus();
					if (message.newDirectory) 
					{
						currentDir = message.newDirectory;
            			const p = terminal.querySelectorAll(".prompt")
						p.forEach((item) => {
							item.innerHTML =  "user@linux: " + currentDir + "<br/>╰┈➤" ;
						})
					}

				}
    });

    function handleEnter(event) {
        if (event.key === "Enter") {
            event.preventDefault();

            const terminal = document.querySelector(".terminal");
            const terminalInput = document.querySelector("#terminal-input-container");
            const input = event.target;
            const command = input.value.trim();
            
            

            if (command !== "") {
                vscode.postMessage({
                    command: "terminal-command",
                    text: command
                });

                const newLine = document.createElement("p");
                newLine.innerHTML = "<p style='color: ${fontColor}'><span class='prompt'>user@linux: ~<br/>╰┈➤</span>" + command + "</p>";
                
                terminal.appendChild(newLine);  
                terminal.appendChild(terminalInput); 
                terminalInput.querySelector("#terminal-input").focus()
                input.value = "";
                if(command === "clear")
                {
                    terminal.textContent = "";
                    terminal.appendChild(terminalInput);
                    terminalInput.querySelector("#terminal-input").focus()

                }

            }
            
        }
    }
</script>
    <div class="terminal">
		<h1>Hello From Pretty Terminal 🌹</h1>
        <form onsubmit="return false;">
            <div id="terminal-input-container">
                <span class="prompt" >user@linux: ~<br/>╰┈➤</span> 
                <input type="text" id="terminal-input" placeholder="Type a command..." 
                        autofocus onkeypress="handleEnter(event)">
            </div>
        </form>
    </div>
</body>
</html>`;
}

// This method is called when your extension is deactivated
export function deactivate() {}
