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
    let row = weapon_node[0];
    let x = 0;
        x += treeview.columns[0];
        x += treeview.columns[1];
        x += treeview.columns[2];
    let rect = new tv.CellRectangle(x, pos.y, treeview.columns[3], treeview.row_height);
    // positive affinity
    if (row.affinity > 0) {
        let cell = new tv.TextCellRenderer(`+${row.affinity}%`, tv.TextAlignment.Center);
            cell.setBackgroundColor("#55ff5555");
            cell.draw(treeview, rect, pos.y / 24, 3);
    } else if (row.affinity < 0) {
        let cell = new tv.TextCellRenderer(`${row.affinity}%`, tv.TextAlignment.Center);
            cell.setBackgroundColor("#ff555555");
            cell.draw(treeview, rect, pos.y / 24, 3);
    }
    x += treeview.columns[3];
    x += treeview.columns[4];
    rect = new tv.CellRectangle(x, pos.y, treeview.columns[5], treeview.row_height);
    // add slots
    if (row.slot_1 > 0) {
        let cell = new tv.ImageCellRenderer(`images/decoration-slots-24/${row.slot_1}.png`);
            cell.draw(treeview, rect, pos.y / 24, 5);
        if (row.slot_2 > 0) {
            x += treeview.columns[5]
            rect = new tv.CellRectangle(x, pos.y, treeview.columns[6], treeview.row_height);
            let cell = new tv.ImageCellRenderer(`images/decoration-slots-24/${row.slot_2}.png`);
            cell.draw(treeview, rect, pos.y / 24, 6);
            // row.slot_3 is not needed since its never used
            // which is because there is an
            // agument that adds a decoration slot in the third slot
        }
    }

    // let indent = weapon_node[1];
    // let w_pos = weapon_node[2];
    // let indent_size = 16;

    // ctx.font = "14px Arial";
    // ctx.lineWidth = 1;
    // ctx.fillStyle = "#000000ff";
    // ctx.strokeStyle = "#000000ff";

    // // rarity + name
    // let y = pos.y;
    // let img = new Image();
    //     img.src = `images/weapons/${row.weapon_type}/rarity-24/${row.rarity}.png`;
    //     img.onload = function() {
    //         ctx.drawImage(img, 0 + indent * indent_size - indent_size, y);
    //     };
    // if (row.create_recipe_id !== null) {
    //     ctx.fillText(`${row.name} (Create)`, 24 + 5 + indent * indent_size - indent_size, pos.y + 17);
    // } else {
    //     ctx.fillText(row.name, 24 + 5 + indent * indent_size - indent_size, pos.y + 17);
    // }
    
    // // attack
    // ctx.fillText(`${row.attack} (${row.attack_true})`, 400 + 40 - ctx.measureText(`${row.attack} (${row.attack_true})`).width / 2, pos.y + 17);

    // // element + element_attack
    // if (row.element1 !== null) {
    //     y = pos.y;
    //     let img = new Image();
    //         img.src = `images/damage-types-24/${row.element1.toLowerCase()}.png`;
    //         img.onload = function() {
    //             ctx.drawImage(img, 480, y);
    //         };
    //     if (row.element_hidden === 0) {
    //         ctx.fillText(row.element1_attack, 480 + 40 + 5 - ctx.measureText(row.element1_attack).width / 2, pos.y + 17);
    //     } else {
    //         ctx.fillStyle = "#88888855"; 
    //         ctx.fillRect(480, pos.y, 80, 24);
    //         ctx.fillStyle = "#000000ff";
    //         ctx.fillText(`(${row.element1_attack})`, 480 + 40 + 5 - ctx.measureText(`(${row.element1_attack})`).width / 2, pos.y + 17);
    //     }
    // }

    // // positive affinity
    // if (row.affinity > 0) {
    //     ctx.fillStyle = "#55ff5555"; 
    //     ctx.fillRect(560, pos.y, 80, 24);
    //     ctx.fillStyle = "#000000ff"; 
    //     ctx.fillText(`+${row.affinity}%`, 560 + 40 - ctx.measureText(`+${row.affinity}%`).width / 2, pos.y + 17);
    // } else if (row.affinity < 0) {
    //     ctx.fillStyle = "#ff555555"; 
    //     ctx.fillRect(560, pos.y, 80, 24);
    //     ctx.fillStyle = "#000000ff"; 
    //     ctx.fillText(`${row.affinity}%`, 560 + 40 - ctx.measureText(`${row.affinity}%`).width / 2, pos.y + 17);
    // }

    // // elderseal
    // if (row.elderseal !== null) {
    //     let elderseal = capitalize(row.elderseal);
    //     ctx.fillStyle = "#aa55aa55"; 
    //     ctx.fillRect(640, pos.y, 80, 24);
    //     ctx.fillStyle = "#000000ff"; 
    //     ctx.fillText(elderseal, 640 + 40 - ctx.measureText(elderseal).width / 2, pos.y + 17);
    // }

    // if (!ranged) {
    //     let sharpness = row.sharpness.split(",");
    //     for (let i: number = 0; i < sharpness.length; i++) {
    //         sharpness[i] = Number(sharpness[i]) / 2;
    //     }
    //     let no_handicraft = adjust_sharpness(sharpness.slice(), row.sharpness_maxed, 0, 5);
        
    //     ctx.fillRect(774, pos.y + 1, 208, 22);

    //     ctx.fillStyle = "#d92c2cff"; 
    //     ctx.fillRect(sharpness_position(no_handicraft, 0), pos.y + 4, no_handicraft[0], 12);
    //     ctx.fillRect(sharpness_position(sharpness, 0), pos.y + 16, sharpness[0], 4);

    //     ctx.fillStyle = "#d9662cff"; 
    //     ctx.fillRect(sharpness_position(no_handicraft, 1), pos.y + 4, no_handicraft[1], 12);
    //     ctx.fillRect(sharpness_position(sharpness, 1), pos.y + 16, sharpness[1], 4);

    //     ctx.fillStyle = "#d9d12cff"; 
    //     ctx.fillRect(sharpness_position(no_handicraft, 2), pos.y + 4, no_handicraft[2], 12);
    //     ctx.fillRect(sharpness_position(sharpness, 2), pos.y + 16, sharpness[2], 4);

    //     ctx.fillStyle = "#70d92cff"; 
    //     ctx.fillRect(sharpness_position(no_handicraft, 3), pos.y + 4, no_handicraft[3], 12);
    //     ctx.fillRect(sharpness_position(sharpness, 3), pos.y + 16, sharpness[3], 4);

    //     ctx.fillStyle = "#2c86d9ff"; 
    //     ctx.fillRect(sharpness_position(no_handicraft, 4), pos.y + 4, no_handicraft[4], 12);
    //     ctx.fillRect(sharpness_position(sharpness, 4), pos.y + 16, sharpness[4], 4);

    //     ctx.fillStyle = "#f8f8f8ff"; 
    //     ctx.fillRect(sharpness_position(no_handicraft, 5), pos.y + 4, no_handicraft[5], 12);
    //     ctx.fillRect(sharpness_position(sharpness, 5), pos.y + 16, sharpness[5], 4);

    //     ctx.fillStyle = "#885aecff"; 
    //     ctx.fillRect(sharpness_position(no_handicraft, 6), pos.y + 4, no_handicraft[6], 12);
    //     ctx.fillRect(sharpness_position(sharpness, 6), pos.y + 16, sharpness[6], 4);
    // }

    // if (w_pos !== null) {
    //     ctx.lineWidth = 2;
    //     ctx.strokeStyle = "#aaaaaaff";
    //     ctx.beginPath();
    //     ctx.moveTo(w_pos[0].x - 4, w_pos[0].y + 12);
    //     ctx.lineTo(w_pos[0].x - 4, w_pos[1].y + 12);
    //     ctx.lineTo(w_pos[1].x + 12, w_pos[1].y + 12);
    //     ctx.stroke();
    // }

    pos.nextY(treeview.row_height);
}

function sharpness_position(sharpness: number[], index: number): number {
    let pos: number = 778;
    for (let i: number = 0; i < index; i++) {
        pos += sharpness[i];
    }

    return pos;
}