import Database from "@replit/database";
import fs from "fs";

const db = new Database();

const keyObject = await db.list();
const keys = Object.keys(keyObject);

const exportData = {};

for (const key of keys) {
  exportData[key] = await db.get(key);
}

fs.writeFileSync("replit_db_export.json", JSON.stringify(exportData, null, 2));
console.log("Export complete: replit_db_export.json");
