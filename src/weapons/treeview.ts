import {adjust_sharpness} from "./mod";

export namespace TreeView {
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

    export enum ColumnType {
        Text,
        Image,
        ImageAndText,
        Custom
    }

    export enum Alignment {
        Left,
        Right,
        Center
    }

    export class CellRectangle {
        public x: number;
        public y: number;
        public w: number;
        public h: number;

        constructor(x: number, y: number, w: number, h: number) {
            this.x = x;
            this.y = y;
            this.w = w;
            this.h = h;
        }
    }

    export class CellRenderer {
        protected foreground_color: string = "#000000";
        protected background_color: string = null;

        public draw(treeview: TreeView, rect: CellRectangle, row: number, col: number): void {

        }

        protected clipRect(rect: CellRectangle): void {
            rect.x += 1;
            rect.y += 1;
            rect.w -= 2;
            rect.h -= 2;
        }

        public foregroundColor(): string {
            return this.foreground_color;
        }

        // TODO might need to return CellRenderer
        public setForegroundColor(color: string): this {
            this.foreground_color = color;

            return this;
        }

        public backgroundColor(): string | null {
            return this.background_color;
        }

        // TODO might need to return CellRenderer
        public setBackgroundColor(color: string): this {
            this.background_color = color;

            return this;
        }
    }

    export class TextCellRenderer extends CellRenderer {
        public text: string;
        public alignment: Alignment;
        public font: string = "14px Arial";

        constructor(text: string, alignment: Alignment = Alignment.Left) {
            super();
            this.text = text;
            this.alignment = alignment;
        }

        // TODO optimise computation of rows and cols outside
        public draw(treeview: TreeView, rect: CellRectangle, row: number, col: number): void {
            this.clipRect(rect);
            treeview.data_context.font = this.font;
            if (this.background_color) {
                treeview.data_context.fillStyle = this.background_color;
                treeview.data_context.fillRect(rect.x, rect.y, rect.w, rect.h);
            }
            treeview.data_context.fillStyle = this.foreground_color;
            switch (this.alignment) {
                case Alignment.Left:
                    treeview.data_context.fillText(this.text, rect.x, rect.y + 17);
                    break;
                case Alignment.Right:
                    // TODO this does not account for times when
                    // the text is longer than the cell.
                    treeview.data_context.fillText(
                        this.text, 
                        rect.x + (rect.w - treeview.data_context.measureText(this.text).width), 
                        rect.y + 17);
                    break;
                case Alignment.Center:
                    // TODO this does not account for times when
                    // the text is longer than the cell.
                    treeview.data_context.fillText(
                        this.text, 
                        rect.x + (rect.w / 2) - (treeview.data_context.measureText(this.text).width / 2), 
                        rect.y + 17);
                    break;
                default:
                    console.error(`Invalid alignment: '${this.alignment}'.`);
            }
        }
    }

    export class ImageCellRenderer extends CellRenderer {
        public image_path: string;

        constructor(image_path: string) {
            super();
            this.image_path = image_path;
        }

        public draw(treeview, rect: CellRectangle, row: number, col: number): void {
            this.clipRect(rect);
            let img = new Image();
                img.src = this.image_path;
                img.onload = function() {
                    treeview.data_context.drawImage(img, rect.x, rect.y - 1);
                };
        }
    }

    export class ImageTextCellRenderer extends CellRenderer {
        public image_path: string;
        public text: string;
        public alignment: Alignment;
        public font: string = "14px Arial";

        constructor(image_path: string, text: string, alignment: Alignment = Alignment.Left) {
            super();
            this.image_path = image_path;
            this.text = text;
            this.alignment = alignment;
        }

        public draw(treeview: TreeView, rect: CellRectangle, row: number, col: number): void {
            this.clipRect(rect);
            if (this.image_path) this.drawImage(treeview, rect, row, col);
            this.drawText(treeview, rect, row, col);
        }

        private drawImage(treeview, rect: CellRectangle, row: number, col: number): void {
            let x = rect.x;
            let img = new Image();
                img.src = this.image_path;
                img.onload = function() {
                    treeview.data_context.drawImage(img, x, rect.y - 1);
                };
        }

