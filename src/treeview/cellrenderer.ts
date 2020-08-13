import {TreeView} from "./mod";
import {Alignment} from "../utilities";

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