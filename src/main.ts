const electron = require("electron");
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
        let default_settings = "1470\n800\n0\n0";

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

electron.app.on("ready", () => {
    process.env["ELECTRON_DISABLE_SECURITY_WARNINGS"] = "true";
    let settings = new Settings("settings.txt")

    const win = new electron.BrowserWindow({
        width: settings.width,
        height: settings.height,
        x: settings.x,
        y: settings.y,
        title: "Monster Hunter World: Iceborne Database",
        // TODO change to an embedded image
        //icon: "images/Nergigante.png",
        webPreferences: {
            nodeIntegration: true
        }
    });

    win.on("close", (event) => {
        settings.updatePosition(win.getPosition());
        settings.updateSize(win.getSize());
        settings.save();
    });

    win.webContents.on("dom-ready", async (event) => {
        settings.setOffset(win.getPosition());
    });

    // TODO setting page for loading a certain tab
    win.loadFile("weapons.html");
});