        private drawText(treeview: TreeView, rect: CellRectangle, row: number, col: number): void {
            treeview.data_context.font = this.font;
            if (this.background_color) {
                treeview.data_context.fillStyle = this.background_color;
                treeview.data_context.fillRect(rect.x, rect.y, rect.w, rect.h);
            }
            treeview.data_context.fillStyle = this.foreground_color;
            rect.x += 24; // TODO dont hardcode the image size
            rect.w -= 24;
            switch (this.alignment) {
                case Alignment.Left:
                    treeview.data_context.fillText(this.text, rect.x, rect.y + 17);
                    break;
                case Alignment.Right:
                    treeview.data_context.fillText(
                        this.text, 
                        rect.x + (rect.w - treeview.data_context.measureText(this.text).width), 
                        rect.y + 17);
                    break;
                case Alignment.Center:
                    treeview.data_context.fillText(
                        this.text, 
                        rect.x + (rect.w / 2) - (treeview.data_context.measureText(this.text).width / 2), 
                        rect.y + 17);
                    break;
                default:
                    console.error(`Invalid alignment: '${this.alignment}'.`);
            }
        }
    }

    export class SharpnessCellRenderer extends CellRenderer {
        private sharpness: number[];
        private sharpness_maxed: boolean;

        constructor(sharpness: number[], sharpness_maxed: boolean) {
            super();
            this.sharpness = sharpness;
            this.sharpness_maxed = sharpness_maxed;
        }

        public draw(treeview: TreeView, rect: CellRectangle, row: number, col: number): void {
            this.clipRect(rect);
            let no_handicraft_x = rect.y + 2;
            let no_handicraft_y = 14;
            let max_handicraft = rect.y + 16;
            let max_handicraft_y = 4;
            let no_handicraft_sharpness = adjust_sharpness(this.sharpness.slice(), this.sharpness_maxed, 0, 5);
            let x = rect.x + 2;

            treeview.data_context.fillRect(rect.x, rect.y, rect.w, rect.h);

            treeview.data_context.fillStyle = "#d92c2cff"; 
            treeview.data_context.fillRect(x, no_handicraft_x, no_handicraft_sharpness[0], no_handicraft_y);
            treeview.data_context.fillRect(x, max_handicraft, this.sharpness[0], max_handicraft_y);
            x += this.sharpness[0];

            treeview.data_context.fillStyle = "#d9662cff"; 
            treeview.data_context.fillRect(x, no_handicraft_x, no_handicraft_sharpness[1], no_handicraft_y);
            treeview.data_context.fillRect(x, max_handicraft, this.sharpness[1], max_handicraft_y);
            x += this.sharpness[1];

            treeview.data_context.fillStyle = "#d9d12cff"; 
            treeview.data_context.fillRect(x, no_handicraft_x, no_handicraft_sharpness[2], no_handicraft_y);
            treeview.data_context.fillRect(x, max_handicraft, this.sharpness[2], max_handicraft_y);
            x += this.sharpness[2];

            treeview.data_context.fillStyle = "#70d92cff"; 
            treeview.data_context.fillRect(x, no_handicraft_x, no_handicraft_sharpness[3], no_handicraft_y);
            treeview.data_context.fillRect(x, max_handicraft, this.sharpness[3], max_handicraft_y);
            x += this.sharpness[3];

            treeview.data_context.fillStyle = "#2c86d9ff"; 
            treeview.data_context.fillRect(x, no_handicraft_x, no_handicraft_sharpness[4], no_handicraft_y);
            treeview.data_context.fillRect(x, max_handicraft, this.sharpness[4], max_handicraft_y);
            x += this.sharpness[4];

            treeview.data_context.fillStyle = "#f8f8f8ff"; 
            treeview.data_context.fillRect(x, no_handicraft_x, no_handicraft_sharpness[5], no_handicraft_y);
            treeview.data_context.fillRect(x, max_handicraft, this.sharpness[5], max_handicraft_y);
            x += this.sharpness[5];

            treeview.data_context.fillStyle = "#885aecff"; 
            treeview.data_context.fillRect(x, no_handicraft_x, no_handicraft_sharpness[6], no_handicraft_y);
            treeview.data_context.fillRect(x, max_handicraft, this.sharpness[6], max_handicraft_y);
            x += this.sharpness[6];
        }
    }

    export enum EventType {
        RowSelected = "RowSelected",
    }

    // TODO add other more specific event classes that inherit from Event
    export class Event {
        public event: EventType;
        public row: number | null;
        public node: object | null;
    
