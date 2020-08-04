const fs = require("fs");
const sqlite3 = require("better-sqlite3");

import {adjust_sharpness} from "./mod";
import {capitalize, capitalize_split} from "./utilities";

export function loadDetailView(event) {
    let db = new sqlite3("mhwi.db");
    let data = event.data;

    fs.stat(`images/weapons/${data.weapon_type}/${data.name}.jpg`, (err, stat) => {
        let image: any = document.getElementById("weapon-render");
        if (err === null) {
            image.src = `images/weapons/${data.weapon_type}/${data.name}.jpg`;
        } else {
            image.src = `images/transparent.png`;
            console.log(err);
        }
    });
    let table: any = document.getElementById("weapon-details-table");
        table.innerHTML = "";

    let details = [
        ["Name", ""],
        ["Rarity", `images/weapons/${data.weapon_type}/rarity-24/${data.rarity}.png`],
        ["Attack", "images/weapon-detail-24/attack.png"],
        ["Element", "images/weapon-detail-24/element.png"],
        ["Affinity", "images/weapon-detail-24/affinity.png"],
        ["Defense", "images/weapon-detail-24/defense.png"],
        ["Elderseal", "images/weapon-detail-24/elderseal.png"],
        ["Slots", "images/weapon-detail-24/slots.png"],
    ];
    if (data.weapon_type === "hunting-horn") {
        details.push(["Notes", "images/weapon-detail-24/notes.png"]);
    } else if (data.weapon_type === "gunlance") {
        details.push(["Shelling", "images/weapon-detail-24/shelling.png"]);
    } else if (data.weapon_type === "charge-blade" || data.weapon_type === "switch-axe") {
        details.push(["Phial Type", "images/weapon-detail-24/phials.png"]);
    } else if (data.weapon_type === "insect-glaive") {
        details.push(["Kinsect Bonus", "images/weapons/insect-glaive/rarity-24/10.png"]);
    }  else if (data.weapon_type === "light-bowgun" || data.weapon_type === "heavy-bowgun") {
        details.push(["Special Ammo", "images/weapon-detail-24/specialammo.png"]);
        details.push(["Deviation", "images/weapon-detail-24/deviation.png"]);
    } else if (data.weapon_type === "bow") {
        details.push(["Coatings", "images/weapon-detail-24/coating.png"]);
    }

    for (let d of details) {
        let row = table.insertRow();
        let key = row.insertCell(0);
            key.classList += "key";
            key.innerHTML = `<img src="${d[1]}"/><p>${d[0]}</p>`;
        
        let value = row.insertCell(1);
            value.classList += "value";
        // TODO change switch to enum.
        switch (d[0]) {
            case "Name":
                value.innerHTML = data.name;
                break;
            case "Rarity":
                value.innerHTML = data.rarity;
                break;
            case "Attack":
                value.innerHTML = `${data.attack} (${data.attack_true} True)`;
                break;
            case "Element":
                if (data.element1 !== null) {
                    value.innerHTML = `<img src="images/damage-types-24/${data.element1.toLowerCase()}.png"/>`;
                    if (data.element_hidden) {
                        value.innerHTML +=`<p>${data.element1} (${data.element1_attack})</p>`;
                    } else {
                        value.innerHTML +=`<p>${data.element1} ${data.element1_attack}</p>`;
                    }
                    value.innerHTML += ` (${elementMax(data.element1_attack)} Max)`;
                }
                break;
            case "Affinity":
                if (data.affinity > 0) {
                    value.innerHTML = `+${data.affinity}%`;
                } else if (data.affinity < 0) {
                    value.innerHTML = `${data.affinity}%`;
                }
                break;
            case "Defense":
                if (data.defense !== 0) {
                    value.innerHTML = `+${data.defense}`;
                }
                break;
            case "Elderseal":
                if (data.elderseal !== null) {
                    value.innerHTML = capitalize(data.elderseal);
                }
                break;
            case "Slots":
                if (data.slot_1 > 0) {
                    value.innerHTML = `<img src="images/decoration-slots-24/${data.slot_1}.png"/>`;
                    if (data.slot_2 > 0) {
                        value.innerHTML += `<img src="images/decoration-slots-24/${data.slot_2}.png"/>`;
                    }
                }
                break;
            case "Notes":
                let notes = data.notes.split("");
                notes.forEach((n: string, i: number, notes: string) => {
                    switch (n) {
                        case "R":
                            value.innerHTML += `<img src="images/notes-24/Note${i + 1}Red.png"/><p>Red</p> `;
                            break;
                        case "B":
                            value.innerHTML += `<img src="images/notes-24/Note${i + 1}Blue.png"/><p>Blue</p> `;
                            break;
                        case "W":
                            value.innerHTML += `<img src="images/notes-24/Note${i + 1}White.png"/><p>White</p> `;
                            break;
                        case "G":
                            value.innerHTML += `<img src="images/notes-24/Note${i + 1}Green.png"/><p>Green</p> `;
                            break;
                        case "P":
                            value.innerHTML += `<img src="images/notes-24/Note${i + 1}Purple.png"/><p>Purple</p> `;
                            break;
                        case "Y":
                            value.innerHTML += `<img src="images/notes-24/Note${i + 1}Yellow.png"/><p>Yellow</p> `;
                            break;
                        case "O":
                            value.innerHTML += `<img src="images/notes-24/Note${i + 1}Orange.png"/><p>Orange</p> `;
                            break;
                        case "C":
                            value.innerHTML += `<img src="images/notes-24/Note${i + 1}Cyan.png"/><p>Cyan</p> `;
                            break;
                        default:
                            console.error(`Invalid note value: "${n}".`);
                    }
                });
                break;
            case "Shelling":
                value.innerHTML = `Lv ${data.shelling_level} ${capitalize(data.shelling)}`;
                break;
            case "Phial Type":
                switch (data.phial) {
                    case "poison":
                    case "paralysis":
                    case "dragon":
                        value.innerHTML = `<img src="images/damage-types-24/${data.phial}.png"/> `;
                        break;
                    default:
                        value.innerHTML = "";
                }
                value.innerHTML += capitalize_split(data.phial);
                if (data.phial_power !== null) {
                    value.innerHTML += ` ${data.phial_power}`;
                }
                break;
            case "Kinsect Bonus":
                value.innerHTML = capitalize_split(data.kinsect_bonus, "_", " & ");
                break;
            case "Special Ammo":
                {
                    let row = db.prepare(`SELECT special_ammo FROM weapon_ammo WHERE id = ${data.ammo_id}`).get();
                    value.innerHTML = row.special_ammo;
                }
                break;
            case "Deviation":
                {
                    let row = db.prepare(`SELECT deviation FROM weapon_ammo WHERE id = ${data.ammo_id}`).get();
                    value.innerHTML = row.deviation;
                    switch (row.deviation) {
                        case "0": value.innerHTML = "None"; break;
                        case "1": value.innerHTML = "Low"; break;
                        case "2": value.innerHTML = "Average"; break;
                        case "3": value.innerHTML = "High"; break;
                        case "4": value.innerHTML = "Very High"; break;
                        default:
                            console.error(`Invalid deviation value: "${row.deviation}".`)
                    }
                }
                break;
            case "Coatings":
                let coatings = [
                    [data.coating_close, "White", "Close"],
                    [data.coating_power, "Red", "Power"],
                    [data.coating_paralysis, "Gold", "Paralysis"],
                    [data.coating_poison, "Violet", "Poison"],
                    [data.coating_sleep, "Cyan", "Sleep"],
                    [data.coating_blast, "Lime", "Blast"]
                ];
                for (let c of coatings) {
                    if (c[0] === 1) {
                        value.innerHTML += `<img src="images/items-24/Bottle${c[1]}.png"/>${c[2]}<br>`;
                    }
                }
                break;
            default:
                value.innerHTML = "";
        }
    }
    
    let container = document.getElementById("sharpness-container");
        container.innerHTML = "";
    if (!"light-bowgun heavy-bowgun bow".includes(data.weapon_type)) {
        let sharpness = data.sharpness.split(",");
        for (let i: number = 0; i < sharpness.length; i++) {
            sharpness[i] = Number(sharpness[i]);
        }
        for (let i = 0; i < 6; i++) {
            let s = adjust_sharpness(sharpness.slice(), data.maxed, i);
            container.innerHTML += 
`<div><!--
---><button class="sharpness" style="width: 25px">+${i}</button><!--
---><button class="sharpness red ${is_hidden(s[0])}" style="width: ${adjust_width(s[0])}px;">${s[0]}</button><!--
---><button class="sharpness orange ${is_hidden(s[1])}" style="width: ${adjust_width(s[1])}px;">${s[1]}</button><!--
---><button class="sharpness yellow ${is_hidden(s[2])}" style="width: ${adjust_width(s[2])}px;">${s[2]}</button><!--
---><button class="sharpness green ${is_hidden(s[3])}" style="width: ${adjust_width(s[3])}px;">${s[3]}</button><!--
---><button class="sharpness blue ${is_hidden(s[4])}" style="width: ${adjust_width(s[4])}px;">${s[4]}</button><!--
---><button class="sharpness white ${is_hidden(s[5])}" style="width: ${adjust_width(s[5])}px;">${s[5]}</button><!--
---><button class="sharpness purple ${is_hidden(s[6])}" style="width: ${adjust_width(s[6])}px;">${s[6]}</button>
</div>`;
        }
    }

    let sql = `SELECT it.name, i.icon_name, i.icon_color, r.quantity
                FROM recipe_item r
                    JOIN item i
                        ON r.item_id = i.id
                    JOIN item_text it
                        ON it.id = i.id
                        AND it.lang_id = 'en'
                WHERE r.recipe_id = ?`;
    let rows = db.prepare(sql).all([data.create_recipe_id]);
    table = document.getElementById("create-weapon-materials-table");
    table.innerHTML = "";
    if (rows.length > 0) {
        let row = table.insertRow();
        let cell = row.insertCell(0);
            cell.innerHTML = "Create: Name";
            cell = row.insertCell(1);
            cell.innerHTML = "Quantity";
        for (let r of rows) {
            let row = table.insertRow();
            let name = row.insertCell(0);
                name.classList += "name";
                name.innerHTML = `<img src="images/items-24/${r.icon_name}${r.icon_color}.png"/><p>${r.name}</p>`;
            
            let quantity = row.insertCell(1);
                quantity.classList += "quantity";
                quantity.innerHTML = `<p>${r.quantity}</p>`;
        }
    }
    rows = db.prepare(sql).all([data.upgrade_recipe_id]);
    table = document.getElementById("upgrade-weapon-materials-table");
    table.innerHTML = "";
    if (rows.length > 0) {
        let row = table.insertRow();
        let cell = row.insertCell(0);
            cell.innerHTML = "Upgrade: Name";
            cell = row.insertCell(1);
            cell.innerHTML = "Quantity";
        for (let r of rows) {
            let row = table.insertRow();
            let name = row.insertCell(0);
                name.classList += "name";
                name.innerHTML = `<img src="images/items-24/${r.icon_name}${r.icon_color}.png"/><p>${r.name}</p>`;
            
            let quantity = row.insertCell(1);
                quantity.classList += "quantity";
                quantity.innerHTML = `<p>${r.quantity}</p>`;
        }
    }
}

function elementMax(element: number): number {
    return Math.floor(element / 10 * 1.3) * 10;
}

function is_hidden(sharpness_value: number): string {
    return sharpness_value === 0 ? "hidden" : "";
}

// This is necessary for the sharpness value to not
// go out of bounds of its box.
function adjust_width(width: number): number {
    return width === 20 ? 25 : width;
}