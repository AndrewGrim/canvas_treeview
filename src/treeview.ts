import {adjust_sharpness} from "./mod";

export namespace TreeView {
    export enum ColumnType {
        Text,
        Image,
        ImageAndText,
        Custom
    }

    export enum TextAlignment {
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

        protected draw(treeview: TreeView, rect: CellRectangle, row: number, col: number): void {

        }

        public foregroundColor(): string {
            return this.foreground_color;
        }

        public setForegroundColor(color: string): void {
            this.foreground_color = color;
        }

        public backgroundColor(): string {
            return this.background_color;
        }

        public setBackgroundColor(color: string): void {
            this.background_color = color;
        }
    }

    export class TextCellRenderer extends CellRenderer {
        public text: string;
        public alignment: TextAlignment;
        public font: string = "14px Arial";

        constructor(text: string, alignment: TextAlignment = TextAlignment.Left) {
            super();
            this.text = text;
            this.alignment = alignment;
        }

        // TODO optimise computation of rows and cols outside
        public draw(treeview: TreeView, rect: CellRectangle, row: number, col: number): void {
            treeview.data_context.font = this.font;
            if (this.background_color) {
                treeview.data_context.fillStyle = this.background_color;
                treeview.data_context.fillRect(rect.x, rect.y, rect.w, rect.h);
            }
            treeview.data_context.fillStyle = this.foreground_color;
            switch (this.alignment) {
                case TextAlignment.Left:
                    treeview.data_context.fillText(this.text, rect.x, rect.y + 17);
                    break;
                case TextAlignment.Right:
                    // TODO this does not account for times when
                    // the text is longer than the cell.
                    treeview.data_context.fillText(
                        this.text, 
                        rect.x + (rect.w - treeview.data_context.measureText(this.text).width), 
                        rect.y + 17);
                    break;
                case TextAlignment.Center:
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
            let img = new Image();
                img.src = this.image_path;
                img.onload = function() {
                    treeview.data_context.drawImage(img, rect.x, rect.y);
                };
        }
    }

    export class ImageTextCellRenderer extends CellRenderer {
        public image_path: string;
        public text: string;
        public alignment: TextAlignment;
        public font: string = "14px Arial";

        constructor(image_path: string, text: string, alignment: TextAlignment) {
            super();
            this.image_path = image_path;
            this.text = text;
            this.alignment = alignment;
        }

        public draw(treeview: TreeView, rect: CellRectangle, row: number, col: number): void {
            treeview.data_context.save();
            treeview.data_context.strokeStyle = "#00000000";
            treeview.data_context.rect(rect.x + 1, rect.y + 1, rect.w - 2, rect.h - 2);
            treeview.data_context.stroke();
            treeview.data_context.clip();
            if (this.image_path) this.drawImage(treeview, rect, row, col);
            this.drawText(treeview, rect, row, col);
            treeview.data_context.restore();
        }

        private drawImage(treeview, rect: CellRectangle, row: number, col: number): void {
            let x = rect.x;
            let img = new Image();
                img.src = this.image_path;
                img.onload = function() {
                    treeview.data_context.drawImage(img, x, rect.y);
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
                case TextAlignment.Left:
                    treeview.data_context.fillText(this.text, rect.x, rect.y + 17);
                    break;
                case TextAlignment.Right:
                    treeview.data_context.fillText(
                        this.text, 
                        rect.x + (rect.w - treeview.data_context.measureText(this.text).width), 
                        rect.y + 17);
                    break;
                case TextAlignment.Center:
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
            let no_handicraft_x = rect.y + 4;
            let no_handicraft_y = 12;
            let max_handicraft = rect.y + 16;
            let max_handicraft_y = 4;
            let no_handicraft_sharpness = adjust_sharpness(this.sharpness.slice(), this.sharpness_maxed, 0, 5);
            let x = rect.x + 4;

            treeview.data_context.fillRect(rect.x, rect.y + 1, rect.w, rect.h - 2);

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

    export class Event {
        public event: EventType;
        public row: number | null;
        public data: object | null;
    
        constructor(event: EventType, row: number | null = null, data: object | null = null) {
            this.event = event;
            this.row = row;
            this.data = data;
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
        public data: object[] | null = null;
        public current_category: string | null = null
        public cursor_offset: number = 12; 
        public data_canvas: any;
        public data_context: any;
    
        private canvas_container: any;
        private interaction_canvas: any;
        private interaction_context: any;
        private ui_canvas: any;
        private ui_context: any;
        private selected_row_callback: (event: Event) => void = null;
        private columns: number[] = [];
        private model: ColumnType[] = [];
        
        constructor() {
            this.interaction_canvas = document.getElementById("interaction-layer");
            this.interaction_context = this.interaction_canvas.getContext("2d");
            this.data_canvas = document.getElementById("data-layer");
            this.data_context = this.data_canvas.getContext("2d");
            this.ui_canvas = document.getElementById("ui-layer");
            this.ui_context = this.ui_canvas.getContext("2d");
            this.canvas_container = document.getElementById("canvas-container");

            this.interaction_canvas.addEventListener(
                "click",
                (event: any) => {
                    this.selectRow(this.calculateRow(event));
                }
            );
            this.interaction_canvas.addEventListener(
                "mousemove",
                (event: any) => {
                    this.hoverRow(this.calculateRow(event));
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
    
        public selectRow(row: number): void {
            this.clearHover();
            this.clearSelection();
            this.drawSelection(row);
    
            if (this.selected_row_callback !== null && this.selected_row !== null) {
                if (this.data[row - 1] !== undefined) {
                    this.selected_row_callback(new Event(
                            EventType.RowSelected,
                            row,
                            this.data[row - 1]
                        )
                    );
                } else {
                    if (row === 0) {
                        this.selectRow(1);
                        console.warn("Invalid data index: '-1' likely caused by imprecise selection math.");
                    } else {
                        console.error(`Invalid data index: "TreeView.data[${row - 1}]" returned 'undefined'.`);
                    }
                }
            }
        }

        public hoverRow(row: number): void {
            this.clearHover();
            this.drawHover(row);
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

        // TODO in the future this should never be called manually
        // rather this should be changed when treeview data changes.
        public setHeight(row_count: number) {
            let new_height = row_count * this.row_height;
            this.data_canvas.height = new_height;
            this.ui_canvas.height = new_height;
            this.interaction_canvas.height = new_height;

            this.drawGridLines();
        }

        public setData(data: object[]) {
            this.data = data;

            this.setHeight(this.data.length);
        }

        public setModel(model: ColumnType[]) {
            this.model = model;
        }
    }
}