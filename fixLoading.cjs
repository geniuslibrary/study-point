
const fs = require("fs");
let content = fs.readFileSync("src/pages/Reports.jsx", "utf-8");

content = content.replace(
    "  if (loading) {\n  \n  // ----------------------------------------------------",
    "  if (loading) {\n    return (\n      <Layout title=\"Reports\">\n        <div className=\"flex items-center justify-center h-64\">\n          <Loader2 className=\"w-8 h-8 animate-spin text-indigo-600\" />\n        </div>\n      </Layout>\n    );\n  }\n  \n  // ----------------------------------------------------"
);
fs.writeFileSync("src/pages/Reports.jsx", content);
console.log("Fixed!");

