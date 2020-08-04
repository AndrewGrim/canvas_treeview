export namespace TreeView {
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
        public selection_color: string = "#1111ff55"
        public hovered_row: number | null = null;
        public hover_color: string = "#1111ff11"
        public row_height: number = 24;
        public header_height: number = 24;
        public data: object[] | null = null;
        public current_category: string | null = null
        public cursor_offset: number = 12; 
    
        private canvas_container: any;
        private interaction_canvas: any;
        private interaction_context: any;
        private selected_row_callback: (event: Event) => void = null;
        
        constructor() {
            this.interaction_canvas = document.getElementById("interaction-layer");
            this.interaction_context = this.interaction_canvas.getContext("2d");
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
            document.getElementById("detailview-container").style.height = `${document.documentElement.clientHeight - 230}px`;
            document.getElementById("detailview-container").style.width = `${document.documentElement.clientWidth - 1001}px`;
        }

        private calculateRow(event: any): number {
            return Math.floor(
                ((event.pageY + this.canvas_container.scrollTop) - this.header_height - this.cursor_offset + 1) / this.row_height
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
                    console.error(`Invalid data index: "TreeView.data[${row - 1}]" returned 'undefined'.`);
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
    
        // Draw the TreeView grid lines on the "ui-layer".
        // TODO make this private, call it as part of a
        // larger draw method
        // also make painting the columns more dynamic
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