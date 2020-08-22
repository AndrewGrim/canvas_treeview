import {TreeView} from "./mod";
import {Alignment} from "./enums";


// Calculates the x starting position for content that is aligned to the right.
// Used for drawing right aligned cell content.
export function alignRight(x: number, w: number, content_width: number): number {
    return x + (w - content_width);
}

// Calculates the x starting position for content that is aligned to the center.
// Used for drawing center aligned cell content.
export function alignCenter(x: number, w: number, content_width: number): number {
    return x + (w / 2) - (content_width / 2);
}


// Loads an image and returns an image Promise to allow for use
// of await to make sure that the images has been loaded.
export function loadImage(path: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        let img = new Image();
            img.onload = (() => resolve(img));
            img.onerror = ((error) => reject("Failed to load image."));
            img.src = path;
    });
}

// The class representing the area of the cell being drawn.
// Used in the draw method of the CellRendererInterface and the TreeView class,
// as well as the various draw methods of the CellRenderer class.
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

    // Used by the TreeView draw() method to resize the
    // CellRectangle to fit into the cell without encroaching
    // on the cell borders.
    public clip(): void {
        this.x += 1;
        this.y += 1;
        this.w -= 2;
        this.h -= 2;
    }
}

// The interface that needs to be implemented for a custom CellRenderer
export interface CellRendererInterface {
    // The painting method used by the TreeView.
    draw(treeview: TreeView, ctx: any, rect: CellRectangle, row: number, col: number): void;

    // Used to get the width of the content of the cell not the
    // CellRectangle!
    // Used by the TreeView to calculate the automatic column size.
    getWidth(ctx: any): number;
}

// The class is used for drawing cell contents to the canvas.
// This is the base class and is not meant to be used directly.
// To draw cell contents either use one of the included
// renderers like the TextCellRenderer or make your own one
// by extending this class and implementing the CellRendererInterface.
export class CellRenderer {
    // `foreground_color` is used for drawing text.
    protected foreground_color: string = "#000000";

    // `background_color` is used for drawing the cell background.
    protected background_color: string | null = null;

    // Default implementation for drawing images to the TreeView.
    // Each unique `image_path` is added to the images object of the
    // TreeView and repeating images reuse the already loaded HTMLImageElement
    // objects.
    protected async drawImage(image_path: string, content_width: number, alignment: Alignment, treeview: TreeView, ctx: any, rect: CellRectangle): Promise<void> {
        let img;
        // BUG:
        // This actually always return true on first load, even for repeating images!
        // Which means we still load around 700 images when we only need to load less than 40!
        // On every subsequent load it will work as its supposed to though.
        // ???
        if (treeview.images[image_path] === undefined) {
            img = await loadImage(image_path).catch((err) => { console.error(err); } );
            treeview.images[image_path] = img;
        } else {
            img = treeview.images[image_path];
        }
        switch (alignment) {
            case Alignment.Left:
                ctx.drawImage(img, rect.x, rect.y - 1);
                break;
            case Alignment.Right:
                ctx.drawImage(img, alignRight(rect.x, rect.w, content_width), rect.y - 1);
                break;
            case Alignment.Center:
                ctx.drawImage(img, alignCenter(rect.x, rect.w, content_width), rect.y - 1);
                break;
            default:
                console.error(`Invalid alignment: '${alignment}'.`);
        }
    }

    // Default implementation of drawing text to the TreeView.
    protected drawText(text: string, font: string, content_width: number, alignment: Alignment, treeview: TreeView, ctx: any, rect: CellRectangle): void {
        ctx.font = font;
        ctx.fillStyle = this.foreground_color;
        switch (alignment) {
            case Alignment.Left:
                ctx.fillText(text, rect.x, rect.y + 17);
                break;
            case Alignment.Right:
                ctx.fillText(
                    text, 
                    alignRight(rect.x, rect.w, content_width), 
                    rect.y + 17);
                break;
            case Alignment.Center:
                ctx.fillText(
                    text, 
                    alignCenter(rect.x, rect.w, content_width), 
                    rect.y + 17);
                break;
            default:
                console.error(`Invalid alignment: '${alignment}'.`);
        }
    }

