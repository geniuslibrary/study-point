
const fs = require("fs");
let content = fs.readFileSync("src/pages/Reports.jsx", "utf-8");
content = content.replace(/}\n}$/, "}");
fs.writeFileSync("src/pages/Reports.jsx", content);

