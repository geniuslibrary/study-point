
const fs = require("fs");
let content = fs.readFileSync("src/pages/Reports.jsx", "utf-8");

const oldCustomSection = /\{activeTab === "custom" && \([\s\S]*?\{showStatementMode && portalTarget && createPortal/g;

// I will extract the piece starting from `{activeTab === "custom" && (` to just before `        {/* Portal for Statement PDF Printing */}`
// Wait, I need a precise Regex.

const regex = /\{activeTab === "custom" && \([\s\S]*?id="custom-report-section">[\s\S]*?<\/div>\s*\n\s*\)\}\s*\{\/\* Portal for Statement PDF Printing \*\//g;

const newCustomSection = `{activeTab === "custom" && (
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
                  className="px-3.5 py-1.5 border border-gray-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 bg-white"
                />
                <span className="text-gray-400 font-bold">to</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="px-3.5 py-1.5 border border-gray-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 bg-white"
                />
              </div>
            </div>

            {/* Custom Range Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Card 1: Revenue */}
              <div className="bg-white rounded-2xl p-5 shadow-xs border border-gray-100 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Total Revenue (IN)
                  </span>
                  <div className="w-9 h-9 bg-green-50 text-green-600 rounded-xl flex items-center justify-center">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-3">
                  <p className="text-2xl font-extrabold text-gray-900">{formatCurrency(customTotalRevenue)}</p>
                  <p className="text-xs text-green-600 font-medium mt-0.5">
                    {customFees.length} Fee Payments Received
                  </p>
                </div>
              </div>

              {/* Card 2: Expenses */}
              <div className="bg-white rounded-2xl p-5 shadow-xs border border-gray-100 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Total Expenses (OUT)
                  </span>
                  <div className="w-9 h-9 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center">
                    <TrendingDown className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-3">
                  <p className="text-2xl font-extrabold text-gray-900">{formatCurrency(customTotalExpense)}</p>
                  <p className="text-xs text-rose-600 font-medium mt-0.5">
                    {customExpenses.length} Expense Records
                  </p>
                </div>
              </div>

              {/* Card 3: Net Profit */}
              <div className="bg-white rounded-2xl p-5 shadow-xs border border-gray-100 flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-bl-full -mr-4 -mt-4 z-0 transition-transform hover:scale-110"></div>
                <div className="flex items-center justify-between relative z-10">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Net Profit / Loss
                  </span>
                  <div className={\`w-9 h-9 rounded-xl flex items-center justify-center \${customNetProfit >= 0 ? "bg-indigo-100 text-indigo-700" : "bg-orange-100 text-orange-700"}\`}>
                    <IndianRupee className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-3 relative z-10">
                  <p className={\`text-2xl font-extrabold \${customNetProfit >= 0 ? "text-indigo-700" : "text-orange-600"}\`}>
                    {formatCurrency(customNetProfit)}
                  </p>
                  <p className="text-xs text-gray-500 font-medium mt-0.5">
                    Overall financial balance
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 items-center justify-end mt-4">
               <button 
                  onClick={() => handlePrintStatement("custom")}
                  className="flex items-center justify-center gap-2 px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-md transition-all active:scale-95 w-full sm:w-auto"
               >
                  <FileSpreadsheet size={18} />
                  Download Official PDF Statement
               </button>
            </div>
          </div>
        )}

        {/* Portal for Statement PDF Printing */`;

const match = content.match(regex);
if (match) {
    content = content.replace(regex, newCustomSection);
    fs.writeFileSync("src/pages/Reports.jsx", content);
    console.log("Custom Tab UI redesigned!");
} else {
    console.log("Regex did not match.");
}

