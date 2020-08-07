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
        public selection_color: string = "#1111ff55";
        public hovered_row: number | null = null;
        public hover_color: string = "#1111ff11";
        public grid_lines_color: string = "#ddddddff";
        public row_height: number = 24;
        public header_height: number = 24;
        public data: object[] | null = null;
        public current_category: string | null = null
        public cursor_offset: number = 12; 
    
        private canvas_container: any;
        private interaction_canvas: any;
        private interaction_context: any;
        private data_canvas: any;
        private data_context: any;
        private ui_canvas: any;
        private ui_context: any;
        private selected_row_callback: (event: Event) => void = null;
        private columns: number[] = [];
        
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
            for (let c of this.columns) {
                this.ui_context.moveTo(c, 0);
                this.ui_context.lineTo(c, this.ui_canvas.height);
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
    }
}