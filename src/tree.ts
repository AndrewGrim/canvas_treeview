import {Database} from "better-sqlite3";

import {TreeView as tv} from "./treeview"; 
import {adjust_sharpness} from "./mod";
import {capitalize} from "./utilities";
import { table } from "console";

class Position {
    public x: number;
    public y: number;

    constructor()  {
        this.x = 0;
        this.y = 0;
    }

    nextX(increment_x: number): number {
        this.x += increment_x;

        return this.x;
    }

    nextY(increment_y: number): number {
        this.y += increment_y;
        
        return this.y;
    }
}

export function loadContent(current_weapon_type: string | null = "great-sword", treeview: tv.TreeView, db: Database): void {
    treeview.selected_row = null;
    if (current_weapon_type === null) {
        current_weapon_type = treeview.current_category;
    }
    treeview.current_category = current_weapon_type;
    let search_phrase: string = (document.getElementById("weapon-search") as any).value;
    let canvas: any = document.getElementById("data-layer");
    let ctx = canvas.getContext("2d");
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
    
    let pos = new Position();
    let ranged_weapons = ["bow", "light-bowgun", "heavy-bowgun"];
    let ranged = ranged_weapons.includes(current_weapon_type);
    let weapon_nodes = {};
    let indent = 0;
    let rows = db.prepare(sql).all();
        treeview.setData(rows);
        for (let row of rows) {
            if (row.previous_weapon_id === null || search_phrase.length > 0) {
                indent = 0;
            } else {
                indent = weapon_nodes[row.previous_weapon_id][1];
            }
            
            indent += 1;
            if (search_phrase.length === 0) weapon_nodes[row.id] = [row, indent, {x: 0 + indent * 16, y: pos.y}];
            let coord = null;
            if (row.previous_weapon_id !== null && search_phrase.length === 0) coord = [weapon_nodes[row.previous_weapon_id][2], {x: 0 + indent * 16 - 16, y: pos.y}];
            drawRow(treeview, ctx, pos, [row, indent, coord], ranged);
        }

        // Select the first in-game weapon.
        if (search_phrase.length === 0) {
            treeview.selectRow(6);
        } else if (treeview.data.length > 0) {
            treeview.selectRow(1);
        }
}

