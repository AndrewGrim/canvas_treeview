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
    let rows = db.prepare(sql).all();
        treeview.setData(rows);
        let tree = new tv.Tree();
        let iter = null;
        if (search_phrase.length === 0) {
            for (let row of rows) {
                let node = null;
                if (row.previous_weapon_id === null) {
                    node = new tv.TreeNode(row);
                    iter = tree.append(null, node);
                } else {
                    node = new tv.TreeNode(row);
                    iter = tree.append(weapon_nodes[row.previous_weapon_id], node);
                }
                weapon_nodes[row.id] = iter;
            }
            drawTree(treeview, ctx, pos, tree, ranged)
            treeview.selectRow(6);
        } else {
            for (let row of rows) {
                tree.append(null, new tv.TreeNode(row));
            }
            drawTree(treeview, ctx, pos, tree, ranged)
            if (treeview.data.length > 0) {
                treeview.selectRow(1);
            }
        }
}

function drawRow(treeview, ctx: any, pos: Position, node: tv.TreeNode, ranged: boolean): void {
    ctx.font = "14px Arial";
    ctx.lineWidth = 1;
    ctx.fillStyle = "#000000ff";
    ctx.strokeStyle = "#000000ff";
    
    let row = node.data as any;
    let x = 0;
    let rect = null;
    let cell = null;

    // rarity + name
    let indent = node.iter.path.length - 1;
    let indent_size = 16;

    rect = new tv.CellRectangle(x + indent * indent_size, pos.y, treeview.columns[0] - indent * indent_size, treeview.row_height);
    if (row.create_recipe_id !== null) {
        cell = new tv.ImageTextCellRenderer(`images/weapons/${row.weapon_type}/rarity-24/${row.rarity}.png`, `${row.name} (Create)`, tv.Alignment.Left);
        cell.draw(treeview, rect, pos.y / 24, 2);
    } else {
        cell = new tv.ImageTextCellRenderer(`images/weapons/${row.weapon_type}/rarity-24/${row.rarity}.png`, row.name, tv.Alignment.Left);
        cell.draw(treeview, rect, pos.y / 24, 2);
    }
    x += treeview.columns[0];

    // attack
    rect = new tv.CellRectangle(x, pos.y, treeview.columns[1], treeview.row_height);
    cell = new tv.TextCellRenderer(row.attack, tv.Alignment.Center);
    cell.draw(treeview, rect, pos.y / 24, 1);
    x += treeview.columns[1];

    // element + element_attack
    if (row.element1 !== null) {
        rect = new tv.CellRectangle(x, pos.y, treeview.columns[2], treeview.row_height);
        if (row.element_hidden === 0) {
            cell = new tv.ImageTextCellRenderer(`images/damage-types-24/${row.element1.toLowerCase()}.png`, row.element1_attack, tv.Alignment.Center);
            cell.draw(treeview, rect, pos.y / 24, 2);
        } else {
            cell = new tv.ImageTextCellRenderer(`images/damage-types-24/${row.element1.toLowerCase()}.png`, `(${row.element1_attack})`, tv.Alignment.Center);
            cell.setBackgroundColor("#88888855");
            cell.draw(treeview, rect, pos.y / 24, 2);
        }
    }
    x += treeview.columns[2];
        
    // affinity
    rect = new tv.CellRectangle(x, pos.y, treeview.columns[3], treeview.row_height);
    if (row.affinity > 0) {
        cell = new tv.TextCellRenderer(`+${row.affinity}%`, tv.Alignment.Center);
        cell.setBackgroundColor("#55ff5555");
        cell.draw(treeview, rect, pos.y / 24, 3);
    } else if (row.affinity < 0) {
        cell = new tv.TextCellRenderer(`${row.affinity}%`, tv.Alignment.Center);
        cell.setBackgroundColor("#ff555555");
        cell.draw(treeview, rect, pos.y / 24, 3);
    }
    x += treeview.columns[3];

    // defense
    rect = new tv.CellRectangle(x, pos.y, treeview.columns[4], treeview.row_height);
    if (row.defense > 0) {
        cell = new tv.TextCellRenderer(`+${row.defense}`, tv.Alignment.Center);
        cell.setBackgroundColor("#b49b6455");
        cell.draw(treeview, rect, pos.y / 24, 4);
    }
    x += treeview.columns[4];

    // elderseal
    rect = new tv.CellRectangle(x, pos.y, treeview.columns[5], treeview.row_height);
    if (row.elderseal !== null) {
        let elderseal = capitalize(row.elderseal);
        cell = new tv.TextCellRenderer(elderseal, tv.Alignment.Center);
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
}

function drawTree(treeview: tv.TreeView, ctx: any, pos: Position, tree: tv.Tree, ranged: boolean) {
    let indent_size = 16;

    for (let root of tree.tree) {
        tree.descend(root, (node) => {
            let indent = node.iter.path.length;
            let children_count = node.children.length;
            if (children_count > 0) {
                ctx.lineWidth = 2;
                ctx.strokeStyle = "#aaaaaaff";
                ctx.beginPath();
                ctx.moveTo(indent * indent_size - 4, pos.y + 12);
                ctx.lineTo(indent * indent_size - 4, pos.y + (1 * 24) + 12);
                ctx.lineTo(indent * indent_size + 12, pos.y + (1 * 24) + 12);
                ctx.stroke();
                if (children_count > 1) {
                    let count = 1;
                    for (let c = 0; c < node.children.length - 1; c++) {
                        tree.descend(node.children[c], (_node) => {
                            count++;
                        });
                        ctx.moveTo(indent * indent_size - 4, pos.y + 12);
                        ctx.lineTo(indent * indent_size - 4, pos.y + (count * 24) + 12);
                        ctx.lineTo(indent * indent_size + 12, pos.y + (count * 24) + 12);
                        ctx.stroke();
                    }
                }
            }
            drawRow(treeview, ctx, pos, node, ranged);
            pos.nextY(treeview.row_height);
        });
    }
}