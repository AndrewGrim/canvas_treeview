import {Database} from "better-sqlite3";

import {TreeView as tv} from "./treeview"; 
import {capitalize} from "../utilities";

export function loadContent(current_weapon_type: string | null = "great-sword", treeview: tv.TreeView, db: Database): void {
    treeview.selected_row = null;
    if (current_weapon_type === null) {
        current_weapon_type = treeview.current_category;
    }
    treeview.current_category = current_weapon_type;
    let search_phrase: string = (document.getElementById("weapon-search") as any).value;
    let sql = `SELECT w.id, w.previous_weapon_id, w.weapon_type, w.rarity, wt.name, w.attack, attack_true,
                    w.element1, w.element1_attack, w.element2, w.element2_attack, w.element_hidden,
                    w.affinity, w.defense, w.elderseal, w.slot_1, w.slot_2, w.sharpness, w.sharpness_maxed,
                    w.create_recipe_id, w.upgrade_recipe_id, w.category, w.notes, w.shelling, w.shelling_level, w.phial, w.phial_power,
                    w.kinsect_bonus, w.ammo_id, w.coating_close, w.coating_power, w.coating_paralysis,
                    w.coating_poison, w.coating_sleep, w.coating_blast
                FROM weapon w
                    JOIN weapon_text wt
                        ON w.id = wt.id
                WHERE wt.lang_id = 'en'
                    AND w.weapon_type = '${current_weapon_type}'
                    AND wt.name LIKE '%${search_phrase.replace("'", "''")}%'
                ORDER BY w.order_id ASC`;
    
    let ranged_weapons = ["bow", "light-bowgun", "heavy-bowgun"];
    let ranged = ranged_weapons.includes(current_weapon_type);
    let weapon_nodes = {};
    let rows = db.prepare(sql).all();
    let tree = new tv.Tree();
        let iter = null;
        if (search_phrase.length === 0) {
            for (let row of rows) {
                // TODO replace ternary operator with pattern matching or something
                let rarity_and_name = new tv.ImageTextCellRenderer(
                    `../../images/weapons/${row.weapon_type}/rarity-24/${row.rarity}.png`,
                    `${row.name}${row.previous_weapon_id === null ? " (Create)" : ""}`
                );

                let attack = new tv.TextCellRenderer(row.attack, tv.Alignment.Center);

                let element = null;
                if (row.element1) {
                    if (row.element_hidden === 0) {
                        element = new tv.ImageTextCellRenderer(
                            `../../images/damage-types-24/${row.element1.toLowerCase()}.png`, 
                            row.element1_attack, 
                            tv.Alignment.Center
                        );
                    } else {
                        element = new tv.ImageTextCellRenderer(
                            `../../images/damage-types-24/${row.element1.toLowerCase()}.png`, 
                            `(${row.element1_attack})`, 
                            tv.Alignment.Center
                        ).setBackgroundColor("#88888855");
                    }
                }

                let affinity = null;
                if (row.affinity > 0) {
                    affinity = new tv.TextCellRenderer(
                        `+${row.affinity}%`, tv.Alignment.Center
                    ).setBackgroundColor("#55ff5555");
                } else if (row.affinity < 0) {
                    affinity = new tv.TextCellRenderer(
                        `${row.affinity}%`, 
                        tv.Alignment.Center
                    ).setBackgroundColor("#ff555555");
                }

                let defense = 
                    row.defense > 0 
                        ? new tv.TextCellRenderer(`+${row.defense}`, tv.Alignment.Center).setBackgroundColor("#b49b6455") 
                        : null;

                let elderseal = 
                    row.elderseal !== null
                        ? new tv.TextCellRenderer(capitalize(row.elderseal), tv.Alignment.Center).setBackgroundColor("#aa55aa55")
                        : null;

                let slot1 = 
                    row.slot_1 > 0
                    ? new tv.ImageCellRenderer(`../../images/decoration-slots-24/${row.slot_1}.png`)
                    : null;

                let slot2 = 
                    row.slot_2 > 0
                    ? new tv.ImageCellRenderer(`../../images/decoration-slots-24/${row.slot_2}.png`)
                    : null;

                let sharpness = null;
                if (!ranged) {
                    sharpness = row.sharpness.split(",");
                    for (let i: number = 0; i < sharpness.length; i++) {
                        sharpness[i] = Number(sharpness[i]) / 2;
                    }
                    sharpness = new tv.SharpnessCellRenderer(sharpness, row.sharpness_maxed)
                }

                // TODO handle null CellRenderers by just not drawing that cell
                let values = new tv.TreeNode(
                    {
                        rarity_and_name: rarity_and_name,
                        attack: attack,
                        element: element,
                        affinity: affinity,
                        defense: defense,
                        elderseal: elderseal,
                        slot1: slot1,
                        slot2: slot2,
                        sharpness: sharpness
                    },
                    {
                        id: row.id
                    }
                ); 

                if (row.previous_weapon_id === null) {
                    iter = tree.append(null, values);
                } else {
                    iter = tree.append(weapon_nodes[row.previous_weapon_id], values);
                }
            
                weapon_nodes[row.id] = iter;
            }
            treeview.setModel(tree);
            treeview.selectRow(6);
        } else {
            // for (let row of rows) {
            //     tree.append(null, new tv.TreeNode(row));
            // }
            // treeview.setData(tree);
            // if (treeview.length() > 0) {
            //     treeview.selectRow(1);
            // }
        }
}