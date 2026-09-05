
const fs = require("fs");
let content = fs.readFileSync("src/pages/Reports.jsx", "utf-8");

content = content.replace(
    /const matchesDateRange = \(dateVal, startStr, endStr\) => {[\s\S]*?return dStr >= startStr && dStr <= endStr;\n  };/g,
    `const matchesDateRange = (dateVal, startStr, endStr) => {
    if (!dateVal) return false;
    let dStr = "";
    try {
      if (typeof dateVal === "string") dStr = dateVal.split("T")[0];
      else if (dateVal.seconds) dStr = new Date(dateVal.seconds * 1000).toISOString().split("T")[0];
      else if (dateVal.toDate) dStr = dateVal.toDate().toISOString().split("T")[0];
      else dStr = new Date(dateVal).toISOString().split("T")[0];
    } catch (e) {
      dStr = "";
    }
    return dStr ? (dStr >= startStr && dStr <= endStr) : false;
  };`
);
fs.writeFileSync("src/pages/Reports.jsx", content);

let stmtContent = fs.readFileSync("src/components/reports/TransactionStatement.jsx", "utf-8");
stmtContent = stmtContent.replace(
    /let dStr = "";[\s\S]*?else if \(f\.month\) {/g,
    `let dStr = "";
            try {
              if (f.paidDate) {
                  if (typeof f.paidDate === "string") dStr = f.paidDate.split("T")[0];
                  else if (f.paidDate.toDate) dStr = f.paidDate.toDate().toISOString().split("T")[0];
                  else dStr = new Date(f.paidDate).toISOString().split("T")[0];
              } else if (f.month) {`
);
stmtContent = stmtContent.replace(
    /} else if \(f\.month\) {[\s\S]*?dStr = f\.month \+ "-01";[\s\S]*?}/g,
    `} else if (f.month) {
                  dStr = f.month + "-01";
              }
            } catch(e) { dStr = f.month ? f.month + "-01" : "2026-01-01"; }`
);

stmtContent = stmtContent.replace(
    /let dStr = "";[\s\S]*?if \(e\.date\) {[\s\S]*?if \(typeof e\.date === "string"\) dStr = e\.date\.split\("T"\)\[0\];[\s\S]*?else if \(e\.date\.toDate\) dStr = e\.date\.toDate\(\)\.toISOString\(\)\.split\("T"\)\[0\];[\s\S]*?else dStr = new Date\(e\.date\)\.toISOString\(\)\.split\("T"\)\[0\];[\s\S]*?}/g,
    `let dStr = "";
        try {
            if (e.date) {
                if (typeof e.date === "string") dStr = e.date.split("T")[0];
                else if (e.date.toDate) dStr = e.date.toDate().toISOString().split("T")[0];
                else dStr = new Date(e.date).toISOString().split("T")[0];
            }
        } catch(err) { dStr = "2026-01-01"; }`
);

fs.writeFileSync("src/components/reports/TransactionStatement.jsx", stmtContent);
console.log("Safe dates patched!");

