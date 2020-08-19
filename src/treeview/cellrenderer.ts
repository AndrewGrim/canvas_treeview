import {TreeView} from "./mod";
import {Alignment, loadImage} from "../utilities";

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

    public draw(treeview: TreeView, ctx: any, rect: CellRectangle, row: number, col: number): void {

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

    public draw(treeview: TreeView, ctx: any, rect: CellRectangle, row: number, col: number): void {
        ctx.font = this.font;

        if (this.background_color) {
            ctx.fillStyle = this.background_color;
            ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
        }
        ctx.fillStyle = this.foreground_color;
        if (this.getWidth(ctx) - 20 > rect.w + 2) {
            ctx.fillText("...", rect.x, rect.y + 17);
        } else {
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

    public async draw(treeview: TreeView, ctx, rect: CellRectangle, row: number, col: number) {
        let alignment = this.alignment;
        let width = this.image_width;
        if (this.getWidth(ctx) - 2 > rect.w + 2) {
            ctx.fillStyle = this.foreground_color;
            ctx.fillText("...", rect.x, rect.y + 17);
        } else {
            let img;
            if (treeview.images[this.image_path] === undefined) {
                img = await loadImage(this.image_path);
                treeview.images[this.image_path] = img;
            } else {
                img = treeview.images[this.image_path];
            }
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
        }
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

    public draw(treeview: TreeView, ctx: any, rect: CellRectangle, row: number, col: number): void {
        if (col > 0 && this.getWidth(ctx) - 22 > rect.w + 2) {
            ctx.font = this.font;
            ctx.fillStyle = this.foreground_color;
            ctx.fillText("...", rect.x, rect.y + 17);
        } else {
            this.drawImage(treeview, ctx, rect, row, col);
            this.drawText(ctx, rect, row, col);
        }
    }

    private async drawImage(treeview: TreeView, ctx: any, rect: CellRectangle, row: number, col: number) {
        let x = rect.x;
        let img;
        if (treeview.images[this.image_path] === undefined) {
            img = await loadImage(this.image_path);
            treeview.images[this.image_path] = img;
        } else {
            img = treeview.images[this.image_path];
        }
        ctx.drawImage(img, x, rect.y - 1);
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