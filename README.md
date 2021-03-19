# Canvas TreeView
A canvas based TreeView widget written in TypeScript and a GUI app
used to display all weapons from a database related to Monster Hunter World: Iceborne using Electron.

## Build
In order to build the project you will need to have `NodeJS` and `npm` installed.
You will also need to install `node-gyp` for npm. This is needed to compile native modules namely `better-sqlite3`.
To install it use:
```
npm install -g node-gyp
```
*NOTE: This command needs to be run as administrator.*

Afterwards you should just be able to run:
```
npm install
```
to install all project dependencies.

Finally you can use:
```
npm start
```
to compile the TypeScript code to JavaScript and run the app.

If you don't have TypeScript installed globally you can use:
```
npm run tsc
```
to recompile the source files.