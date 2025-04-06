import { Webview } from "vscode";
import * as path from 'path';

import * as vscode from 'vscode';
import { execSync } from 'child_process';

export function getTerminalWebviewContent(commandLinePath: String, icon: string, fontColor: string)
{ 
 	return `<!DOCTYPE html>
 <html lang="en">
 <head>
     <meta charset="UTF-8">
     <meta name="viewport" content="width=device-width, initial-scale=1.0">
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
			 z-index:2;
			 border-radius: 5px;
			 margin: 0;
 		    padding: 15px;
 		    border-radius: 5px;
  			background-color: rgba(0,0,0, 0.4);
			color: 'white';
			filter: blue(8px);
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
			 z-index:2;

			
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
     let currentSystemPath;
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
                    
                    let pTextValues = [] 
		
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
                        currentSystemPath = message.newDirectory;
             			const p = terminal.querySelectorAll(".prompt")
 						p.forEach((item) => {
 							item.innerHTML =  outputParsed + "<br/>╰┈➤" ;
 						})
                        p[p.length - 1].innerHTML = outputParsed + "<br/>╰┈➤" ;
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
             if(command.split(" ")[0] == "vim" || command.split(" ")[0] == "nano")
             {
                const newLine = document.createElement("p");
                const notSupportedMessage = document.createElement("p");
                newLine.innerHTML = "<p style='color: ${fontColor}'><span class='prompt'>${commandLinePath}<br/>╰┈➤</span>" + command + "</p>";              
                notSupportedMessage.innerHTML =  "<p style='color: red'>" + "This text editor is not supported yet" + "</p>";              
                terminal.appendChild(newLine);  
                terminal.appendChild(notSupportedMessage);  
                terminal.appendChild(terminalInput); 
                terminalInput.querySelector("#terminal-input").focus()
                input.value = "";
             }
             else if (command !== "") {
                 vscode.postMessage({
                     command: "terminal-command",
                     text: command
                 });
                 const newLine = document.createElement("p");
                 newLine.innerHTML = "<p style='color: ${fontColor}'><span class='prompt'>${commandLinePath}<br/>╰┈➤</span>" + command + "</p>";              
                 terminal.appendChild(newLine);  
                 terminal.appendChild(terminalInput); 
                 terminalInput.querySelector("#terminal-input").focus()
                 input.value = "";
                 if(command === "clear" || command === "cls")
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
 		<h1 style="display: flex; justify-content: center; align-items: center; gap: 20px">
                Hello From <p style="font-weight: 500 px; color: #B71CEE; ">Pretty</p> Terminal <img src=${icon} width="64 px"/>
        </h1>
         <form onsubmit="return false;">
             <div id="terminal-input-container">
                 <span class="prompt" >${commandLinePath}<br/>╰┈➤</span> 
                 <input type="text" id="terminal-input" placeholder="Type a command..." 
                         autofocus onkeypress="handleEnter(event)">
             </div>
         </form>
     </div>
 </body>
 </html>`;
}