import {Database as sqlite3} from "better-sqlite3";

import {TreeView as tv} from "./TreeView"; 
import {adjust_sharpness} from "./mod";
import {capitalize} from "./utilities";

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

export function loadContent(current_weapon_type: string | null = "great-sword", treeview: tv.TreeView, db: sqlite3): void {
    if (current_weapon_type === null) {
        current_weapon_type = treeview.current_category;
    }
    treeview.current_category = current_weapon_type;
    let search_phrase: string = (document.getElementById("weapon-search") as any).value;
    let canvas: any = document.getElementById("data-layer");
    let count_sql =`SELECT COUNT(w.id)
                    FROM weapon w
                        JOIN weapon_text wt
                            ON w.id = wt.id
                    WHERE wt.lang_id = 'en'
                        AND w.weapon_type = '${current_weapon_type}'
                        AND wt.name LIKE '%${search_phrase.replace("'", "''")}%'`;
    let row  = db.prepare(count_sql).get();
    let new_height = row["COUNT(w.id)"] * treeview.row_height;
    canvas.height = new_height;
    (document.getElementById("ui-layer") as any).height = new_height;
    (document.getElementById("interaction-layer") as any).height = new_height;
    treeview.drawGridLines();

    let ctx = canvas.getContext("2d");
    let sql = `SELECT w.id, w.previous_weapon_id, w.weapon_type, w.rarity, wt.name, w.attack, attack_true,
                    w.element1, w.element1_attack, w.element2, w.element2_attack, w.element_hidden,
                    w.affinity, w.defense, w.elderseal, w.slot_1, w.slot_2, w.sharpness, w.sharpness_maxed,
                    w.create_recipe_id, w.category, w.notes, w.shelling, w.shelling_level, w.phial, w.phial_power,
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
        treeview.data = rows;
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
            drawRow(ctx, pos, [row, indent, coord], ranged);
        }

        // Select the first in-game weapon.
        if (search_phrase.length === 0) {
            treeview.selectRow(6);
        }
}

function drawRow(ctx: any, pos: Position, weapon_node: [any, number, object], ranged: boolean): void {
    let row = weapon_node[0];
    let indent = weapon_node[1];
    let w_pos = weapon_node[2];
    let indent_size = 16;

    ctx.font = "14px Arial";
    ctx.lineWidth = 1;
    ctx.fillStyle = "#000000ff";
    ctx.strokeStyle = "#000000ff";

    // rarity + name
    let y = pos.y;
    let img = new Image();
        img.src = `images/weapons/${row.weapon_type}/rarity-24/${row.rarity}.png`;
        img.onload = function() {
            ctx.drawImage(img, 0 + indent * indent_size - indent_size, y);
        };
    if (row.create_recipe_id !== null) {
        ctx.fillText(`${row.name} (Create)`, 24 + 5 + indent * indent_size - indent_size, pos.y + 17);
    } else {
        ctx.fillText(row.name, 24 + 5 + indent * indent_size - indent_size, pos.y + 17);
    }
    
    // attack
    ctx.fillText(`${row.attack} (${row.attack_true})`, 400 + 40 - ctx.measureText(`${row.attack} (${row.attack_true})`).width / 2, pos.y + 17);

    // element + element_attack
    if (row.element1 !== null) {
        y = pos.y;
        let img = new Image();
            img.src = `images/damage-types-24/${row.element1.toLowerCase()}.png`;
            img.onload = function() {
                ctx.drawImage(img, 480, y);
            };
        if (row.element_hidden === 0) {
            ctx.fillText(row.element1_attack, 480 + 40 + 5 - ctx.measureText(row.element1_attack).width / 2, pos.y + 17);
        } else {
            ctx.fillStyle = "#88888855"; 
            ctx.fillRect(480, pos.y, 80, 24);
            ctx.fillStyle = "#000000ff";
            ctx.fillText(`(${row.element1_attack})`, 480 + 40 + 5 - ctx.measureText(`(${row.element1_attack})`).width / 2, pos.y + 17);
        }
    }

    // positive affinity
    if (row.affinity > 0) {
        ctx.fillStyle = "#55ff5555"; 
        ctx.fillRect(560, pos.y, 80, 24);
        ctx.fillStyle = "#000000ff"; 
        ctx.fillText(`+${row.affinity}%`, 560 + 40 - ctx.measureText(`+${row.affinity}%`).width / 2, pos.y + 17);
    } else if (row.affinity < 0) {
        ctx.fillStyle = "#ff555555"; 
        ctx.fillRect(560, pos.y, 80, 24);
        ctx.fillStyle = "#000000ff"; 
        ctx.fillText(`${row.affinity}%`, 560 + 40 - ctx.measureText(`${row.affinity}%`).width / 2, pos.y + 17);
    }

    // elderseal
    if (row.elderseal !== null) {
        let elderseal = capitalize(row.elderseal);
        ctx.fillStyle = "#aa55aa55"; 
        ctx.fillRect(640, pos.y, 80, 24);
        ctx.fillStyle = "#000000ff"; 
        ctx.fillText(elderseal, 640 + 40 - ctx.measureText(elderseal).width / 2, pos.y + 17);
    }

    // add slots
    if (row.slot_1 > 0) {
        let img = new Image();
            img.src = `images/decoration-slots-24/${row.slot_1}.png`;
            img.onload = function() {
                ctx.drawImage(img, 720, y);
            };
        if (row.slot_2 > 0) {
            let img = new Image();
                img.src = `images/decoration-slots-24/${row.slot_2}.png`;
                img.onload = function() {
                    ctx.drawImage(img, 749, y);
                };
            // row.slot_3 is not needed since its never used
            // which is because there is an
            // agument that adds a decoration option in the third slot
        }
    }

    if (!ranged) {
        let sharpness = row.sharpness.split(",");
        for (let i: number = 0; i < sharpness.length; i++) {
            sharpness[i] = Number(sharpness[i]) / 2;
        }
        let no_handicraft = adjust_sharpness(sharpness.slice(), row.sharpness_maxed, 0, 5);
        
        ctx.fillRect(774, pos.y + 1, 208, 22);

        ctx.fillStyle = "#d92c2cff"; 
        ctx.fillRect(sharpness_position(no_handicraft, 0), pos.y + 4, no_handicraft[0], 12);
        ctx.fillRect(sharpness_position(sharpness, 0), pos.y + 16, sharpness[0], 4);

        ctx.fillStyle = "#d9662cff"; 
        ctx.fillRect(sharpness_position(no_handicraft, 1), pos.y + 4, no_handicraft[1], 12);
        ctx.fillRect(sharpness_position(sharpness, 1), pos.y + 16, sharpness[1], 4);

        ctx.fillStyle = "#d9d12cff"; 
        ctx.fillRect(sharpness_position(no_handicraft, 2), pos.y + 4, no_handicraft[2], 12);
        ctx.fillRect(sharpness_position(sharpness, 2), pos.y + 16, sharpness[2], 4);

        ctx.fillStyle = "#70d92cff"; 
        ctx.fillRect(sharpness_position(no_handicraft, 3), pos.y + 4, no_handicraft[3], 12);
        ctx.fillRect(sharpness_position(sharpness, 3), pos.y + 16, sharpness[3], 4);

        ctx.fillStyle = "#2c86d9ff"; 
        ctx.fillRect(sharpness_position(no_handicraft, 4), pos.y + 4, no_handicraft[4], 12);
        ctx.fillRect(sharpness_position(sharpness, 4), pos.y + 16, sharpness[4], 4);

        ctx.fillStyle = "#f8f8f8ff"; 
        ctx.fillRect(sharpness_position(no_handicraft, 5), pos.y + 4, no_handicraft[5], 12);
        ctx.fillRect(sharpness_position(sharpness, 5), pos.y + 16, sharpness[5], 4);

        ctx.fillStyle = "#885aecff"; 
        ctx.fillRect(sharpness_position(no_handicraft, 6), pos.y + 4, no_handicraft[6], 12);
        ctx.fillRect(sharpness_position(sharpness, 6), pos.y + 16, sharpness[6], 4);
    }

    if (w_pos !== null) {
        ctx.lineWidth = 2;
        ctx.strokeStyle = "#aaaaaaff";
        ctx.beginPath();
        ctx.moveTo(w_pos[0].x - 4, w_pos[0].y + 12);
        ctx.lineTo(w_pos[0].x - 4, w_pos[1].y + 12);
        ctx.lineTo(w_pos[1].x + 12, w_pos[1].y + 12);
        ctx.stroke();
    }

    pos.nextY(24);
}

function sharpness_position(sharpness: number[], index: number): number {
    let pos: number = 778;
    for (let i: number = 0; i < index; i++) {
        pos += sharpness[i];
    }

    return pos;
}