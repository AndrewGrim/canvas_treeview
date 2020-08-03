export namespace treeview {
    export enum EventType {
        RowSelected = "RowSelected",
    }

    export class Event {
        public event: EventType;
        public row: number | null;
        public data: object | null;
    
        constructor(event: EventType, row: number = null, data: object = null) {
            this.event = event;
            this.row = row;
            this.data = data;
        }
    }

    export class TreeView {
        public selected_row: number = null;
        public selection_color: string = "#1111ff55"
        public hovered_row: number = null;
        public hover_color: string = "#1111ff11"
        public row_height: number = 24;
        public header_height: number = 24;
        public data: object[];
        public current_category: string = null
    
        private interaction_canvas: any;
        private interaction_context: any;
        private selected_row_callback: (event: Event) => void = null;
        
        constructor() {
            this.interaction_canvas = document.getElementById("interaction-layer");
            this.interaction_context = this.interaction_canvas.getContext("2d");
        }
    
        public selectRow(row: number): void {
            this.clearSelection();
            this.drawSelection(row, this.selection_color);
            this.selected_row = row;
    
            if (this.selected_row_callback !== null) {
                if (this.data[row - 1] !== undefined) {
                    this.selected_row_callback(new Event(
                            EventType.RowSelected,
                            row,
                            this.data[row - 1]
                        )
                    );
                } else {
                    console.error(`Invalid data index: "TreeView.data[${row - 1}]" returned 'undefined'.`);
                }
            }
        }

        public hoverRow(row: number): void {
            this.clearHover();
            this.drawSelection(row, this.hover_color);
            this.hovered_row = row;
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
    
        private drawSelection(row: number, color: any): void {
            if (row !== this.selected_row) {
                this.interaction_context.fillStyle = color;
        
                this.interaction_context.fillRect(
                    0,
                    (row - 1) * this.row_height,
                    this.interaction_canvas.width,
                    this.row_height
                );
            }
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
    
            ctx.moveTo(774, 0);
            ctx.lineTo(774, h);
    
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
}