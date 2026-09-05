
const fs = require("fs");
let content = fs.readFileSync("src/pages/Reports.jsx", "utf-8");

// 1. Remove the misplaced helper action buttons
content = content.replace(
    `
        {/* Helper Action Buttons for Daily and Monthly */}
        {activeTab !== "custom" && (
            <div className="flex justify-end mt-8 border-t border-gray-200 pt-6">
                <Button variant="primary" icon={<FileSpreadsheet size={16}/>} onClick={() => handlePrintStatement(activeTab)}>
                    Download \${activeTab === "daily" ? "Daily" : "Monthly"} Official PDF Statement
                </Button>
            </div>
        )}
      </Layout>`,
    `      </Layout>`
);

// 2. Add them before the FINAL </Layout> instead
content = content.replace(
    "      </div>\n    </Layout>",
    `
        {/* Helper Action Buttons for Daily and Monthly */}
        {activeTab !== "custom" && (
            <div className="flex justify-end mt-8 border-t border-gray-200 pt-6">
                <Button variant="primary" icon={<FileSpreadsheet size={16}/>} onClick={() => handlePrintStatement(activeTab)}>
                    Download {activeTab === "daily" ? "Daily" : "Monthly"} Official PDF Statement
                </Button>
            </div>
        )}
      </div>
    </Layout>`
);

// 3. Fix the portal target to use a useEffect and state
const newPortalLogic = `
  const [portalTarget, setPortalTarget] = useState(null);
  useEffect(() => {
    let el = document.getElementById("print-only-container");
    if (!el) {
      el = document.createElement("div");
      el.id = "print-only-container";
      document.body.appendChild(el);
    }
    setPortalTarget(el);
  }, []);
`;

// Remove the old portalTarget logic
content = content.replace(
    /let portalTarget = null;[\s\S]*?if \(showStatementMode\) {[\s\S]*?portalTarget = document\.getElementById\("print-only-container"\);[\s\S]*?if \(!portalTarget\) {[\s\S]*?portalTarget = document\.createElement\("div"\);[\s\S]*?portalTarget\.id = "print-only-container";[\s\S]*?document\.body\.appendChild\(portalTarget\);[\s\S]*?}[\s\S]*?}/g,
    ""
);

// Inject new logic after showStatementMode state
content = content.replace(
    "const [showStatementMode, setShowStatementMode] = useState(null);",
    "const [showStatementMode, setShowStatementMode] = useState(null);\n" + newPortalLogic
);

fs.writeFileSync("src/pages/Reports.jsx", content);
console.log("Reports.jsx fixed!");