        constructor(event: EventType, row: number | null = null, node: object | null = null) {
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
        private headings: string[] = [];
        private heading_images: string[] = [];
        private selected_row_callback: (event: Event) => void = null;
        private columns: number[] = [];
        private indent_size = 16;
        
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
                    console.log(this.calculateColumn(event));
                }
            );
            this.header_interaction_canvas.addEventListener(
                "mouseout",
                (event: any) => {
                    this.clearHeader();
                }
            );
            this.header_interaction_canvas.addEventListener(
                "mousemove",
                (event: any) => {
                    this.hoverHeader(this.calculateColumn(event));
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

        private calculateColumn(event: any): {x: number, w: number} {
            let x = event.pageX - 2;
            let sum = 0
            let i = 0;
            for (; i < this.columns.length; i++) {
                sum += this.columns[i];
                if (x <= sum) {
                    return {x: sum, w: this.columns[i]};
                }
            }

            return {x: sum, w: this.columns[i - 1]};
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

            this.drawGridLines();
        }
    
        // Draw the TreeView grid lines on the "ui-layer".
        // TODO make this private, call it as part of a
        // larger draw method
        private drawGridLines(): void {
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

        public setHeight(row_count: number) {
            // TODO why is the 6 necessary?
            let new_height = row_count * this.row_height + 6;
            this.data_canvas.height = new_height;
            this.ui_canvas.height = new_height;
            this.interaction_canvas.height = new_height;

            this.drawGridLines();
        }

        public setModel(model: Model) {
            this.model = model;

            this.setHeight(this.length());
            this.draw();
        }

        public setColumnHeadings(headings: string[], images: string[]): void {
            this.headings = headings;
            this.heading_images = images;

            this.drawColumnHeadings();
        }

        private drawColumnHeadings(): void {
            this.header_context.font = "14px Arial";
            this.header_context.lineWidth = 2;
            this.header_context.strokeStyle = "#bababaff";
            
            this.header_context.fillStyle = "#edededff";
            this.header_context.fillRect(0, 0, this.header_canvas.width, this.header_canvas.height);

            let x = 0;
            this.header_context.fillStyle = "#000000ff";
            this.columns.forEach((value, index, columns) => {
                if (this.headings[index]) {
                    this.header_context.fillText(
                        this.headings[index], 
                        x + (value / 2) - (this.header_context.measureText(this.headings[index]).width / 2), 
                        0 + 17
                    );
                } else {
                    let _x = x;
                    let treeview = this;
                    let img = new Image();
                        img.src = this.heading_images[index];
                        img.onload = function() {
                            treeview.header_context.drawImage(img, _x + (value / 2) - (img.width / 2), 0 - 1);
                        };
                }
                x += value;
                if (index < columns.length - 1) {
                    this.header_context.moveTo(x, 0);
                    this.header_context.lineTo(x, this.header_canvas.height);
                    this.header_context.stroke();
                }
            });
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

            for (let root of this.model.getModel()) {
                this.model.descend(root, (node) => {
                    let indent = node.iter.path.length;
                    let children_count = node.children.length;
                    if (children_count > 0) {
                        this.data_context.lineWidth = 2;
                        this.data_context.strokeStyle = "#aaaaaaff";
                        this.data_context.beginPath();
                        this.data_context.moveTo(indent * this.indent_size - 4, pos.y + 12);
                        this.data_context.lineTo(indent * this.indent_size - 4, pos.y + (1 * this.row_height) + 12);
                        this.data_context.lineTo(indent * this.indent_size + 12, pos.y + (1 * this.row_height) + 12);
                        this.data_context.stroke();
                        if (children_count > 1) {
                            let count = 1;
                            for (let c = 0; c < node.children.length - 1; c++) {
                                this.model.descend(node.children[c], (_node) => {
                                    count++;
                                });
                                this.data_context.moveTo(indent * this.indent_size - 4, pos.y + 12);
                                this.data_context.lineTo(indent * this.indent_size - 4, pos.y + (count * this.row_height) + 12);
                                this.data_context.lineTo(indent * this.indent_size + 12, pos.y + (count * this.row_height) + 12);
                                this.data_context.stroke();
                            }
                        }
                    }
                    this.drawRow(pos, node);
                    pos.nextY(this.row_height);
                });
            }
        }

        private drawRow(pos: Position, node: TreeNode): void {
            // TODO look into removing this block
            // this.data_context.font = "14px Arial";
            // this.data_context.lineWidth = 1;
            // this.data_context.fillStyle = "#000000ff";
            // this.data_context.strokeStyle = "#000000ff";
            
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
                    col.draw(this, rect, pos.y / 24, 2);
                }
                x += this.columns[index];
            });
        }
    }
}