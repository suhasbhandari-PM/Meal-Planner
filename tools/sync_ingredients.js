// Regenerates the "Ingredients by recipe" section of Healthy_Recipe_Bank.md from the data in index.html,
// so the markdown and the app never drift apart. Run from the repo root:  node tools/sync_ingredients.js
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const script = html.match(/<script>([\s\S]*)<\/script>/)[1];
const data = script.slice(script.indexOf("var Y"), script.indexOf("var SLOTS = ["));
const { RECIPES, CATALOG, RECIPE_ING, STAPLES } = new Function(data + ";return {RECIPES,CATALOG,RECIPE_ING,STAPLES}")();

const label = {};
CATALOG.forEach((c) => { label[c[0]] = c[1]; });
const name = (k) => (Array.isArray(k) ? k.map(name).join(" / ") : label[k]);
const titles = { breakfast: "Breakfast", lunch: "Lunch and lunch box", snack: "Evening snacks", toddler: "Toddler egg ideas" };

let md = "## Ingredients by recipe (serves 3: 2 adults + toddler)\n\n";
md += "Quantities are home-style estimates, not copied from the videos. *(optional)* items are for serving or flavour. " +
  "Not listed, assumed always in the kitchen: " + STAPLES + ".\n";
Object.keys(titles).forEach((slot) => {
  md += "\n### " + titles[slot] + "\n\n| Recipe | Ingredients |\n|---|---|\n";
  RECIPES[slot].forEach((r) => {
    const ing = RECIPE_ING[r.n];
    if (!ing) throw new Error("No ingredients for: " + r.n);
    md += "| " + r.n + " | " + ing.map((i) => name(i[0]) + " (" + i[1] + ")" + (i[2] ? " *(optional)*" : "")).join(", ") + " |\n";
  });
});

const start = "<!-- ingredients:start -->";
const end = "<!-- ingredients:end -->";
const block = start + "\n" + md + end;
const file = path.join(root, "Healthy_Recipe_Bank.md");
let bank = fs.readFileSync(file, "utf8").replace(/\r\n/g, "\n");
if (bank.includes(start)) {
  bank = bank.replace(new RegExp(start + "[\\s\\S]*?" + end), () => block);
} else {
  const anchor = "## Suggested additions to groceries (optional)";
  if (!bank.includes(anchor)) throw new Error("Anchor heading not found in the bank");
  bank = bank.replace(anchor, () => block + "\n\n" + anchor);
}
fs.writeFileSync(file, bank);
console.log("Updated ingredients for " + Object.values(RECIPES).flat().length + " recipes in Healthy_Recipe_Bank.md");
