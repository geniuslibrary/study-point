
const fs = require("fs");
let content = fs.readFileSync("src/pages/Reports.jsx", "utf-8");

content = content.replace(
    "</Layout>",
    `
        {/* Helper Action Buttons for Daily and Monthly */}
        {activeTab !== "custom" && (
            <div className="flex justify-end mt-8 border-t border-gray-200 pt-6">
                <Button variant="primary" icon={<FileSpreadsheet size={16}/>} onClick={() => handlePrintStatement(activeTab)}>
                    Download \${activeTab === "daily" ? "Daily" : "Monthly"} Official PDF Statement
                </Button>
            </div>
        )}
      </Layout>`
);
fs.writeFileSync("src/pages/Reports.jsx", content);
console.log("Done");

