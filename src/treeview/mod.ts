import {CellRectangle, CellRenderer} from "./cellrenderer";
import {Position} from "../utilities";

export class TreeIter {
    public path: number[];

    constructor(path = []) {
        this.path = path;
    }
}

export class TreeNode {
    public columns: object;
    public hidden: object | null;
    public children: TreeNode[];
    public is_visible: boolean = true;
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
            this.descend(root, (_node) => {
                if (index === row) {
                    node = _node;
                }
                index++;
            });
        }

        return node;
    }

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
    private columns: number[] = [];
    private indent_size = 16;
    private dragging = false;
    private column_dragged = null;
    
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
            "click",
            (event: any) => {
                let result = this.calculateColumn(event, (x: number, sum: number) => {
                    return x <= sum;
                });
                switch (result.i) {
                    case 0:
                        this.model.getModel().sort(); // TODO implement this ourselves cause it doesnt seem to work
                        break;
                    case 1:
                        this.model.getModel().sort((a: any, b: any) => {
                            let compare_result;
                            if (a.columns.attack.text < b.columns.attack.text) compare_result = -1; // change to > for desc order
                            else if (a.columns.attack.text === b.columns.attack.text) compare_result = 0;
                            else compare_result = 1;
        
                            return compare_result;
                        });
                        break;
                    case 2:
                        this.model.getModel().sort((a: any, b: any) => {
                            let compare_result;
                            if (a.hidden.element < b.hidden.element) compare_result = -1; // change to > for desc order
                            else if (a.hidden.element === b.hidden.element) compare_result = 0;
                            else compare_result = 1;
        
                            return compare_result;
                        });
                        break;
                    case 3:
                        this.model.getModel().sort((a: any, b: any) => {
                            let compare_result;
                            if (a.hidden.affinity < b.hidden.affinity) compare_result = -1; // change to > for desc order
                            else if (a.hidden.affinity === b.hidden.affinity) compare_result = 0;
                            else compare_result = 1;
        
                            return compare_result;
                        });
                        break;
                    case 4:
                        this.model.getModel().sort((a: any, b: any) => {
                            let compare_result;
                            if (a.hidden.defense < b.hidden.defense) compare_result = -1; // change to > for desc order
                            else if (a.hidden.defense === b.hidden.defense) compare_result = 0;
                            else compare_result = 1;
        
                            return compare_result;
                        });
                        break;
                    case 5:
                        this.model.getModel().sort((a: any, b: any) => {
                            let compare_result;
                            if (a.hidden.elderseal < b.hidden.elderseal) compare_result = -1; // change to > for desc order
                            else if (a.hidden.elderseal === b.hidden.elderseal) compare_result = 0;
                            else compare_result = 1;
        
                            return compare_result;
                        });
                        break;
                    case 6:
                        this.model.getModel().sort((a: any, b: any) => {
                            let compare_result;
                            if (a.hidden.slot1 < b.hidden.slot1) compare_result = -1; // change to > for desc order
                            else if (a.hidden.slot1 === b.hidden.slot1) compare_result = 0;
                            else compare_result = 1;
        
                            return compare_result;
                        });
                        break;
                    case 7:
                        this.model.getModel().sort((a: any, b: any) => {
                            let compare_result;
                            if (a.hidden.slot2 < b.hidden.slot2) compare_result = -1; // change to > for desc order
                            else if (a.hidden.slot2 === b.hidden.slot2) compare_result = 0;
                            else compare_result = 1;
        
                            return compare_result;
                        });
                        break;
                    case 8:
                        this.model.getModel().sort((a: any, b: any) => {
                            let compare_result;
                            if (a.hidden.sharpness < b.hidden.sharpness) compare_result = -1; // change to > for desc order
                            else if (a.hidden.sharpness === b.hidden.sharpness) compare_result = 0;
                            else compare_result = 1;
        
                            return compare_result;
                        });
                        break;
                    default:
                        console.warn(`Unsupported column for sorting: '${result.i}'.`);
                }
                this.setModel(this.model);
            }
        );
        this.header_interaction_canvas.addEventListener(
            "mousedown",
            (event: any) => {
                let result = this.calculateColumn(event, (x: number, sum: number) => {
                    return x >= sum - 5 && x <= sum + 5;
                });
                if (result.i < 9) {
                    this.dragging = true;
                    this.column_dragged = result.i;
                } 
            }
        );
        this.header_interaction_canvas.addEventListener(
            "mouseup",
            (event: any) => {
                if (this.dragging) {
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
            }
        );
        this.header_interaction_canvas.addEventListener(
            "mousemove",
            (event: any) => {
                if (!this.dragging) {
                    this.hoverHeader(this.calculateColumn(event, (x: number, sum: number) => {
                        return x <= sum;
                    }));
                    let result = this.calculateColumn(event, (x: number, sum: number) => {
                        return x >= sum - 5 && x <= sum + 5;
                    });
                    if (result.i < 9) {
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
                    let new_width = event.pageX - sum > this.min_width ? event.pageX - sum : this.min_width;
                    if (this.column_dragged > 0) {
                        this.columns[this.column_dragged] = new_width;
                    }
                }
            }
        );
        window.addEventListener(
            "resize",
            (event) => {
                this.onResize();
            }
        );

        this.onResize();
    }

    public onResize(): void {
        this.header_container.style.height = `${this.header_height}px`;
        this.canvas_container.style.height = `${document.documentElement.clientHeight - 28 - this.header_height}px`;
        // TODO account for the height of tab buttons, also there probably is a better way to do this
        document.getElementById("detailview-container").style.height = `${document.documentElement.clientHeight - 230 - 30}px`;
        document.getElementById("detailview-container").style.width = `${document.documentElement.clientWidth - 1001}px`;
    }

    private calculateRow(event: any): number {
        return Math.floor(
            ((event.pageY + this.canvas_container.scrollTop) - this.header_height - this.cursor_offset + 2) / this.row_height
        );
    }

    private calculateColumn(event: any, predicate: (x: number, sum: number) => boolean): {x: number, w: number, i: number} {
        let x = event.pageX - 2;
        let sum = 0
        let i = 0;
        for (; i < this.columns.length; i++) {
            sum += this.columns[i];
            if (predicate(x, sum)) {
                return {x: sum, w: this.columns[i], i: i};
            }
        }

        return {x: sum, w: this.columns[i - 1], i: i};
    }

    public selectRow(row: number): void {
        this.clearHover();
        this.clearSelection();
        this.drawSelection(row);

        if (this.selected_row_callback !== null && this.selected_row !== null) {
            if (this.model.getRow(row - 1) !== null) {
                this.selected_row_callback(new Event(
                        EventType.RowSelected,
                        row,
                        this.model.getRow(row - 1)
                    )
                );
            } else {
                if (row === 0) {
                    this.selectRow(1);
                    console.warn("Invalid model row: '-1' likely caused by imprecise selection math.");
                } else {
                    console.error(`Invalid model row: "TreeView.model.getRow(${row - 1})" returned 'null'.`);
                }
            }
        }
    }

    public hoverRow(row: number): void {
        this.clearHover();
        this.drawHover(row);
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
                Object.values(node.columns).forEach((cell: CellRenderer, index: number, _node: TreeNode[]) => {
                    if (cell) {
                        let cell_width = cell.getWidth(this.ui_context);
                        if (index === 0) {
                            cell_width = (node.iter.path.length + 1) * this.indent_size + cell_width;
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
        // TODO why is the 6 necessary?
        let new_height = row_count * this.row_height + 6;
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
        this.header_context.font = "14px Arial";
        this.header_context.lineWidth = 2;
        this.header_context.strokeStyle = "#bababaff";

        // Draw header background
        this.header_context.fillStyle = "#edededff";
        this.header_context.fillRect(0, 0, this.header_canvas.width, this.header_canvas.height);

        let x = 0;
        let rect = null;
        this.header_context.fillStyle = "#000000ff";
        Object.values(this.headings).forEach((head: CellRenderer, index: number, _headings: object) => {
            rect = new CellRectangle(x, 0, this.columns[index], this.header_height);
            head.draw(this.header_context, rect, -1, -1);
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

    // TODO this will likely be more efficient if we
    // just track the length ourselves on every append and clear
    public getLength(): number {
        let i = 0;
        for (let root of this.model.getModel()) {
            this.model.descend(root, (_node) => {
                i++;
            })
        }

        return i;
    }

    private draw(): void {
        let pos = new Position();
        let row_index = 0;
        for (let root of this.model.getModel()) {
            this.model.descend(root, (node) => {
                let indent = node.iter.path.length;
                let children_count = node.children.length;
                if (children_count > 0) {
                    let x = indent * this.indent_size;
                    this.data_context.lineWidth = 2;
                    this.data_context.strokeStyle = "#aaaaaaff";
                    this.data_context.beginPath();
                    this.data_context.moveTo(x - 4, pos.y + 12);
                    this.data_context.lineTo(x - 4, pos.y + (1 * this.row_height) + 12);
                    this.data_context.lineTo(x + 12, pos.y + (1 * this.row_height) + 12);
                    this.data_context.stroke();
                    if (children_count > 1) {
                        let count = 1;
                        for (let c = 0; c < node.children.length - 1; c++) {
                            this.model.descend(node.children[c], (_node) => {
                                count++;
                            });
                            this.data_context.moveTo(x - 4, pos.y + 12);
                            this.data_context.lineTo(x - 4, pos.y + (count * this.row_height) + 12);
                            this.data_context.lineTo(x + 12, pos.y + (count * this.row_height) + 12);
                            this.data_context.stroke();
                        }
                    }
                }
                this.drawRow(pos, node, row_index);
                pos.nextY(this.row_height);
                row_index++;
            });
        }
    }

    private drawRow(pos: Position, node: TreeNode, row_index: number): void {        
        let row = node.columns as any;
        let x = 0;
        let rect = null;
        let indent = node.iter.path.length - 1;
    
        Object.values(row).forEach((col: CellRenderer, index: number, _row: CellRenderer[]) => {
            if (col) {
                switch (index) {
                    case 0:
                        rect = new CellRectangle(x + indent * this.indent_size, pos.y, this.columns[0] - indent * this.indent_size, this.row_height);
                        break;
                    default:
                        rect = new CellRectangle(x, pos.y, this.columns[index], this.row_height);
                }
                col.clipRect(rect);
                col.draw(this.data_context, rect, row_index, index);
            }
            x += this.columns[index];
        });
    }

    public setColumnCount(count: number): void {
        this.columns = new Array(count).fill(0);
    }
}