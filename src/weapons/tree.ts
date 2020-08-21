import {Database} from "better-sqlite3";

import {adjust_sharpness} from "./mod";
import {TreeView, Model, TreeNode} from "../treeview/mod";
import {CellRectangle, CellRenderer, TextCellRenderer, ImageCellRenderer, ImageTextCellRenderer, CellRendererInterface} from "../treeview/cellrenderer"; 
import {capitalize, Alignment} from "../utilities";

export function loadContent(current_weapon_type: string | null = "great-sword", treeview: TreeView, db: Database, use_tree_layout: boolean): void {
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
    
    let sharpness_modifier = [0.5, 0.5, 0.5, 0.75, 1.5, 3, 4];
    let ranged_weapons = ["bow", "light-bowgun", "heavy-bowgun"];
    let ranged = ranged_weapons.includes(current_weapon_type);
    let weapon_nodes = {};
    let rows = db.prepare(sql).all();
    let model = new Model();
        let iter;
        if (search_phrase.length > 0) {
            use_tree_layout = false;
        }
        for (let row of rows) {
            // TODO replace ternary operator with pattern matching or something
            let rarity_and_name = new ImageTextCellRenderer(
                `../../images/weapons/${row.weapon_type}/rarity-24/${row.rarity}.png`,
                `${row.name}${row.previous_weapon_id === null ? " (Create)" : ""}`
            );

            let attack = new TextCellRenderer(row.attack, Alignment.Center);

            let element = null;
            if (row.element1) {
                if (row.element_hidden === 0) {
                    element = new ImageTextCellRenderer(
                        `../../images/damage-types-24/${row.element1.toLowerCase()}.png`, 
                        row.element1_attack, 
                        Alignment.Center
                    );
                } else {
                    element = new ImageTextCellRenderer(
                        `../../images/damage-types-24/${row.element1.toLowerCase()}.png`, 
                        `(${row.element1_attack})`, 
                        Alignment.Center
                    ).setBackgroundColor("#88888855");
                }
            }

            let affinity = null;
            if (row.affinity > 0) {
                affinity = new TextCellRenderer(
                    `+${row.affinity}%`, Alignment.Center
                ).setBackgroundColor("#55ff5555");
            } else if (row.affinity < 0) {
                affinity = new TextCellRenderer(
                    `${row.affinity}%`, 
                    Alignment.Center
                ).setBackgroundColor("#ff555555");
            }

            let defense = 
                row.defense > 0 
                    ? new TextCellRenderer(`+${row.defense}`, Alignment.Center).setBackgroundColor("#b49b6455") 
                    : null;

            let elderseal = 
                row.elderseal !== null
                    ? new TextCellRenderer(capitalize(row.elderseal), Alignment.Center).setBackgroundColor("#aa55aa55")
                    : null;

            let slot1 = 
                row.slot_1 > 0
                ? new ImageCellRenderer(`../../images/decoration-slots-24/${row.slot_1}.png`)
                : null;

            let slot2 = 
                row.slot_2 > 0
                ? new ImageCellRenderer(`../../images/decoration-slots-24/${row.slot_2}.png`)
                : null;

            let sharpness_cell = null;
            let sharpness = null;
            if (!ranged) {
                sharpness = row.sharpness.split(",");
                for (let i: number = 0; i < sharpness.length; i++) {
                    sharpness[i] = Number(sharpness[i]) / 2;
                }
                sharpness_cell = new SharpnessCellRenderer(sharpness, row.sharpness_maxed)
            }

            let values = new TreeNode(
                {
                    rarity_and_name: rarity_and_name,
                    attack: attack,
                    element: element,
                    affinity: affinity,
                    defense: defense,
                    elderseal: elderseal,
                    slot1: slot1,
                    slot2: slot2,
                    sharpness: sharpness_cell
                },
                {
                    id: row.id,
                    element: !row.element1_attack ? 0 : row.element1_attack,
                    affinity: row.affinity,
                    defense: row.defense,
                    elderseal: matchElderseal(row.elderseal),
                    slot1: row.slot_1,
                    slot2: row.slot_2,
                    sharpness: !sharpness ? 0 : getSharpnessSortValue(sharpness.slice(), sharpness_modifier)
                }
            ); 

            iter = null;
            if (use_tree_layout) {
                if (row.previous_weapon_id === null) {
                    iter = model.append(null, values);
                } else {
                    iter = model.append(weapon_nodes[row.previous_weapon_id], values);
                }
                weapon_nodes[row.id] = iter;
            } else {
                iter = model.append(null, values);
            }
        }
        treeview.setModel(model);
        if (use_tree_layout) {
            treeview.selectRow({x: -1, y: 6});
        } else if (treeview.length() > 0) {
            treeview.selectRow({x: -1, y: 1});
        }
}

