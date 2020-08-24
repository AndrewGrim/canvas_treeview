const sqlite3 = require("better-sqlite3");

import {Database} from "better-sqlite3";

import {TreeView} from "../treeview/mod";
import {loadDetailView, showTab} from "./detail";
import {loadContent} from "./tree";
import {TextCellRenderer, IconCellRenderer} from "../treeview/cellrenderer";
import {Alignment} from "../treeview/enums";

// Entry point of the application.
export function render(): void {
    // Set default TreeView data layout.
    let use_tree_layout = true;
    let treeview = new TreeView();
        // Set number of columns and use auto size.
        treeview.setColumnCount(9);
        // Set CellRenderers for each column heading.
        treeview.setColumnHeadings(
            {
                name: new TextCellRenderer(treeview, "Name", Alignment.Center),
                attack: new IconCellRenderer(treeview, "../../images/weapon-detail-24/attack.png", Alignment.Center),
                element: new IconCellRenderer(treeview, "../../images/weapon-detail-24/element.png", Alignment.Center),
                affinity: new IconCellRenderer(treeview, "../../images/weapon-detail-24/affinity.png", Alignment.Center),
                defense: new IconCellRenderer(treeview, "../../images/weapon-detail-24/defense.png", Alignment.Center),
                elderseal: new IconCellRenderer(treeview, "../../images/weapon-detail-24/elderseal.png", Alignment.Center),
                slot1: new IconCellRenderer(treeview, "../../images/weapon-detail-24/slots.png"),
                slot2: new IconCellRenderer(treeview, "../../images/weapon-detail-24/slots.png"),
                sharpness: new TextCellRenderer(treeview, "Sharpness", Alignment.Center)
            }
        );
        // Add callback function when a TreeView row is selected.
        treeview.bindOnRowSelected(loadDetailView);
    let db: Database = new sqlite3("mhwi.db");
    
    // Added event handlers for all the weapon buttons.
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

    // Add event handler when typing in the search box.
    document.getElementById("weapon-search").addEventListener("input", (event) => { loadContent(null, treeview, db, use_tree_layout); });

    let tree_layout = document.getElementById("tree-layout-btn");
        tree_layout.classList.add("highlight");
    let table_layout = document.getElementById("table-layout-btn");

    // Add event handlers for switching between different
    // TreeView data layout modes.
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

    // Add event handlers to switch between weapon detail tabs.
    document.getElementById("detail-tab-btn").addEventListener("click", (event) => { showTab(event); });
    document.getElementById("ammo-tab-btn").addEventListener("click", (event) => { showTab(event); });
    document.getElementById("melodies-tab-btn").addEventListener("click", (event) => { showTab(event); });

    // Load initial data.
    document.getElementById("detail-tab-btn").click();
    loadContent("great-sword", treeview, db, use_tree_layout);
}

// Adjusts the sharpness data and returns the sharpness scaled to the level of handicraft.
// Used to display and draw the weapons sharpness at each level of handicraft.
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