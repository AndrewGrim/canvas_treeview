import {CellRectangle, CellRendererInterface} from "./cellrenderer";
import {Position, capitalize} from "../utilities";
import {Sort, Match, Alignment} from "./enums";

// The class representing the path from the
// base of the TreeView Model to the last node.
// Takes the form of a simple number array.
// Example:
//
//	[0, 0, 1, 0]
//
//	This path leads down the first root node, 
//	it's first child
//	that child's second child and
//	finally the first child of the last one.
//
//	0 
//	 -> 0
//	    -  0
//	    -> 1
//	        -> 0
export class TreeIter {
    public path: number[];

    constructor(path = []) {
        this.path = path;
    }
}

// The class representing each TreeView Model row.
// It stores the information for all it's columns.
//
// `columns` is the object representing the drawable row data.
//	It consists of named column keys which store the
//	CellRenderer that will be used for drawing.
//	The Cell Renderer itself stores the data to be drawn.
//
// `hidden` is the object representing the hidden row data.
//	This can be utilised in many ways. It could be used
// 	to store data that isn't meant to be shown but will
//	need to be used later on, like an ID number.
//	It can be used for sorting as well.
//	For a given column you could draw one thing: an image
//	for example, and store some value associated with it
//	in `hidden`. Later on when sorting simply pass the
//	`hidden` values to determine the TreeNode order.
//
// `is_visible` determines whether a node will be counted
//  towards the TreeView length and whether it will be drawn.
export class TreeNode {
    public columns: object;
    public hidden: object | null;
    public children: TreeNode[];
    public parent: TreeNode;
    public is_visible: boolean = true;
    public is_collapsed: boolean = false;
    public iter: TreeIter = new TreeIter();

    constructor(columns: object, hidden: object = null, children: TreeNode[] = []) {
        this.columns = columns;
        this.hidden = hidden;
        this.children = children;
    }

    public getParentIter(): TreeIter {
        return new TreeIter(this.iter.path.slice(0, this.iter.path.length - 1));
    }
}

// The class representing the TreeView Model.
// Essentially it's just an array of TreeNodes.
// Specifically an array of root TreeNodes.
// Each represents the beginning of its respective branch.
export class Model {
    private model: TreeNode[] = [];

    public getModel(): TreeNode[] {
        return this.model;
    }

    public append(tree_iter: TreeIter, node: TreeNode): TreeIter {
        if (!tree_iter) {
            node.iter = new TreeIter([this.model.length]);
            this.model.push(node); 
            
            return node.iter;
        } else {
            let root = this.model[tree_iter.path[0]];
            for (let i = 1; i < tree_iter.path.length; i++) {
                if (root.children.length > 0) {
                    root = root.children[tree_iter.path[i]];
                } else {
                    break;
                }
            }

            let last_index = root.children.push(node) - 1;
            let new_iter = tree_iter.path.slice();
            new_iter.push(last_index);
            let iter = new TreeIter(new_iter);
            node.iter = iter;
            node.parent = root;

            return iter;
        }
    }

    public get(iter: TreeIter): TreeNode {
        let root = this.model[iter.path[0]];
        for (let i = 1; i < iter.path.length; i++) {
            if (root.children.length > 0) {
                root = root.children[iter.path[i]];
            } else {
                break;
            }
        }
        
        return root;
    }

    public getRow(row: number): TreeNode {
        let index = 0;
        let node = null;
        for (let root of this.model) {
            this.descend(root, (child) => {
                if (index === row) {
                    node = child;
                }
                if (child.is_visible) {
                    index++;
                }
            });
        }

        return node;
    }

    // Traverses down the entire TreeView Model and optionally
    // executes a callback on each TreeNode.
    public descend(root: TreeNode, fn: (node: TreeNode) => void = null): TreeNode {
        if (fn) {
            fn(root);
        }
        if (root.children.length > 0) {
            let last: TreeNode;
            for (let rc of root.children) {
                last = this.descend(rc, fn);
            }
            return last;
        } else {
            return root;
        }
    }
}

export enum EventType {
    RowSelected = "RowSelected",
}

// Represents all the Events that can be emitted by the TreeView.
// At the moment there is only one type of event.
export class Event {
    public event: EventType;
    public row: number;
    public node: TreeNode;

