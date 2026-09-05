
const fs = require("fs");
let content = fs.readFileSync("src/pages/Reports.jsx", "utf-8");

// 1. Add imports
content = content.replace(
    "import { fetchCollectionData } from '../firebase/storageService';",
    "import { fetchCollectionData } from '../firebase/storageService';\nimport { createPortal } from 'react-dom';\nimport TransactionStatement from '../components/reports/TransactionStatement';"
);

// 2. Add states
content = content.replace(
    "const [selectedMonth, setSelectedMonth] = useState(currentMonthStr);",
    "const [selectedMonth, setSelectedMonth] = useState(currentMonthStr);\n  const [customStartDate, setCustomStartDate] = useState(new Date(now.setDate(now.getDate() - 30)).toISOString().split('T')[0]);\n  const [customEndDate, setCustomEndDate] = useState(todayStr);\n  const [showStatementMode, setShowStatementMode] = useState(null);"
);

// 3. Add print statement helper (before handlePrint)
const printHelper = `
  const handlePrintStatement = (mode) => {
    setShowStatementMode(mode);
    setTimeout(() => {
      document.body.classList.add('is-printing-receipt');
      window.print();
      document.body.classList.remove('is-printing-receipt');
      setShowStatementMode(null);
    }, 100);
  };
`;
content = content.replace(
    "const handlePrint = () => {",
    printHelper + "\n  const handlePrint = () => {"
);

// 4. Update helper functions
const matchDateRange = `
  const matchesDateRange = (dateVal, startStr, endStr) => {
    if (!dateVal) return false;
    let dStr = "";
    if (typeof dateVal === "string") dStr = dateVal.split("T")[0];
    else if (dateVal.seconds) dStr = new Date(dateVal.seconds * 1000).toISOString().split("T")[0];
    else if (dateVal.toDate) dStr = dateVal.toDate().toISOString().split("T")[0];
    else dStr = new Date(dateVal).toISOString().split("T")[0];
    
    return dStr >= startStr && dStr <= endStr;
  };
`;
content = content.replace(
    "const matchesMonth = (dateVal, targetMonthStr) => {",
    matchDateRange + "\n  const matchesMonth = (dateVal, targetMonthStr) => {"
);

// 5. Add custom calculations (just before the return statement)
const customCalculations = `
  // ----------------------------------------------------
  // CUSTOM / LIFETIME REPORT CALCULATIONS
  // ----------------------------------------------------
  const customFees = fees.filter((f) => 
    (f.status === "paid") && (matchesDateRange(f.paidDate || f.month + "-01", customStartDate, customEndDate))
  );
  const customExpenses = expenses.filter((e) => 
    matchesDateRange(e.date, customStartDate, customEndDate)
  );

  const customTotalRevenue = customFees.reduce((sum, f) => sum + (Number(f.amount) || 0), 0);
  const customTotalExpense = customExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const customNetProfit = customTotalRevenue - customTotalExpense;

  let portalTarget = null;
  if (showStatementMode) {
      portalTarget = document.getElementById("print-only-container");
      if (!portalTarget) {
          portalTarget = document.createElement("div");
          portalTarget.id = "print-only-container";
          document.body.appendChild(portalTarget);
      }
  }
`;
content = content.replace(
    "  return (",
    customCalculations + "\n  return ("
);

// 6. Update Tab buttons
const newTabHtml = `
              <button
                onClick={() => setActiveTab("custom")}
                className={\`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer \${
                  activeTab === "custom"
                    ? "bg-white text-indigo-700 shadow-xs"
                    : "text-gray-600 hover:text-gray-900"
                }\`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Custom / Lifetime</span>
              </button>
`;
content = content.replace(
    "</div>\n\n            <Button\n              variant=\"secondary\"",
    newTabHtml + "            </div>\n\n            <Button\n              variant=\"secondary\""
);

