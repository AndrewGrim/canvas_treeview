const sqlite3 = require("sqlite3");

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

enum InteractionEvent {
    RowSelected = "RowSelected",
}

class TreeViewEvent {
    public event: InteractionEvent;
    public row: number | null;
    public data: object | null;

    constructor(event: InteractionEvent, row: number = null, data: object = null) {
        this.event = event;
        this.row = row;
        this.data = data;
    }
}

class TreeView {
    public selected_row: number = null;
    public selection_color: string = "#1111ff55"
    public row_height: number = 24;
    public header_height: number = 24;
    public data: object[];

    private interaction_canvas: any;
    private interaction_context: any;
    private selected_row_callback: (event: TreeViewEvent) => void = null;
    
    constructor() {
        this.interaction_canvas = document.getElementById("interaction-layer");
        this.interaction_context = this.interaction_canvas.getContext("2d");
    }

    public selectRow(row: number): void {
        this.clearSelection();
        this.drawSelection(row);
        this.selected_row = row;

        if (this.selected_row_callback !== null) {
            this.selected_row_callback(new TreeViewEvent(
                    InteractionEvent.RowSelected,
                    row,
                    this.data[row - 1]
                )
            );
        }
    }

    public bindOnRowSelected(fn: (event: TreeViewEvent) => void): void {
        this.selected_row_callback = fn;
    }

    public clearSelection(): void {
        if (this.selected_row !== null) {
            this.interaction_context.clearRect(
                0,
                (this.selected_row - 1) * this.row_height,
                this.interaction_canvas.width,
                this.row_height
            );
        }
    }

    private drawSelection(row: number): void {
        this.interaction_context.fillStyle = this.selection_color;

        this.interaction_context.fillRect(
            0,
            (row - 1) * this.row_height,
            this.interaction_canvas.width,
            this.row_height
        );
    }

    // Draw the TreeView grid lines on the "ui-layer".
    // TODO make this private, call it as part of a
    // larger draw method
    public drawGridLines(): void {
        let canvas: any = document.getElementById("ui-layer");
        let ctx: any = canvas.getContext("2d");
        let h: number = canvas.height;

        // Paint column lines.
        ctx.strokeStyle = "#ddddddff";
        ctx.beginPath();
        ctx.moveTo(400, 0);
        ctx.lineTo(400, h);

        ctx.moveTo(480, 0);
        ctx.lineTo(480, h);

        ctx.moveTo(560, 0);
        ctx.lineTo(560, h);

        ctx.moveTo(640, 0);
        ctx.lineTo(640, h);

        ctx.moveTo(720, 0);
        ctx.lineTo(720, h);

        ctx.moveTo(800, 0);
        ctx.lineTo(800, h);

        ctx.moveTo(1008, 0);
        ctx.lineTo(1008, h);
        ctx.stroke();

        // Paint row lines.
        ctx.beginPath()
        for (let row_y = 0; row_y < h; row_y += 24) {
            ctx.moveTo(0, row_y);
            ctx.lineTo(canvas.width, row_y);
        }
        ctx.stroke();
    }
}

let treeview: TreeView = null;

function render(): void {
    treeview = new TreeView();
    treeview.bindOnRowSelected((event) => {
        console.log(event);
    });
    let cc: any = document.getElementById("canvas-container");
        cc.style.height = `${document.documentElement.clientHeight - 28}px`;
    let canvas: any = document.getElementById("interaction-layer");
        canvas.addEventListener(
            'click',
            (event: any) => {
                let cursor_offset: number = 12;
                let row = Math.floor(
                    ((event.pageY + cc.scrollTop) - treeview.header_height - cursor_offset + 1) / treeview.row_height
                );
                treeview.selectRow(row);
            },
            false
        );

    loadContent("great-sword");
}

function onResize(): void {
    // shoud this also be - 24 for the header size?
    // document.documentElement.clientHeight - 28
    document.getElementById("canvas-container").style.height = `${document.documentElement.clientHeight - 28}px`;
}

function loadContent(current_weapon_type: string = "great-sword"): void {
    let db = new sqlite3.Database("mhwi.db");
    let canvas: any = document.getElementById("data-layer");
    let count_sql =`SELECT COUNT(w.id)
                    FROM weapon w 
                    WHERE w.weapon_type = '${current_weapon_type}'`;
    db.each(count_sql, (err, result) => {
        let new_height = result["COUNT(w.id)"] * 24;
        canvas.height = new_height;
        (document.getElementById("ui-layer") as any).height = new_height;
        (document.getElementById("interaction-layer") as any).height = new_height;
        treeview.drawGridLines();
    });
    let ctx = canvas.getContext("2d");
    let search_phrase = "";

    let sql = `SELECT w.id, w.previous_weapon_id, w.weapon_type, w.rarity, wt.name, w.attack, attack_true,
                    w.element1, w.element1_attack, w.element2, w.element2_attack, w.element_hidden,
                    w.affinity, w.defense, w.elderseal, w.slot_1, w.slot_2, w.sharpness, w.sharpness_maxed,
                    w.create_recipe_id, w.category
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
    db.serialize(function() {
        db.all(
            sql,
            function(err, rows) {
                treeview.data = rows;
                for (let row of rows) {
                    if (row.previous_weapon_id === null) {
                        indent = 0;
                    } else {
                        indent = weapon_nodes[row.previous_weapon_id][1];
                    }
                    

                    indent += 1;
                    weapon_nodes[row.id] = [row, indent, {x: 0 + indent * 16, y: pos.y}];
                    let coord = null;
                    if (row.previous_weapon_id !== null) coord = [weapon_nodes[row.previous_weapon_id][2], {x: 0 + indent * 16 - 16, y: pos.y}];
                    drawRow(ctx, pos, [row, indent, coord], ranged);
                }
            }
        );
    });
}

function drawRow(ctx: any, pos: Position, weapon_node: [any, number, object], ranged: boolean): void {
    let row = weapon_node[0];
    let indent = weapon_node[1];
    let w_pos = weapon_node[2];
    let indent_size = 16;

    let w = ctx.canvas.width;
    let h = ctx.canvas.height;
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
        let elderseal = row.elderseal[0].toUpperCase() + row.elderseal.slice(1);
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
        let no_handicraft = adjust_sharpness(sharpness.slice(), row.sharpness_maxed, 0);
        
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

function adjust_sharpness(sharpness: number[], maxed: boolean, handicraft_level: number): number[] {
    if (maxed) return sharpness;

    // 5 * handicraft - because we divide the original sharpness values in half
    // so that they occupy 200px instead of 400px
    let handicraft: number = 5 * (5 - handicraft_level); 
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