    constructor(event: EventType, row: number, node: TreeNode) {
        this.event = event;
        this.row = row;
        this.node = node;
    }
}

export class TreeView {
    public selected_row: number | null = null;
    public selection_color: string = "#1111ff55";
    public hovered_row: number | null = null;
    public hover_color: string = "#1111ff11";
    public grid_lines_color: string = "#ddddddff";
    public row_height: number = 24;
    public header_height: number = 24;
    public model: Model | null = null;
    public current_category: string | null = null
    public cursor_offset: number = 12; 
    public data_canvas: any;
    public data_context: any;
    public min_width = 15;
    public images = {};
    public length: () => number = this.getLength;

    private canvas_container: any;
    private header_container: any;
    private interaction_canvas: any;
    private interaction_context: any;
    private ui_canvas: any;
    private ui_context: any;
    private header_canvas: any;
    private header_context: any;
    private header_interaction_canvas: any;
    private header_interaction_context: any;
    private headings: object;
    private selected_row_callback: (event: Event) => void = null;
    public columns: number[] = [];
    private indent_size = 16;
    private dragging = false;
    private column_dragged = null;
    private sorted_column = null;
    private sort_type = Sort.Ascending;
    private idle_time = 0;
    private mouse = null;
    private tooltip = false;
    
    constructor() {
        this.interaction_canvas = document.getElementById("interaction-layer");
        this.interaction_context = this.interaction_canvas.getContext("2d");
        this.data_canvas = document.getElementById("data-layer");
        this.data_context = this.data_canvas.getContext("2d");
        this.ui_canvas = document.getElementById("ui-layer");
        this.ui_context = this.ui_canvas.getContext("2d");
        this.header_canvas = document.getElementById("header-layer");
        this.header_context = this.header_canvas.getContext("2d");
        this.header_interaction_canvas = document.getElementById("header-interaction-layer");
        this.header_interaction_context = this.header_interaction_canvas.getContext("2d");
        this.header_container = document.getElementById("header-container");
        this.canvas_container = document.getElementById("canvas-container");

        let width = document.body.getClientRects()[0].width;
        this.header_canvas.width = width + 20;
        this.header_interaction_canvas.width = width + 20;
        this.data_canvas.width = width;
        this.ui_canvas.width = width;
        this.interaction_canvas.width = width;

        this.canvas_container.addEventListener(
            "scroll",
            (event: any) => {
                this.header_container.scroll(event.target.scrollLeft, 0);
            }
        );

        this.interaction_canvas.addEventListener(
            "click",
            (event: any) => {
                this.selectRow(this.calculateRow(event));
            }
        );
        this.interaction_canvas.addEventListener(
            "mouseout",
            (event: any) => {
                this.clearHover();
            }
        );
        this.interaction_canvas.addEventListener(
            "mousemove",
            (event: any) => {
                this.hoverRow(this.calculateRow(event));
            }
        );
        this.header_interaction_canvas.addEventListener(
            "mousedown",
            (event: any) => {
                let result = this.calculateColumn(event, (x: number, sum: number) => {
                    return x >= sum - 5 && x <= sum + 5;
                }, (x: number, sum: number) => {
                    return x < sum;
                });
                if (result.t === Match.P1) {
                    if (result.i < 9) {
                        this.dragging = true;
                        this.column_dragged = result.i;
                    } 
                } else if (result.t === Match.P2) {
                    if (this.sorted_column === result.i) {
                        if (this.sort_type === Sort.Ascending) {
                            this.sort_type = Sort.Descending;
                        } else {
                            this.sort_type = Sort.Ascending;
                        }
                    } else {
                        this.sort_type = Sort.Ascending;
                    }
                    this.sorted_column = result.i;
                    switch (result.i) {
                        case 0:
                            this.model.getModel().sort((a: any, b: any) => {
                                return this.sortColumn(a.columns.rarity_and_name.text, b.columns.rarity_and_name.text, this.sort_type);
                            });
                            break;
                        case 1:
                            this.model.getModel().sort((a: any, b: any) => {
                                return this.sortColumn(a.columns.attack.text, b.columns.attack.text, this.sort_type);
                            });
                            break;
                        case 2:
                            this.model.getModel().sort((a: any, b: any) => {
                                return this.sortColumn(a.hidden.element, b.hidden.element, this.sort_type);
                            });
                            break;
                        case 3:
                            this.model.getModel().sort((a: any, b: any) => {
                                return this.sortColumn(a.hidden.affinity, b.hidden.affinity, this.sort_type);
                            });
                            break;
                        case 4:
                            this.model.getModel().sort((a: any, b: any) => {
                                return this.sortColumn(a.hidden.defense, b.hidden.defense, this.sort_type);
                            });
                            break;
                        case 5:
                            this.model.getModel().sort((a: any, b: any) => {
                                return this.sortColumn(a.hidden.elderseal, b.hidden.elderseal, this.sort_type);
                            });
                            break;
                        case 6:
                            this.model.getModel().sort((a: any, b: any) => {
                                return this.sortColumn(a.hidden.slot1, b.hidden.slot1, this.sort_type);
                            });
                            break;
                        case 7:
                            this.model.getModel().sort((a: any, b: any) => {
                                return this.sortColumn(a.hidden.slot2, b.hidden.slot2, this.sort_type);
                            });
                            break;
                        case 8:
                            this.model.getModel().sort((a: any, b: any) => {
                                return this.sortColumn(a.hidden.sharpness, b.hidden.sharpness, this.sort_type);
                            });
                            break;
                        default:
                            console.warn(`Unsupported column for sorting: '${result.i}'.`);
                    }
                    this.drawSortIcon(this.sort_type, result);
                }
            }
        );
        this.header_interaction_canvas.addEventListener(
            "mouseup",
            (event: any) => {
                if (this.dragging && this.column_dragged > 0) {
                    this.setModel(this.model);
                }
                this.dragging = false;
                this.column_dragged = null;
                document.body.style.cursor = "default";
            }
        );
        this.header_interaction_canvas.addEventListener(
            "mouseout",
            (event: any) => {
                this.clearHeader();
                if (this.dragging) {
                    this.setModel(this.model);
                }
                this.dragging = false;
                this.column_dragged = null;
                document.body.style.cursor = "default";
                this.clearTooltip();
                this.mouse = null;
            }
        );
        this.header_interaction_canvas.addEventListener(
            "mousemove",
            (event: any) => {
                this.mouse = event;
                if (!this.dragging) {
                    this.hoverHeader(this.calculateColumn(event, (x: number, sum: number) => {
                        return x <= sum;
                    }, (x, sum) => {
                        return false;
                    }));
                    let result = this.calculateColumn(event, (x: number, sum: number) => {
                        return x >= sum - 5 && x <= sum + 5;
                    }, (x, sum) => {
                        return false;
                    });
                    if (result.i > 0 && result.i < this.columns.length) {
                        document.body.style.cursor = "col-resize";
                    } else {
                        document.body.style.cursor = "default";
                    }
                } else {
                    this.clearHeader();
                    let sum = 0;
                    for (let i = 0; i < this.column_dragged; i++) {
                        sum += this.columns[i];
                    }
                    let new_width = event.pageX - sum + this.header_container.scrollLeft > this.min_width ? event.pageX - sum + this.header_container.scrollLeft : this.min_width;
                    if (this.column_dragged > 0) {
                        this.columns[this.column_dragged] = new_width;
                    }
                }
                this.clearTooltip();
            }
        );
        window.addEventListener(
            "resize",
            (event) => {
                this.onResize();
            }
        );

        setInterval(this.incrementIdle, 1000, this);
        this.onResize();
    }

