const fs = require("fs");
const sqlite3 = require("better-sqlite3");

import {adjust_sharpness} from "./mod";
import {capitalize, capitalize_split} from "./utilities";

// Used for creating a row for each type of ammo.
const AMMO_TYPES: string[][] = [
    ["Normal 1", "AmmoWhite.png"],
    ["Normal 2", "AmmoWhite.png"],
    ["Normal 3", "AmmoWhite.png"],
    ["Pierce 1", "AmmoBlue.png"],
    ["Pierce 2", "AmmoBlue.png"],
    ["Pierce 3", "AmmoBlue.png"],
    ["Spread 1", "AmmoDarkGreen.png"],
    ["Spread 2", "AmmoDarkGreen.png"],
    ["Spread 3", "AmmoDarkGreen.png"],
    ["Sticky 1", "AmmoBeige.png"],
    ["Sticky 2", "AmmoBeige.png"],
    ["Sticky 3", "AmmoBeige.png"],
    ["Cluster 1", "AmmoDarkRed.png"],
    ["Cluster 2", "AmmoDarkRed.png"],
    //("Cluster 3", "AmmoDarkRed.png"),
    ["Recover 1", "AmmoGreen.png"],
    ["Recover 2", "AmmoGreen.png"],
    ["Poison 1", "AmmoViolet.png"],
    ["Poison 2", "AmmoViolet.png"],
    ["Paralysis 1", "AmmoGold.png"],
    ["Paralysis 2", "AmmoGold.png"],
    ["Sleep 1", "AmmoCyan.png"],
    ["Sleep 2", "AmmoCyan.png"],
    ["Exhaust 1", "AmmoDarkPurple.png"],
    ["Exhaust 2", "AmmoDarkPurple.png"],
    ["Flaming", "AmmoOrange.png"],
    ["Water", "AmmoDarkBlue.png"],
    ["Freeze", "AmmoWhite.png"],
    ["Thunder", "AmmoYellow.png"],
    ["Dragon", "AmmoDarkRed.png"],
    ["Slicing", "AmmoWhite.png"],
    ["Wyvern", "AmmoLightBeige.png"],
    ["Demon", "AmmoRed.png"],
    ["Armor", "AmmoDarkBeige.png"],
    ["Tranq", "AmmoPink.png"],
];