// 7. Add Custom Tab UI and Portal renderer
const customUi = `
        {/* ========================================================================= */}
        {/* 3. CUSTOM / LIFETIME REPORT VIEW                                          */}
        {/* ========================================================================= */}
        {activeTab === "custom" && (
          <div className="space-y-6 animate-fade-in" id="custom-report-section">
            <div className="bg-white p-4 rounded-2xl shadow-xs border border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-indigo-600" />
                <span className="font-bold text-gray-900 text-sm">Select Date Range for Audit:</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="px-3 py-1.5 text-sm font-semibold border-2 border-indigo-100 rounded-lg text-indigo-900 focus:outline-none focus:border-indigo-500 bg-indigo-50/30"
                />
                <span className="text-gray-400 font-bold">to</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="px-3 py-1.5 text-sm font-semibold border-2 border-indigo-100 rounded-lg text-indigo-900 focus:outline-none focus:border-indigo-500 bg-indigo-50/30"
                />
              </div>
            </div>

            {/* Custom Range Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-none shadow-md shadow-emerald-500/20">
                <div className="p-5 flex items-center justify-between">
                  <div>
                    <p className="text-emerald-100 font-bold text-sm uppercase tracking-wider mb-1">
                      Total Revenue (IN)
                    </p>
                    <h3 className="text-2xl font-black">{formatCurrency(customTotalRevenue)}</h3>
                  </div>
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                </div>
              </Card>

              <Card className="bg-gradient-to-br from-rose-500 to-rose-600 text-white border-none shadow-md shadow-rose-500/20">
                <div className="p-5 flex items-center justify-between">
                  <div>
                    <p className="text-rose-100 font-bold text-sm uppercase tracking-wider mb-1">
                      Total Expenses (OUT)
                    </p>
                    <h3 className="text-2xl font-black">{formatCurrency(customTotalExpense)}</h3>
                  </div>
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                    <TrendingDown className="w-6 h-6 text-white" />
                  </div>
                </div>
              </Card>

              <Card
                className={\`border-none shadow-md \${
                  customNetProfit >= 0
                    ? "bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-indigo-500/20"
                    : "bg-gradient-to-br from-orange-500 to-orange-600 shadow-orange-500/20"
                } text-white\`}
              >
                <div className="p-5 flex items-center justify-between">
                  <div>
                    <p className="text-white/80 font-bold text-sm uppercase tracking-wider mb-1">
                      Net Profit / Loss
                    </p>
                    <h3 className="text-2xl font-black">{formatCurrency(customNetProfit)}</h3>
                  </div>
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                    <IndianRupee className="w-6 h-6 text-white" />
                  </div>
                </div>
              </Card>
            </div>

            <div className="flex justify-center mt-8">
               <Button variant="primary" icon={<FileSpreadsheet size={16}/>} onClick={() => handlePrintStatement("custom")}>
                  Download Official PDF Statement
               </Button>
            </div>
          </div>
        )}

        {/* Portal for Statement PDF Printing */}
        {showStatementMode && portalTarget && createPortal(
            <TransactionStatement 
                title={showStatementMode === "daily" ? "Daily Ledger" : showStatementMode === "monthly" ? "Monthly Ledger" : "Custom Ledger"}
                dateRangeStr={
                    showStatementMode === "daily" ? formatDate(selectedDate) :
                    showStatementMode === "monthly" ? selectedMonth : 
                    \`\${formatDate(customStartDate)} to \${formatDate(customEndDate)}\`
                }
                fees={showStatementMode === "daily" ? dailyFees : showStatementMode === "monthly" ? monthlyPaidFees : customFees}
                expenses={showStatementMode === "daily" ? dailyExpenses : showStatementMode === "monthly" ? monthlyExpenses : customExpenses}
                totalRevenue={showStatementMode === "daily" ? dailyTotalCollection : showStatementMode === "monthly" ? monthlyTotalRevenue : customTotalRevenue}
                totalExpense={showStatementMode === "daily" ? dailyTotalExpense : showStatementMode === "monthly" ? monthlyTotalExpense : customTotalExpense}
                netProfit={showStatementMode === "daily" ? dailyNetCashFlow : showStatementMode === "monthly" ? monthlyNetProfit : customNetProfit}
            />,
            portalTarget
        )}
`;

content = content.replace("      </div>\n    </Layout>\n  );\n}", customUi + "\n      </div>\n    </Layout>\n  );\n}");

fs.writeFileSync("src/pages/Reports.jsx", content);
console.log("Reports.jsx patched successfully!");

