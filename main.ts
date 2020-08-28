const {app, BrowserWindow, Menu, MenuItem, nativeImage} = require("electron");
const fs = require("fs");

class Settings {
    public file_path: string;
    public width: number;
    public height: number;
    public x: number;
    public y: number;
    public offset_x: number = 0;
    public offset_y: number = 0;

    constructor(file_path) {
        this.file_path = file_path;
        let default_settings = "1453\n800\n0\n0";

        // Write default settings if the settings file does not exist.
        if (!fs.existsSync(this.file_path)) {
            fs.writeFileSync(this.file_path, default_settings, (err) => { if (err) throw err; });
        }

        // Read settings file and assign attributes based on the split.
        let data = fs.readFileSync(this.file_path, 'utf8').split("\n");
        // TODO change to bounds instead and use json as the config file format
        this.width = Number(data[0]);
        this.height = Number(data[1]);
        this.x = Number(data[2]);
        this.y = Number(data[3]); 
    }

    // Sets the offset of the class.
    // This is necessary to keep the same window position over time.
    // Needs to be called after the window has been drawn.
    setOffset(window_position) {
        this.offset_x = window_position[0] - this.x;
        this.offset_y = window_position[1] - this.y;
    }

    // Updates the x and y attributes to the current window position accounting for the offset.
    updatePosition(window_position) {
        this.x = window_position[0] - this.offset_x;
        this.y = window_position[1] - this.offset_y;
    }

    // Updates the width and height attributes to the current window size.
    updateSize(size) {
        this.width = size[0];
        this.height = size[1];
    }

    // Save the current settings to file.
    save() {
        let data = `${this.width}\n${this.height}\n${this.x}\n${this.y}`;
        fs.writeFileSync(this.file_path, data, (err) => { if (err) throw err; });
    }
}

app.on("ready", () => {
    process.env["ELECTRON_DISABLE_SECURITY_WARNINGS"] = "true";
    let settings = new Settings("settings.txt")

    const win = new BrowserWindow({
        width: settings.width,
        height: settings.height,
        x: settings.x,
        y: settings.y,
        title: "Monster Hunter World: Iceborne Database",
        icon: nativeImage.createFromDataURL("data:image/png;base64,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"),
        webPreferences: {
            nodeIntegration: true
        }
    });

    const template = [
        {
            label: "File",
            submenu: [
                {
                    role: "quit"
                }
            ]
        },
        {
            label: "Edit",
            submenu: [
                {
                    role: "undo"
                },
                {
                    role: "redo"
                },
                {
                    type: "separator"
                },
                {
                    role: "cut"
                },
                {
                    role: "copy"
                },
                {
                    role: "paste"
                }
            ]
        },
        {
            label: "View",
            submenu: [
                {
                    role: "reload"
                },
                {
                    role: "toggledevtools"
                },
                {
                    type: "separator"
                },
                {
                    role: "resetzoom"
                },
                {
                    role: "zoomin"
                },
                {
                    role: "zoomout"
                },
                {
                    type: "separator"
                },
                {
                    role: "togglefullscreen"
                }
            ]
        },
    ];
    
    const menu = Menu.buildFromTemplate(template)
    Menu.setApplicationMenu(menu);

    win.on("close", (event) => {
        settings.updatePosition(win.getPosition());
        settings.updateSize(win.getSize());
        settings.save();
    });

    win.webContents.on("dom-ready", async (event) => {
        settings.setOffset(win.getPosition());
    });

    // TODO setting page for loading a certain tab
    win.loadFile("src/weapons/weapons.html");
});