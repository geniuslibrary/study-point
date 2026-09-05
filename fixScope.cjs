
const fs = require("fs");
let content = fs.readFileSync("src/pages/Reports.jsx", "utf-8");

const regex = /\/\/ ----------------------------------------------------[\s\S]*?\/\/ CUSTOM \/ LIFETIME REPORT CALCULATIONS[\s\S]*?\/\/ ----------------------------------------------------[\s\S]*?const customNetProfit = customTotalRevenue - customTotalExpense;/;
const match = content.match(regex);
if (match) {
    // Remove from inside the loading block
    content = content.replace(match[0], "");
    
    // Inject right before the second `return (` which is followed by `<Layout title="Reports">` and `<div className="space-y-6">`
    content = content.replace(
        /  return \([\s]*<Layout title="Reports">[\s]*<div className="space-y-6">/,
        match[0] + "\n\n  return (\n    <Layout title=\"Reports\">\n      <div className=\"space-y-6\">"
    );
}

fs.writeFileSync("src/pages/Reports.jsx", content);
console.log("Scope fixed!");