function drawRow(treeview, ctx: any, pos: Position, weapon_node: [any, number, object], ranged: boolean): void {
    ctx.font = "14px Arial";
    ctx.lineWidth = 1;
    ctx.fillStyle = "#000000ff";
    ctx.strokeStyle = "#000000ff";
    
    let row = weapon_node[0];
    let x = 0;
    let rect = null;
    let cell = null;

    // rarity + name
    let indent = weapon_node[1];
    let w_pos = weapon_node[2];
    let indent_size = 16;

    rect = new tv.CellRectangle(x + indent * indent_size - indent_size, pos.y, treeview.columns[0] - indent * indent_size - indent_size, treeview.row_height);
    if (row.create_recipe_id !== null) {
        cell = new tv.ImageTextCellRenderer(`images/weapons/${row.weapon_type}/rarity-24/${row.rarity}.png`, `${row.name} (Create)`, tv.TextAlignment.Left);
        cell.draw(treeview, rect, pos.y / 24, 2);
    } else {
        cell = new tv.ImageTextCellRenderer(`images/weapons/${row.weapon_type}/rarity-24/${row.rarity}.png`, row.name, tv.TextAlignment.Left);
        cell.draw(treeview, rect, pos.y / 24, 2);
    }
    x += treeview.columns[0];

    // attack
    rect = new tv.CellRectangle(x, pos.y, treeview.columns[1], treeview.row_height);
    cell = new tv.TextCellRenderer(row.attack, tv.TextAlignment.Center);
    cell.draw(treeview, rect, pos.y / 24, 1);
    x += treeview.columns[1];

    // element + element_attack
    if (row.element1 !== null) {
        rect = new tv.CellRectangle(x, pos.y, treeview.columns[2], treeview.row_height);
        if (row.element_hidden === 0) {
            cell = new tv.ImageTextCellRenderer(`images/damage-types-24/${row.element1.toLowerCase()}.png`, row.element1_attack, tv.TextAlignment.Center);
            cell.draw(treeview, rect, pos.y / 24, 2);
        } else {
            cell = new tv.ImageTextCellRenderer(`images/damage-types-24/${row.element1.toLowerCase()}.png`, `(${row.element1_attack})`, tv.TextAlignment.Center);
            cell.setBackgroundColor("#88888855");
            cell.draw(treeview, rect, pos.y / 24, 2);
        }
    }
    x += treeview.columns[2];
        
    // affinity
    rect = new tv.CellRectangle(x, pos.y, treeview.columns[3], treeview.row_height);
    if (row.affinity > 0) {
        cell = new tv.TextCellRenderer(`+${row.affinity}%`, tv.TextAlignment.Center);
        cell.setBackgroundColor("#55ff5555");
        cell.draw(treeview, rect, pos.y / 24, 3);
    } else if (row.affinity < 0) {
        cell = new tv.TextCellRenderer(`${row.affinity}%`, tv.TextAlignment.Center);
        cell.setBackgroundColor("#ff555555");
        cell.draw(treeview, rect, pos.y / 24, 3);
    }
    x += treeview.columns[3];

    // defense
    rect = new tv.CellRectangle(x, pos.y, treeview.columns[4], treeview.row_height);
    if (row.defense > 0) {
        cell = new tv.TextCellRenderer(`+${row.defense}`, tv.TextAlignment.Center);
        cell.setBackgroundColor("#b49b6455");
        cell.draw(treeview, rect, pos.y / 24, 4);
    }
    x += treeview.columns[4];

    // elderseal
    rect = new tv.CellRectangle(x, pos.y, treeview.columns[5], treeview.row_height);
    if (row.elderseal !== null) {
        let elderseal = capitalize(row.elderseal);
        cell = new tv.TextCellRenderer(elderseal, tv.TextAlignment.Center);
        cell.setBackgroundColor("#aa55aa55");
        cell.draw(treeview, rect, pos.y / 24, 5);
    }
    x += treeview.columns[5];

    // add slots
    rect = new tv.CellRectangle(x, pos.y, treeview.columns[6], treeview.row_height);
    if (row.slot_1 > 0) {
        cell = new tv.ImageCellRenderer(`images/decoration-slots-24/${row.slot_1}.png`);
        cell.draw(treeview, rect, pos.y / 24, 6);
    }
    x += treeview.columns[6]
    if (row.slot_2 > 0) {
        rect = new tv.CellRectangle(x, pos.y, treeview.columns[6], treeview.row_height);
        cell = new tv.ImageCellRenderer(`images/decoration-slots-24/${row.slot_2}.png`);
        cell.draw(treeview, rect, pos.y / 24, 7);
    }
    x += treeview.columns[7]
    

    // sharpness
    if (!ranged) {
        rect = new tv.CellRectangle(x, pos.y, treeview.columns[8], treeview.row_height);
        let sharpness = row.sharpness.split(",");
        for (let i: number = 0; i < sharpness.length; i++) {
            sharpness[i] = Number(sharpness[i]) / 2;
        }
        cell = new tv.SharpnessCellRenderer(sharpness, row.sharpness_maxed);
        cell.draw(treeview, rect, pos.y / 24, 8);
    }
    x += treeview.columns[8]

    // node lines
    if (w_pos !== null) {
        ctx.lineWidth = 2;
        ctx.strokeStyle = "#aaaaaaff";
        ctx.beginPath();
        ctx.moveTo(w_pos[0].x - 4, w_pos[0].y + 12);
        ctx.lineTo(w_pos[0].x - 4, w_pos[1].y + 12);
        ctx.lineTo(w_pos[1].x + 12, w_pos[1].y + 12);
        ctx.stroke();
    }

    pos.nextY(treeview.row_height);
}