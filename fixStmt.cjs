
const fs = require("fs");
let content = fs.readFileSync("src/components/reports/TransactionStatement.jsx", "utf-8");
content = content.replace(/\\`/g, "`").replace(/\\\$/g, "$");
fs.writeFileSync("src/components/reports/TransactionStatement.jsx", content);

