const sqlite3 = require("better-sqlite3");

import {Database} from "better-sqlite3";

import {TreeView} from "../treeview/mod";
import {loadDetailView, showTab} from "./detail";
import {loadContent} from "./tree";
import {TextCellRenderer, ImageCellRenderer} from "../treeview/cellrenderer";
import {Alignment} from "../utilities";

export function render(): void {
    let treeview = new TreeView();
        treeview.setColumns([448, 50, 70, 50, 50, 60, 24, 24, 206]);
        treeview.setColumnHeadings(
            {
                name: new TextCellRenderer("Name", Alignment.Center),
                attack: new ImageCellRenderer("../../images/weapon-detail-24/attack.png", Alignment.Center),
                element: new ImageCellRenderer("../../images/weapon-detail-24/element.png", Alignment.Center),
                affinity: new ImageCellRenderer("../../images/weapon-detail-24/affinity.png", Alignment.Center),
                defense: new ImageCellRenderer("../../images/weapon-detail-24/defense.png", Alignment.Center),
                elderseal: new ImageCellRenderer("../../images/weapon-detail-24/elderseal.png", Alignment.Center),
                slot1: new ImageCellRenderer("../../images/weapon-detail-24/slots.png"),
                slot2: new ImageCellRenderer("../../images/weapon-detail-24/slots.png"),
                sharpness: new TextCellRenderer("Sharpness", Alignment.Center)
            }
        );
        treeview.bindOnRowSelected(loadDetailView);
    let db: Database = new sqlite3("mhwi.db");
    
    document.getElementById("great-sword-btn").addEventListener("click", (event) => { loadContent("great-sword", treeview, db); });
    document.getElementById("long-sword-btn").addEventListener("click", (event) => { loadContent("long-sword", treeview, db); });
    document.getElementById("sword-and-shield-btn").addEventListener("click", (event) => { loadContent("sword-and-shield", treeview, db); });
    document.getElementById("dual-blades-btn").addEventListener("click", (event) => { loadContent("dual-blades", treeview, db); });
    document.getElementById("hammer-btn").addEventListener("click", (event) => { loadContent("hammer", treeview, db); });
    document.getElementById("hunting-horn-btn").addEventListener("click", (event) => { loadContent("hunting-horn", treeview, db); });
    document.getElementById("lance-btn").addEventListener("click", (event) => { loadContent("lance", treeview, db); });
    document.getElementById("gunlance-btn").addEventListener("click", (event) => { loadContent("gunlance", treeview, db); });
    document.getElementById("switch-axe-btn").addEventListener("click", (event) => { loadContent("switch-axe", treeview, db); });
    document.getElementById("charge-blade-btn").addEventListener("click", (event) => { loadContent("charge-blade", treeview, db); });
    document.getElementById("insect-glaive-btn").addEventListener("click", (event) => { loadContent("insect-glaive", treeview, db); });
    document.getElementById("light-bowgun-btn").addEventListener("click", (event) => { loadContent("light-bowgun", treeview, db); });
    document.getElementById("heavy-bowgun-btn").addEventListener("click", (event) => { loadContent("heavy-bowgun", treeview, db); });
    document.getElementById("bow-btn").addEventListener("click", (event) => { loadContent("bow", treeview, db); });
    document.getElementById("weapon-search").addEventListener("input", (event) => { loadContent(null, treeview, db); });

    document.getElementById("detail-tab-btn").addEventListener("click", (event) => { showTab(event); });
    document.getElementById("ammo-tab-btn").addEventListener("click", (event) => { showTab(event); });
    document.getElementById("melodies-tab-btn").addEventListener("click", (event) => { showTab(event); });

    document.getElementById("detail-tab-btn").click();
    loadContent("great-sword", treeview, db);
}

export function adjust_sharpness(sharpness: number[], maxed: boolean, handicraft_level: number, modifier: number = 10): number[] {
    if (maxed) return sharpness;

    let handicraft: number = modifier * (5 - handicraft_level); 
    for (let i: number = 6; i !== 0; i--) {
        if (handicraft === 0) return sharpness;
        if (sharpness[i] !== 0) {
            let min: number = Math.min(handicraft, sharpness[i]);
            handicraft -= min;
            sharpness[i] -= min;
        }
    }

    return sharpness;
}