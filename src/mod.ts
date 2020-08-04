const sqlite3 = require("better-sqlite3");

import {Database as sqlite3} from "better-sqlite3";

import {TreeView as tv} from "./TreeView";
import {loadDetailView} from "./detail";
import {loadContent} from "./tree";

window.addEventListener("load", (event) => { render(); });

export function render(): void {
    let treeview = new tv.TreeView();
        treeview.bindOnRowSelected(loadDetailView);
    let db: sqlite3 = new sqlite3("mhwi.db");
    
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