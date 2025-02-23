// Specifies the alignment of cell contents within a column.
export enum Alignment {
    Left,
    Right,
    Center
}

// Specifies the order by which to sort column values.
export enum Sort {
    Ascending,
    Descending
}

export enum Match {
    P1,
    P2,
    None
}

export enum EventType {
    RowSelected = "RowSelected",
}

// Specifies whether to draw the TreeView grid lines and which ones.
export enum GridLines {
    Horizontal,
    Vertical,
    Both,
    None,
}