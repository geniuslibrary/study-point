
const fs = require("fs");
let content = fs.readFileSync("src/pages/Reports.jsx", "utf-8");

// Remove the stray return block at line 167
content = content.replace(
    /  return \(\s*<Layout title="Reports">\s*<div className="flex items-center justify-center h-64">\s*<Loader2 className="w-8 h-8 animate-spin text-indigo-600" \/>\s*<\/div>\s*<\/Layout>\s*\);\s*}\s*\/\/ ----------------------------------------------------/g,
    "  // ----------------------------------------------------"
);

fs.writeFileSync("src/pages/Reports.jsx", content);
console.log("Stray return removed!");

