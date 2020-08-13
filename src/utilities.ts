export enum Alignment {
    Left,
    Right,
    Center
}

export class Position {
    public x: number;
    public y: number;

    constructor()  {
        this.x = 0;
        this.y = 0;
    }

    public nextX(increment_x: number): number {
        this.x += increment_x;

        return this.x;
    }

    public nextY(increment_y: number): number {
        this.y += increment_y;
        
        return this.y;
    }
}

export function capitalize(text: string): string {
    return text[0].toUpperCase() + text.slice(1);
}

export function capitalize_split(text: string, split_pattern: string = " ", join: string = " ") {
    let split = text.split(split_pattern);
    let capitalized_text = ""

    split.forEach((s: string, i: number, split: string[]) => {
        if (i > 0) { capitalized_text += join; }
        capitalized_text += capitalize(s);
    });

    return capitalized_text;
}