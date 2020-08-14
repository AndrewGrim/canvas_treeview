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
    protected width = 0; 

    public draw(ctx: any, rect: CellRectangle, row: number, col: number): void {

    }

    public getWidth(ctx: any): number {
        return this.width;
    }

    public clipRect(rect: CellRectangle): void {
        rect.x += 1;
        rect.y += 1;
        rect.w -= 2;
        rect.h -= 2;
    }

    // TODO provide implementation for drawText and drawImage here to remove duplication

    public foregroundColor(): string {
        return this.foreground_color;
    }

    public setForegroundColor(color: string): this {
        this.foreground_color = color;

        return this;
    }

    public backgroundColor(): string | null {
        return this.background_color;
    }

    public setBackgroundColor(color: string): this {
        this.background_color = color;

        return this;
    }
}

export class TextCellRenderer extends CellRenderer {
    public text: string;
    public alignment: Alignment;
    public font: string = "14px Arial";
    public width = 0;

    constructor(text: string, alignment: Alignment = Alignment.Left) {
        super();
        this.text = text;
        this.alignment = alignment;
    }

    public draw(ctx: any, rect: CellRectangle, row: number, col: number): void {
        ctx.font = this.font;
        if (this.background_color) {
            ctx.fillStyle = this.background_color;
            ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
        }
        ctx.fillStyle = this.foreground_color;
        switch (this.alignment) {
            case Alignment.Left:
                ctx.fillText(this.text, rect.x, rect.y + 17);
                break;
            case Alignment.Right:
                // TODO this does not account for times when
                // the text is longer than the cell.
                ctx.fillText(
                    this.text, 
                    rect.x + (rect.w - ctx.measureText(this.text).width), 
                    rect.y + 17);
                break;
            case Alignment.Center:
                // TODO this does not account for times when
                // the text is longer than the cell.
                ctx.fillText(
                    this.text, 
                    rect.x + (rect.w / 2) - (ctx.measureText(this.text).width / 2), 
                    rect.y + 17);
                break;
            default:
                console.error(`Invalid alignment: '${this.alignment}'.`);
        }
    }

    public getWidth(ctx: any): number {
        this.width = ctx.measureText(this.text).width + 20;

        return this.width;
    }
}

export class ImageCellRenderer extends CellRenderer {
    public image_path: string;
    public image_width: number;
    public alignment: Alignment;
    public width = 0;

    constructor(image_path: string, alignment: Alignment = Alignment.Left, image_width: number = 24) {
        super();
        this.image_path = image_path;
        this.alignment = alignment;
        this.image_width = image_width;
    }

    public draw(ctx, rect: CellRectangle, row: number, col: number): void {
        let alignment = this.alignment;
        let width = this.image_width;
        let img = new Image();
            img.src = this.image_path;
            img.onload = function() {
                switch (alignment) {
                    case Alignment.Left:
                        ctx.drawImage(img, rect.x, rect.y - 1);
                        break;
                    case Alignment.Right:
                        ctx.drawImage(img, rect.x + (rect.w - width), rect.y - 1);
                        break;
                    case Alignment.Center:
                        ctx.drawImage(img, rect.x + (rect.w / 2) - (width / 2), rect.y - 1);
                        break;
                    default:
                        console.error(`Invalid alignment: '${alignment}'.`);
                }
            };
    }

    public getWidth(ctx: any): number {
        this.width = this.image_width + 2;

        return this.width;
    }
}

export class ImageTextCellRenderer extends CellRenderer {
    public image_path: string;
    public image_width: number;
    public text: string;
    public alignment: Alignment;
    public font: string = "14px Arial";
    public width = 0;

    constructor(image_path: string, text: string, alignment: Alignment = Alignment.Left, image_width: number = 24) {
        super();
        this.image_path = image_path;
        this.text = text;
        this.alignment = alignment;
        this.image_width = image_width;
    }

    public draw(ctx: any, rect: CellRectangle, row: number, col: number): void {
        this.drawImage(ctx, rect, row, col);
        this.drawText(ctx, rect, row, col);
    }

    private drawImage(ctx: any, rect: CellRectangle, row: number, col: number): void {
        let x = rect.x;
        let img = new Image();
            img.src = this.image_path;
            img.onload = function() {
                ctx.drawImage(img, x, rect.y - 1);
            };
    }

    private drawText(ctx: any, rect: CellRectangle, row: number, col: number): void {
        ctx.font = this.font;
        if (this.background_color) {
            ctx.fillStyle = this.background_color;
            ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
        }
        rect.x += this.image_width;
        rect.w -= this.image_width;
        ctx.fillStyle = this.foreground_color;
        switch (this.alignment) {
            case Alignment.Left:
                ctx.fillText(this.text, rect.x, rect.y + 17);
                break;
            case Alignment.Right:
                ctx.fillText(
                    this.text, 
                    rect.x + (rect.w - ctx.measureText(this.text).width), 
                    rect.y + 17);
                break;
            case Alignment.Center:
                ctx.fillText(
                    this.text, 
                    rect.x + (rect.w / 2) - (ctx.measureText(this.text).width / 2), 
                    rect.y + 17);
                break;
            default:
                console.error(`Invalid alignment: '${this.alignment}'.`);
        }
    }

    public getWidth(ctx: any): number {
        this.width = (this.image_width + 2) + (ctx.measureText(this.text).width + 20);

        return this.width;
    }
}