    private clearTooltip() {
        this.idle_time = 0;
        this.hovered_row = 1;
        this.interaction_context.clearRect(
            0,
            0,
            this.interaction_canvas.width,
            2 * this.row_height
        );
        this.tooltip = false;
        if (this.selected_row === 1) {
            this.interaction_context.fillStyle = this.selection_color;
            this.interaction_context.fillRect(
                0,
                0,
                this.interaction_canvas.width,
                this.row_height
            );
        } else if (this.selected_row === 2) {
            this.interaction_context.fillStyle = this.selection_color;
            this.interaction_context.fillRect(
                0,
                1 * this.row_height,
                this.interaction_canvas.width,
                this.row_height
            );
        }
    }

    public roundRect(ctx, x, y, width, height, radius, fill, stroke) {
        if (typeof stroke === 'undefined') {
            stroke = true;
        }
        if (typeof radius === 'undefined') {
            radius = 5;
        }
        if (typeof radius === 'number') {
            radius = {tl: radius, tr: radius, br: radius, bl: radius};
        } else {
            var defaultRadius = {tl: 0, tr: 0, br: 0, bl: 0};
            for (var side in defaultRadius) {
                radius[side] = radius[side] || defaultRadius[side];
            }
        }
        ctx.beginPath();
        ctx.moveTo(x + radius.tl, y);
        ctx.lineTo(x + width - radius.tr, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
        ctx.lineTo(x + width, y + height - radius.br);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
        ctx.lineTo(x + radius.bl, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
        ctx.lineTo(x, y + radius.tl);
        ctx.quadraticCurveTo(x, y, x + radius.tl, y);
        ctx.closePath();
        if (fill) {
            ctx.fill();
        }
        if (stroke) {
            ctx.stroke();
        }
    }

    private incrementIdle(treeview) {
        treeview.idle_time += 1;
        if (treeview.idle_time > 0 && treeview.mouse) {
            if (!treeview.tooltip) {
                // TODO add check if the tooltip would go offscreen and draw it in the opposite direction
                let result = treeview.calculateColumn(treeview.mouse, (x: number, sum: number) => {
                    return x >= sum - 5 && x <= sum + 5;
                }, (x: number, sum: number) => {
                    return x < sum;
                });
                if (result.t === Match.P2) {
                    treeview.interaction_context.font = "14px Arial";
                    treeview.interaction_context.fillStyle = "#fcf379ff";
                    treeview.interaction_context.strokeStyle = "#000000ff";

                    let text = Object.keys(treeview.headings)[result.i];
                    let rect_width = treeview.interaction_context.measureText(capitalize(text)).width + 10;
                    let rect_height = 24;
                    let rect_x = 15;
                    let rect_y = 4;
                    let corner_radius = 5;

                    treeview.roundRect(treeview.interaction_context, treeview.mouse.pageX + rect_x + treeview.header_container.scrollLeft, rect_y, rect_width, rect_height, corner_radius, true, true);
                    treeview.interaction_context.fillStyle = "#000000ff";
                    treeview.interaction_context.fillText(capitalize(text), treeview.mouse.pageX + rect_x + 5 + treeview.header_container.scrollLeft, rect_y + 17);
                    treeview.tooltip = true;
                }
            } 
        }
    }

    private drawSortIcon(sort_type: Sort, result: {x: number, w: number, i: number}): void {
        let col = this.sorted_column;
        let cell = Object.values(this.headings)[col];
        let header_width = cell.getWidth(this.header_context);
        if (cell.alignment === Alignment.Center) header_width += header_width / 2;
        if (header_width + 10 < this.columns[col]) {
            this.setModel(this.model);
            this.header_context.fillStyle = "#000000ff";
            this.header_context.beginPath();
            switch (sort_type) {
                case Sort.Ascending:
                    this.header_context.moveTo(result.x - 13, this.header_height / 2 + 4);
                    this.header_context.lineTo(result.x - 8, this.header_height / 2 - 6);
                    this.header_context.lineTo(result.x - 2, this.header_height / 2 + 4);
                    break;
                case Sort.Descending:
                    this.header_context.moveTo(result.x - 13, this.header_height / 2 - 4);
                    this.header_context.lineTo(result.x - 8, this.header_height / 2 + 6);
                    this.header_context.lineTo(result.x - 2, this.header_height / 2 - 4);
                    break;
                default:
                    console.error(`Invalid sort enumeration: '${sort_type}'.`);
            }
            this.header_context.fill();
        } else {
            this.columns[col] = this.columns[col] + 10;
            result.x += 10;
            this.drawSortIcon(sort_type, result);
        }
    }

    public sortColumn(a: any, b: any, sort_type: Sort = Sort.Ascending): number {
        let compare_result;

        switch (sort_type) {
            case Sort.Ascending:
                if (a < b) compare_result = -1;
                else if (a === b) compare_result = 0;
                else compare_result = 1;
                break;
            case Sort.Descending:
                if (a > b) compare_result = -1;
                else if (a === b) compare_result = 0;
                else compare_result = 1;
                break;
            default:
                console.error(`Invalid sort enumeration: '${sort_type}'.`);
        }

        return compare_result;
    }

    public onResize(): void {
        this.header_container.style.height = `${this.header_height}px`;
        this.canvas_container.style.height = `${document.documentElement.clientHeight - 28 - this.header_height - 7}px`;
        document.getElementById("detailview-container").style.height = `${document.documentElement.clientHeight - 230 - 30}px`;
        document.getElementById("detailview-container").style.width = `${document.documentElement.clientWidth - 1001 - 2}px`;
    }

    private calculateRow(event: any): {x: number, y: number} {
        return {
            x: event.pageX - 2 + this.canvas_container.scrollLeft, 
            y: Math.floor(
            ((event.pageY + this.canvas_container.scrollTop) - this.header_height - this.cursor_offset + 2) / this.row_height
            )
        };
    }

    private calculateColumn(event: any, predicate1: (x: number, sum: number) => boolean, predicate2: (x: number, sum: number) => boolean): {x: number, w: number, i: number, t: Match} {
        let x = event.pageX - 2 + this.header_container.scrollLeft;
        let sum = 0;
        let i = 0;
        for (; i < this.columns.length; i++) {
            sum += this.columns[i];
            if (predicate1(x, sum)) {
                return {x: sum, w: this.columns[i], i: i, t: Match.P1};
            } else if (predicate2(x, sum)) {
                return {x: sum, w: this.columns[i], i: i, t: Match.P2};
            }
        }

        return {x: sum, w: this.columns[i - 1], i: i, t: Match.None};
    }

    public selectRow(coord: {x: number, y: number}): void {
        this.clearHover();
        this.clearSelection();

        let node = this.model.getRow(coord.y - 1);
        if (node !== null) {
            let x = node.iter.path.length * this.indent_size;
            if (coord.x >= x - 9 && coord.x <= x + 2) {
                if (node.children.length > 0) {
                    if (node.is_collapsed) {
                        node.is_collapsed = false;
                    } else {
                        node.is_collapsed = true;
                    }
                    this.model.descend(node, (child) => {
                        if (child.is_visible) {
                            child.is_visible = false;
                        } else if (!node.is_collapsed) {
                            child.is_visible = true;
                        }
                    });
                    node.is_visible = true;
                    this.setModel(this.model);
                }
            } else {
                this.drawSelection(coord.y);
                if (this.selected_row_callback !== null) {
                    this.selected_row_callback(new Event(
                        EventType.RowSelected,
                        coord.y,
                        node
                    ));
                } else {
                    if (coord.y === 0) {
                        this.selectRow({x: -1, y: 1});
                        console.warn("Invalid model row: '-1' likely caused by imprecise selection math.");
                    } else {
                        console.error(`Invalid model row: "TreeView.model.getRow({x: -1, y: ${coord.y - 1}})" returned 'null'.`);
                    }
                }
            }
        }

        
    }

    public hoverRow(coord: {x: number, y: number}): void {
        this.clearHover();
        this.drawHover(coord.y);
    }

    public hoverHeader(coord: {x: number, w: number}): void {
        this.clearHeader();
        this.drawHeader(coord);
    }

    public clearHeader(): void {
        this.header_interaction_context.clearRect(
            0,
            0,
            this.header_interaction_canvas.width,
            this.header_interaction_canvas.height
        );
    }

    private drawHeader(coord: {x: number, w: number}): void {
        this.header_interaction_context.fillStyle = this.hover_color;
        this.header_interaction_context.fillRect(
            coord.x - coord.w,
            0,
            coord.w,
            this.header_interaction_canvas.height
        );
    }

    // TODO make a generic bind with
    // event and callback parameters
    public bindOnRowSelected(fn: (event: Event) => void): void {
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

    public clearHover(): void {
        if (this.hovered_row !== null && this.hovered_row !== this.selected_row) {
            this.interaction_context.clearRect(
                0,
                (this.hovered_row - 1) * this.row_height,
                this.interaction_canvas.width,
                this.row_height
            );
        }
    }

    private drawSelection(row: number): void {
        if (row !== this.selected_row) {
            this.interaction_context.fillStyle = this.selection_color;
            this.interaction_context.fillRect(
                0,
                (row - 1) * this.row_height,
                this.interaction_canvas.width,
                this.row_height
            );
            this.selected_row = row;
        } else {
            this.selected_row = null;
        }
    }

    private drawHover(row: number): void {
        if (row !== this.selected_row) {
            this.interaction_context.fillStyle = this.hover_color;
            this.interaction_context.fillRect(
                0,
                (row - 1) * this.row_height,
                this.interaction_canvas.width,
                this.row_height
            );
            this.hovered_row = row;
        }
    }

    public setColumns(columns: number[]) {
        this.columns = columns;
    }

    private autoColumnLength() {
        for (let root of this.model.getModel()) {
            this.model.descend(root, (node) => {
                Object.values(node.columns).forEach((cell: CellRendererInterface, index: number, _node: TreeNode[]) => {
                    if (cell) {
                        this.data_context.font = "14px Arial";
                        let cell_width = cell.getWidth(this.data_context);
                        if (index === 0) {
                            cell_width = ((node.iter.path.length - 1) * this.indent_size) + ((cell as any).image_width / 2) + 4 + cell_width;
                        }
                        let current_width = this.columns[index]
                        if (cell_width > current_width) {
                            this.columns[index] = cell_width;
                        }
                    }
                });
            });
        }
    }

    private drawGridLines(): void {
        let auto = true;
        for (let c of this.columns) {
            if (c !== 0) auto = false;
        }
        if (auto) this.autoColumnLength();
        this.drawColumnHeadings();
        this.ui_context.strokeStyle = this.grid_lines_color;

        this.ui_context.beginPath();
        // Paint column lines.
        let sum = 0
        for (let c of this.columns) {
            sum += c;
            this.ui_context.moveTo(sum, 0);
            this.ui_context.lineTo(sum, this.ui_canvas.height);
        }
        this.ui_context.stroke();

        // Paint row lines.
        this.ui_context.beginPath()
        for (let row_y = 0; row_y < this.ui_canvas.height; row_y += 24) {
            this.ui_context.moveTo(0, row_y);
            this.ui_context.lineTo(this.ui_canvas.width, row_y);
        }
        this.ui_context.stroke();
    }

    private setHeight(row_count: number) {
        let new_height = row_count * this.row_height;
        this.data_canvas.height = new_height;
        this.ui_canvas.height = new_height;
        this.interaction_canvas.height = new_height

        this.drawGridLines();
    }

    public setModel(model: Model) {
        this.model = model;

        this.setHeight(this.length());
        this.draw();
    }

    public setColumnHeadings(headings: object): void {
        this.headings = headings;
    }

    private drawColumnHeadings(): void {
        this.header_context.lineWidth = 2;
        this.header_context.strokeStyle = "#bababaff";

        // Draw header background
        this.header_context.fillStyle = "#edededff";
        this.header_context.fillRect(0, 0, this.header_canvas.width, this.header_canvas.height);

        let x = 0;
        let rect = null;
        this.header_context.fillStyle = "#000000ff";
        Object.values(this.headings).forEach((head: CellRendererInterface, index: number, _headings: CellRendererInterface[]) => {
            rect = new CellRectangle(x, 0, this.columns[index], this.header_height);
            head.draw(this, this.header_context, rect, -1, -1);
            x += this.columns[index];
            // Draw column lines
            if (index < this.columns.length) {
                this.header_context.beginPath();
                this.header_context.moveTo(x, 0);
                this.header_context.lineTo(x, this.header_canvas.height);
                this.header_context.stroke();
            }
        });
        // Draw bottom border
        this.header_context.beginPath();
        this.header_context.moveTo(0, this.header_canvas.height - 1);
        this.header_context.lineTo(this.header_canvas.width, this.header_canvas.height - 1);
        this.header_context.stroke();
    }

    public getLength(): number {
        let i = 0;
        for (let root of this.model.getModel()) {
            this.model.descend(root, (child) => {
                if (child.is_visible) {
                    i++;
                }
            })
        }

        return i;
    }

    // Draws the TreeView.
    // Goes down each node and draws the treelines
    //  the collapsed indicating triangle and finally
    //  the actual row data by using the draw method on
    //  each individual CellRenderer
    private draw(): void {
        let pos = new Position();
        let row_index = 0;
        for (let root of this.model.getModel()) {
            this.model.descend(root, (node) => {
                if (node.is_visible) {
                    let indent = node.iter.path.length;
                    let children_count = node.children.length;
                    if (children_count > 0) {
                        // `12` is for half the image width
                        let x = indent * this.indent_size;
                        let y = pos.y + 12;
                        let collapsed = !node.children[0].is_visible;

                        // Draw branch lines between nodes but
                        // only if its not collapsed.
                        if (!collapsed) {
                            // Draw branch lines for first child
                            this.data_context.lineWidth = 2;
                            this.data_context.strokeStyle = "#aaaaaaff";
                            this.data_context.beginPath();
                            this.data_context.moveTo(x - 4, y);
                            this.data_context.lineTo(x - 4, pos.y + (1 * this.row_height) + 12);
                            this.data_context.lineTo(x + 12, pos.y + (1 * this.row_height) + 12);
                            this.data_context.stroke();
                            if (children_count > 1) {
                                // Draw branch lines for the rest of the children
                                let count = 1;
                                for (let c = 0; c < node.children.length - 1; c++) {
                                    this.model.descend(node.children[c], (child) => {
                                        if (child.is_visible) {
                                            count++;
                                        }
                                    });
                                    this.data_context.moveTo(x - 4, y);
                                    this.data_context.lineTo(x - 4, pos.y + (count * this.row_height) + 12);
                                    this.data_context.lineTo(x + 12, pos.y + (count * this.row_height) + 12);
                                    this.data_context.stroke();
                                }
                            }
                        }
                        
                        // Draw the triangle indicating the node collapse status.
                        this.data_context.lineWidth = 1;
                        this.data_context.fillStyle = "#000000ff";
                        if (collapsed) {
                            this.data_context.beginPath();
                            this.data_context.moveTo(x - 6, y - 6);
                            this.data_context.lineTo(x, y);
                            this.data_context.lineTo(x - 6, y + 6);
                            this.data_context.fill();
                        } else {
                            this.data_context.beginPath();
                            this.data_context.moveTo(x - 9, y - 2);
                            this.data_context.lineTo(x - 4, y + 4);
                            this.data_context.lineTo(x + 2, y - 2);
                            this.data_context.fill();
                        }
                    } else {
                        // Only draw the final node square if its not a root node.
                        if (indent > 1) {
                            this.data_context.lineWidth = 1;
                            this.data_context.fillStyle = "#000000ff";
                            this.data_context.fillRect(indent * this.indent_size - 8, pos.y + 10, 5, 5);
                        }
                    }
                    this.drawRow(pos, node, row_index);
                    pos.nextY(this.row_height);
                    row_index++;
                }
            });
        }
    }

    // Draws a TreeView row from the given TreeNode.
    // Note: The individual cell drawing is handled by each cell.
    private drawRow(pos: Position, node: TreeNode, row_index: number): void {        
        let row = node.columns as any;
        let x = 0;
        let rect = null;
        let indent = node.iter.path.length - 1;
    
        Object.values(row).forEach((col: CellRendererInterface, index: number, _row: CellRendererInterface[]) => {
            if (col) {
                switch (index) {
                    case 0:
                        rect = new CellRectangle(x + (indent * this.indent_size) + ((col as any).image_width / 2) + 4, pos.y, this.columns[0], this.row_height);
                        break;
                    default:
                        rect = new CellRectangle(x, pos.y, this.columns[index], this.row_height);
                }
                rect.clip();
                col.draw(this, this.data_context, rect, row_index, index);
            }
            x += this.columns[index];
        });
    }

    // Sets the number of columns for the TreeView.
    // Used for determining whether to auto size the columns.
    public setColumnCount(count: number): void {
        this.columns = new Array(count).fill(0);
    }
}