function matchElderseal(elderseal: string | null): number {
    let value;
    if (!elderseal) value = 0;
    else if (elderseal[0] === "l") value = 1;
    else if (elderseal[0] === "a") value = 2;
    else if (elderseal[0] === "h") value = 3;
    
    return value;
}

function getSharpnessSortValue(sharpness: number[], sharpness_modifier: number[]): number {
    let sharpness_sort = 0;
    for (let i = 0; i < sharpness.length; i++) {
        sharpness_sort += Math.floor(sharpness[i] * sharpness_modifier[i]);
    }
    
    return sharpness_sort;
}

class SharpnessCellRenderer extends CellRenderer implements CellRendererInterface {
    private sharpness: number[];
    private sharpness_maxed: boolean;
    public width = 0;

    constructor(sharpness: number[], sharpness_maxed: boolean) {
        super();
        this.sharpness = sharpness;
        this.sharpness_maxed = sharpness_maxed;
    }

    public draw(treeview: TreeView, ctx: any, rect: CellRectangle, row: number, col: number): void {
        if (this.getWidth(ctx) > rect.w + 2) {
            ctx.fillStyle = this.foreground_color;
            ctx.fillText("...", rect.x, rect.y + 17);
        } else {
            let no_handicraft_x = rect.y + 2;
            let no_handicraft_y = 14;
            let max_handicraft = rect.y + 16;
            let max_handicraft_y = 4;
            let no_handicraft_sharpness = adjust_sharpness(this.sharpness.slice(), this.sharpness_maxed, 0, 5);
            let x = rect.x + 2;

            ctx.fillRect(rect.x, rect.y, rect.w, rect.h);

            ctx.fillStyle = "#d92c2cff"; 
            ctx.fillRect(x, no_handicraft_x, no_handicraft_sharpness[0], no_handicraft_y);
            ctx.fillRect(x, max_handicraft, this.sharpness[0], max_handicraft_y);
            x += this.sharpness[0] - 1;

            ctx.fillStyle = "#d9662cff"; 
            ctx.fillRect(x, no_handicraft_x, no_handicraft_sharpness[1], no_handicraft_y);
            ctx.fillRect(x, max_handicraft, this.sharpness[1], max_handicraft_y);
            x += this.sharpness[1] - 1;

            ctx.fillStyle = "#d9d12cff"; 
            ctx.fillRect(x, no_handicraft_x, no_handicraft_sharpness[2], no_handicraft_y);
            ctx.fillRect(x, max_handicraft, this.sharpness[2], max_handicraft_y);
            x += this.sharpness[2] - 1;

            ctx.fillStyle = "#70d92cff"; 
            ctx.fillRect(x, no_handicraft_x, no_handicraft_sharpness[3], no_handicraft_y);
            ctx.fillRect(x, max_handicraft, this.sharpness[3], max_handicraft_y);
            x += this.sharpness[3] - 1;

            ctx.fillStyle = "#2c86d9ff"; 
            ctx.fillRect(x, no_handicraft_x, no_handicraft_sharpness[4], no_handicraft_y);
            ctx.fillRect(x, max_handicraft, this.sharpness[4], max_handicraft_y);
            x += this.sharpness[4] - 1;

            ctx.fillStyle = "#f8f8f8ff"; 
            ctx.fillRect(x, no_handicraft_x, no_handicraft_sharpness[5], no_handicraft_y);
            ctx.fillRect(x, max_handicraft, this.sharpness[5], max_handicraft_y);
            x += this.sharpness[5] - 1;

            ctx.fillStyle = "#885aecff"; 
            ctx.fillRect(x, no_handicraft_x, no_handicraft_sharpness[6], no_handicraft_y);
            ctx.fillRect(x, max_handicraft, this.sharpness[6], max_handicraft_y);
        }
    }

    public getWidth(ctx: any): number {
        this.width = 201;

        return this.width;
    }
}