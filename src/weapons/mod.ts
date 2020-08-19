const sqlite3 = require("better-sqlite3");

import {Database} from "better-sqlite3";

import {TreeView} from "../treeview/mod";
import {loadDetailView, showTab} from "./detail";
import {loadContent} from "./tree";
import {TextCellRenderer, ImageCellRenderer} from "../treeview/cellrenderer";
import {Alignment} from "../utilities";

export function render(): void {
    let use_tree_layout = true;
    let treeview = new TreeView();
        treeview.setColumnCount(9);
        // treeview.setColumns([444, 50, 70, 50, 50, 60, 26, 26, 201]);
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
    
    document.getElementById("great-sword-btn").addEventListener("click", (event) => { loadContent("great-sword", treeview, db, use_tree_layout); });
    document.getElementById("long-sword-btn").addEventListener("click", (event) => { loadContent("long-sword", treeview, db, use_tree_layout); });
    document.getElementById("sword-and-shield-btn").addEventListener("click", (event) => { loadContent("sword-and-shield", treeview, db, use_tree_layout); });
    document.getElementById("dual-blades-btn").addEventListener("click", (event) => { loadContent("dual-blades", treeview, db, use_tree_layout); });
    document.getElementById("hammer-btn").addEventListener("click", (event) => { loadContent("hammer", treeview, db, use_tree_layout); });
    document.getElementById("hunting-horn-btn").addEventListener("click", (event) => { loadContent("hunting-horn", treeview, db, use_tree_layout); });
    document.getElementById("lance-btn").addEventListener("click", (event) => { loadContent("lance", treeview, db, use_tree_layout); });
    document.getElementById("gunlance-btn").addEventListener("click", (event) => { loadContent("gunlance", treeview, db, use_tree_layout); });
    document.getElementById("switch-axe-btn").addEventListener("click", (event) => { loadContent("switch-axe", treeview, db, use_tree_layout); });
    document.getElementById("charge-blade-btn").addEventListener("click", (event) => { loadContent("charge-blade", treeview, db, use_tree_layout); });
    document.getElementById("insect-glaive-btn").addEventListener("click", (event) => { loadContent("insect-glaive", treeview, db, use_tree_layout); });
    document.getElementById("light-bowgun-btn").addEventListener("click", (event) => { loadContent("light-bowgun", treeview, db, use_tree_layout); });
    document.getElementById("heavy-bowgun-btn").addEventListener("click", (event) => { loadContent("heavy-bowgun", treeview, db, use_tree_layout); });
    document.getElementById("bow-btn").addEventListener("click", (event) => { loadContent("bow", treeview, db, use_tree_layout); });

    document.getElementById("weapon-search").addEventListener("input", (event) => { loadContent(null, treeview, db, use_tree_layout); });

    let tree_layout = document.getElementById("tree-layout-btn");
        tree_layout.classList.add("highlight");
    let table_layout = document.getElementById("table-layout-btn");

    tree_layout.addEventListener("click", (event) => {
        tree_layout.classList.add("highlight");
        table_layout.classList.remove("highlight");

        use_tree_layout = true;
        loadContent(null, treeview, db, use_tree_layout);
    });
    table_layout.addEventListener("click", (event) => {
        table_layout.classList.add("highlight");
        tree_layout.classList.remove("highlight");

        use_tree_layout = false;
        loadContent(null, treeview, db, use_tree_layout);
    });
    document.getElementById("detail-tab-btn").addEventListener("click", (event) => { showTab(event); });
    document.getElementById("ammo-tab-btn").addEventListener("click", (event) => { showTab(event); });
    document.getElementById("melodies-tab-btn").addEventListener("click", (event) => { showTab(event); });

    document.getElementById("detail-tab-btn").click();
    loadContent("great-sword", treeview, db, use_tree_layout);
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