# tws5_dashboard
A dashboard for TSW5. Written in JS. Clones the games HUD. Runs a webserver for access accross your local network for things like cellphones or tablets. IF you have three monitors you can run this and use your phone for a HUD and place it under the center monitor. 

Setup and Installation

// In a Windows Powershell

// Set permissions so you can install node packages in windows powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

// Reversing the permissions if and when you need to
Set-ExecutionPolicy -ExecutionPolicy Restricted -Scope CurrentUser

// Get a list of permissions
Get-ExecutionPolicy -List

// install nvm-setup.exe from here
https://github.com/coreybutler/nvm-windows/releases

// Install node 24.12.0
nvm --version
nvm install 24.12.0
nvm use 24.12.0
node -v

// Look for your computers internal network IP
// It will look something like this 192.168.12.88
// It will be listed next to "IPv4 Address" after running the command "ipconfig"
ipconfig

// Open the program folder up in VS code 
// You will need to change the following values in the file "server.js"
const apiKeyPath = 'C:\\Users\\<YOUR_USER_HERE>\\Documents\\My Games\\TrainSimWorld5\\Saved\\Config\\CommAPIKey.txt';

// cd to the program folder and run
node ./server.js

// to see the running application open a browser and enter this URL 
localhost:3000

// to see the application running from your phone or other networked device type
// your computers network ip address with the port number 3000, it should look something like this
192.168.12.88:3000