    // Returns the object's `foreground_color`.
    public foregroundColor(): string {
        return this.foreground_color;
    }

    // Sets the object's `foreground_color`.
    public setForegroundColor(color: string): this {
        this.foreground_color = color;

        return this;
    }

    // Returns the object's `background_color`.
    public backgroundColor(): string | null {
        return this.background_color;
    }

    // Sets the object's `background_color`.
    public setBackgroundColor(color: string): this {
        this.background_color = color;

        return this;
    }

    // Paint the cell's background with the cell's
    // `background_color` if specified.
    protected drawBackground(ctx: any, rect: CellRectangle): void {
        if (this.background_color) {
            ctx.fillStyle = this.background_color;
            ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
        }
    }
}

// The default renderer for cells with text only content.
// Draws the background if the background color has been specified.
export class TextCellRenderer extends CellRenderer implements CellRendererInterface {
    public text: string;
    public alignment: Alignment;
    public font: string = "14px Arial";

    constructor(text: string, alignment: Alignment = Alignment.Left) {
        super();
        this.text = text;
        this.alignment = alignment;
    }

    public draw(treeview: TreeView, ctx: any, rect: CellRectangle, row: number, col: number): void {
        ctx.font = this.font;
        ctx.fillStyle = this.foreground_color;
        if (this.getWidth(ctx) - 20 > rect.w + 2) {
            ctx.fillText("...", rect.x, rect.y + 17);
        } else {
            this.drawBackground(ctx, rect);
            this.drawText(this.text, this.font, ctx.measureText(this.text).width, this.alignment, treeview, ctx, rect);
        }
    }

    public getWidth(ctx: any): number {
        return ctx.measureText(this.text).width + 20;
    }
}

// The default renderer for drawing image only cell content.
// Draws the background if the background color has been specified.
export class ImageCellRenderer extends CellRenderer implements CellRendererInterface {
    public image_path: string;
    public image_width: number;
    public alignment: Alignment;

    constructor(image_path: string, alignment: Alignment = Alignment.Left, image_width: number = 24) {
        super();
        this.image_path = image_path;
        this.alignment = alignment;
        this.image_width = image_width;
    }

    public async draw(treeview: TreeView, ctx, rect: CellRectangle, row: number, col: number) {
        if (this.getWidth(ctx) - 2 > rect.w + 2) {
            ctx.fillStyle = this.foreground_color;
            ctx.fillText("...", rect.x, rect.y + 17);
        } else {
            this.drawBackground(ctx, rect);
            this.drawImage(this.image_path, this.image_width, this.alignment, treeview, ctx, rect);
        }
    }

    public getWidth(ctx: any): number {
        return this.image_width + 2;
    }
}

// Default implementation for cells that contain both an image and text.
// Draws the background if the background color has been specified.
// Note: The image will always go on the left side of the text.
export class ImageTextCellRenderer extends CellRenderer implements CellRendererInterface {
    public image_path: string;
    public image_width: number;
    public text: string;
    public alignment: Alignment;
    public font: string = "14px Arial";

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
            this.drawBackground(ctx, rect);
            this.drawImage(
                this.image_path, 
                this.image_width + ctx.measureText(this.text).width, 
                this.alignment, treeview, 
                ctx, 
                new CellRectangle(rect.x, rect.y, rect.w, rect.h)
            );
            rect.x += this.image_width;
            rect.w -= this.image_width;
            this.drawText(this.text, this.font, ctx.measureText(this.text).width, this.alignment, treeview, ctx, rect);
        }
    }

    public getWidth(ctx: any): number {
        return (this.image_width + 2) + (ctx.measureText(this.text).width + 20);
    }
}