export function loadDetailView(event) {
    let db = new sqlite3("mhwi.db");
    let data = event.data;

    switch (data.weapon_type) {
        case "light-bowgun":
        case "heavy-bowgun": 
            document.getElementById("ammo-tab-btn").classList.remove("hidden");
            break;
        case "hunting-horn":
            document.getElementById("melodies-tab-btn").classList.remove("hidden");
            break;
        default:
            document.getElementById("ammo-tab-btn").classList.add("hidden");
            document.getElementById("melodies-tab-btn").classList.add("hidden");
    }

    fs.stat(`images/weapons/${data.weapon_type}/${data.name}.jpg`, (err, stat) => {
        let image: any = document.getElementById("weapon-render");
        if (err === null) {
            image.src = `images/weapons/${data.weapon_type}/${data.name}.jpg`;
        } else {
            image.src = `images/transparent.png`;
            console.warn(err);
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
        insertHeading(table, ["Create: Name", "Quantity"]);
        for (let r of rows) {
            let img = `images/items-24/${r.icon_name}${r.icon_color}.png`;
            try {
                fs.statSync(img);
            } catch (err) {
                img = `images/unknown.png`;
                console.warn(err);
            }
            let row = table.insertRow();
            let name = row.insertCell(0);
                name.classList += "name";
                name.innerHTML = `<img src="${img}"/><p>${r.name}</p>`;
            
            let quantity = row.insertCell(1);
                quantity.classList += "quantity";
                quantity.innerHTML = `<p>${r.quantity}</p>`;
        }
    }
    rows = db.prepare(sql).all([data.upgrade_recipe_id]);
    table = document.getElementById("upgrade-weapon-materials-table");
    table.innerHTML = "";
    if (rows.length > 0) {
        insertHeading(table, ["Upgrade: Name", "Quantity"]);
        for (let r of rows) {
            let img = `images/items-24/${r.icon_name}${r.icon_color}.png`;
            try {
                fs.statSync(img);
            } catch (err) {
                img = `images/unknown.png`;
                console.warn(err);
            }
            let row = table.insertRow();
            let name = row.insertCell(0);
                name.classList += "name";
                name.innerHTML = `<img src="${img}"/><p>${r.name}</p>`;
            
            let quantity = row.insertCell(1);
                quantity.classList += "quantity";
                quantity.innerHTML = `<p>${r.quantity}</p>`;
        }
    }

    if (data.weapon_type === "hunting-horn") {
        let melodies_tab = document.getElementsByClassName("melodies-tab")[1];
            melodies_tab.innerHTML = "";
        table = melodies_tab.appendChild(document.createElement("TABLE"));
        insertHeading(table, ["Melody", "Duration"]);

        sql = `SELECT wmn.notes, wm.base_duration, wm.base_extension,
                    wm.m1_duration, wm.m1_extension,
                    wm.m2_duration, wm.m2_extension,
                    wmt.effect1, wmt.effect2
                FROM weapon_melody wm
                    JOIN weapon_melody_notes wmn
                        ON  wm.id = wmn.id
                    JOIN weapon_melody_text wmt
                        ON  wm.id = wmt.id
                        AND wmt.lang_id = 'en'
                ORDER BY wm.id`;
    
        let melodies = db.prepare(sql).all();
        for (let m of melodies) {
            let include_melody = true;
            for (let note of m.notes) {
                if (data.notes.indexOf(note) > -1) {
                    include_melody = true;
                } else if (note == "E") {
                    include_melody = true;
                } else {
                    include_melody = false;
                    break;
                }
            }

            if (include_melody) {
                let note_images: string[] = [];
                for (let c of m.notes) {
                    // Determine the image for each melody note.
                    let note = null;
                    switch (c) {
                        case "W":
                            note = `images/notes-24/Note${data.notes.indexOf(c) + 1}White.png`
                            break;
                        case "R":
                            note = `images/notes-24/Note${data.notes.indexOf(c) + 1}Red.png`
                            break;
                        case "C":
                            note = `images/notes-24/Note${data.notes.indexOf(c) + 1}Cyan.png`
                            break;
                        case "B":
                            note = `images/notes-24/Note${data.notes.indexOf(c) + 1}Blue.png`
                            break;
                        case "G":
                            note = `images/notes-24/Note${data.notes.indexOf(c) + 1}Green.png`
                            break;
                        case "O":
                            note = `images/notes-24/Note${data.notes.indexOf(c) + 1}Orange.png`
                            break;
                        case "Y":
                            note = `images/notes-24/Note${data.notes.indexOf(c) + 1}Yellow.png`
                            break;
                        case "P":
                            note = `images/notes-24/Note${data.notes.indexOf(c) + 1}Purple.png`
                            break;
                        case "E":
                            note = "images/notes-24/echo.png";
                            break;
                        default:
                            console.error(`Invalid note value: '${c}'.`);
                    };

                    note_images.push(note);
                }

                while (note_images.length < 4)  { // If the melody uses less than 4 notes.
                    note_images.push(null);
                }

                let base = "";
                if (m.base_duration !== null) {
                    if (m.base_extension !== null) {
                        base = `${m.base_duration}(+${m.base_extension})s`;
                    } else {
                        base = `${m.base_duration}s`;
                    }
                }

                let hm1 = "";
                if (m.m1_duration !== null) {
                    if (m.m1_extension !== null) {
                        hm1 = `${m.m1_duration}(+${m.m1_extension})s`;
                    } else {
                        hm1 = `${m.m1_duration}s`;
                    }
                }

                let hm2 = "";
                if (m.m2_duration !== null) {
                    if (m.m2_extension !== null) {
                        hm2 = `${m.m2_duration}(+${m.m2_extension})s`;
                    } else {
                        hm2 = `${m.m2_duration}s`;
                    }
                }

                let effect = "";
                if (m.effect2 !== "N/A") {
                    effect = `${m.effect1}<br>${m.effect2}`;
                } else {
                    effect = m.effect1;
                }

                appendMelody(table, note_images, base, hm1, hm2, effect);
            }
        }
    }

    if (data.weapon_type === "light-bowgun" || data.weapon_type === "heavy-bowgun") {
        let sql = `SELECT normal1_clip, normal1_rapid, normal1_recoil, normal1_reload, normal2_clip, normal2_rapid,
                        normal2_recoil, normal2_reload, normal3_clip, normal3_rapid, normal3_recoil, normal3_reload, pierce1_clip, pierce1_rapid, pierce1_recoil, pierce1_reload,
                        pierce2_clip, pierce2_rapid, pierce2_recoil, pierce2_reload, pierce3_clip, pierce3_rapid, pierce3_recoil, pierce3_reload, spread1_clip, spread1_rapid,
                        spread1_recoil, spread1_reload, spread2_clip, spread2_rapid, spread2_recoil, spread2_reload, spread3_clip, spread3_rapid, spread3_recoil, spread3_reload,
                        sticky1_clip, sticky1_rapid, sticky1_recoil, sticky1_reload, sticky2_clip, sticky2_rapid, sticky2_recoil, sticky2_reload, sticky3_clip, sticky3_rapid, sticky3_recoil, sticky3_reload,
                        cluster1_clip, cluster1_rapid, cluster1_recoil, cluster1_reload, cluster2_clip, cluster2_rapid, cluster2_recoil, cluster2_reload,
                        recover1_clip, recover1_rapid, recover1_recoil, recover1_reload, recover2_clip, recover2_rapid, recover2_recoil, recover2_reload, poison1_clip, poison1_rapid, poison1_recoil, poison1_reload,
                        poison2_clip, poison2_rapid, poison2_recoil, poison2_reload, paralysis1_clip, paralysis1_rapid, paralysis1_recoil, paralysis1_reload, paralysis2_clip, paralysis2_rapid, paralysis2_recoil, paralysis2_reload,
                        sleep1_clip, sleep1_rapid, sleep1_recoil, sleep1_reload, sleep2_clip, sleep2_rapid, sleep2_recoil, sleep2_reload, exhaust1_clip, exhaust1_rapid, exhaust1_recoil, exhaust1_reload,
                        exhaust2_clip, exhaust2_rapid, exhaust2_recoil, exhaust2_reload, flaming_clip, flaming_rapid, flaming_recoil, flaming_reload, water_clip, water_rapid, water_recoil, water_reload,
                        freeze_clip, freeze_rapid, freeze_recoil, freeze_reload, thunder_clip, thunder_rapid, thunder_recoil, thunder_reload, dragon_clip, dragon_rapid, dragon_recoil, dragon_reload,
                        slicing_clip, slicing_rapid, slicing_recoil, slicing_reload, wyvern_clip, wyvern_reload, demon_clip, demon_recoil, demon_reload, armor_clip, armor_recoil, armor_reload, tranq_clip, tranq_recoil, tranq_reload
                    FROM weapon_ammo
                    WHERE id = ?`;
        let ammo = Object.values(db.prepare(sql).get(data.ammo_id));
        let ammo_list = [];
        let col = 0;
        let i = 0;
        while (col != 131) {
            // Not every ammo type has the same amount of levels which
            // is why things are done slightly differently depending on the index.
            if (col == 120) {
                ammo_list.push({
                    ammo_type: AMMO_TYPES[i][0],
                    clip: ammo[col],
                    rapid: 0,
                    recoil: 0,
                    reload: ammo[col + 1] !== null ? capitalize_split(String(ammo[col + 1])) : "",
                    image: AMMO_TYPES[i][1],
                });
                col += 2;
            } else if (col > 120) {
                ammo_list.push({
                    ammo_type: AMMO_TYPES[i][0],
                    clip: ammo[col],
                    rapid: 0,
                    recoil: ammo[col + 1],
                    reload: ammo[col + 2] !== null ? capitalize_split(String(ammo[col + 2])) : "",
                    image: AMMO_TYPES[i][1],
                });
                col += 3;
            } else {
                ammo_list.push({
                    ammo_type: AMMO_TYPES[i][0],
                    clip: ammo[col],
                    rapid: ammo[col + 1],
                    recoil: ammo[col + 2],
                    reload: ammo[col + 3] !== null ? capitalize_split(String(ammo[col + 3])) : "",
                    image: AMMO_TYPES[i][1],
                });
                col += 4;
            }

            i += 1;
        }

        let ammo_tab = document.getElementsByClassName("ammo-tab")[1];
            ammo_tab.innerHTML = "";
        table = ammo_tab.appendChild(document.createElement("TABLE"));
        insertHeading(table, ["Name", "Clip", "Type+Recoil", "Reload"]);
        for (let a of ammo_list) {
            if (a.clip > 0) {
                appendAmmo(table, a);
            }
        }
    }
}

function appendAmmo(table: any, ammo): void {
    let row = table.insertRow();
    let name = row.insertCell(0);
        name.innerHTML += `<img src="images/items-24/${ammo.image}"/>${ammo.ammo_type}`;
    
    let clip = row.insertCell(1);
        clip.innerHTML = ammo.clip;

    if (ammo.rapid === 1) {
        let type_and_recoild = row.insertCell(2);
            type_and_recoild.innerHTML = "Rapid";
    } else if (ammo.ammo_type === "Wyvern") {
        let type_and_recoild = row.insertCell(2);
            type_and_recoild.innerHTML = `Wyvern`;
    } else if (ammo.recoil === -1) {
        let type_and_recoild = row.insertCell(2);
            type_and_recoild.innerHTML = `Auto Reload`;
    } else {
        let type_and_recoild = row.insertCell(2);
            type_and_recoild.innerHTML = `Normal+${ammo.recoil}`;
    }

    let reload = row.insertCell(3);
        reload.innerHTML = ammo.reload;   
}

function appendMelody(table: any, note_images: string[], base: string, hm1: string, hm2: string, effect: string): void {
    let row = table.insertRow();
    let melody = row.insertCell(0);
    for (let img of note_images) {
        if (img !== null) {
            melody.innerHTML += `<img width=24 src="${img}"/>`;
        }
    }
    melody.innerHTML += `<br>${effect}`;
    
    let duration = row.insertCell(1);
        duration.innerHTML = `${base}<br>${hm1}<br>${hm2}`;
}

function insertHeading(table: any, headings: string[]): void {
    let row = table.insertRow();
        row.classList += "table-heading";
    for (let h of headings) {
        let cell = row.insertCell(-1);
            cell.innerHTML = h;
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

export function showTab(event): void {
    let tabs: any = document.getElementsByClassName("tab");
    for (let t of tabs) {
        t.classList.remove("active");
    }
    tabs = document.getElementsByClassName("active-tab-switch");
    for (let t of tabs) {
        t.classList.remove("active-tab-switch");
    }

    event.currentTarget.classList.add("active-tab-switch")
    let cls: any = (event.currentTarget.classList.item(0));
    (document.getElementsByClassName(cls) as any)[1].classList.add("active");
} 