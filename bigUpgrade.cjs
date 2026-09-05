
const fs = require("fs");
let content = fs.readFileSync("src/pages/Reports.jsx", "utf-8");

// 1. Add Monthly Payment Mode Calculations
const monthlyCalcInsert = `
  // Monthly payment mode breakdown
  const monthlyCashCollection = monthlyPaidFees
    .filter((f) => !f.paymentMode || f.paymentMode === "cash")
    .reduce((sum, f) => sum + (Number(f.amount) || 0), 0);
  const monthlyUpiCollection = monthlyPaidFees
    .filter((f) => f.paymentMode === "upi")
    .reduce((sum, f) => sum + (Number(f.amount) || 0), 0);
  const monthlyBankCollection = monthlyPaidFees
    .filter((f) => f.paymentMode === "bank")
    .reduce((sum, f) => sum + (Number(f.amount) || 0), 0);
`;
content = content.replace(
    "  // Shift-wise revenue breakdown in selected month",
    monthlyCalcInsert + "  // Shift-wise revenue breakdown in selected month"
);

// 2. Add Custom Payment Mode Calculations
const customCalcInsert = `
  const customCashCollection = customFees
    .filter((f) => !f.paymentMode || f.paymentMode === "cash")
    .reduce((sum, f) => sum + (Number(f.amount) || 0), 0);
  const customUpiCollection = customFees
    .filter((f) => f.paymentMode === "upi")
    .reduce((sum, f) => sum + (Number(f.amount) || 0), 0);
  const customBankCollection = customFees
    .filter((f) => f.paymentMode === "bank")
    .reduce((sum, f) => sum + (Number(f.amount) || 0), 0);
  const customCategoryExpenseMap = {};
  customExpenses.forEach((exp) => {
    const cat = exp.category || "Other";
    customCategoryExpenseMap[cat] = (customCategoryExpenseMap[cat] || 0) + (Number(exp.amount) || 0);
  });
`;
content = content.replace(
    "  // ----------------------------------------------------\n  // CUSTOM / LIFETIME REPORT CALCULATIONS",
    customCalcInsert + "\n  // ----------------------------------------------------\n  // CUSTOM / LIFETIME REPORT CALCULATIONS"
);

// 3. Add Payment Mode section to Monthly tab (after the 4-card grid, before Shift-Wise Revenue)
const monthlyPaymentModeSection = `
            {/* Monthly Collections By Payment Mode */}
            <div className="bg-white p-4 rounded-2xl shadow-xs border border-gray-200">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                Monthly Collections By Payment Mode
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">??</span>
                    <span className="text-sm font-semibold text-gray-700">Cash</span>
                  </div>
                  <span className="text-base font-extrabold text-gray-900">{formatCurrency(monthlyCashCollection)}</span>
                </div>
                <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">??</span>
                    <span className="text-sm font-semibold text-indigo-900">UPI / QR Code</span>
                  </div>
                  <span className="text-base font-extrabold text-indigo-700">{formatCurrency(monthlyUpiCollection)}</span>
                </div>
                <div className="p-3 bg-purple-50/60 rounded-xl border border-purple-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">??</span>
                    <span className="text-sm font-semibold text-purple-900">Bank Transfer</span>
                  </div>
                  <span className="text-base font-extrabold text-purple-700">{formatCurrency(monthlyBankCollection)}</span>
                </div>
              </div>
            </div>
`;
content = content.replace(
    "            {/* Shift-Wise Revenue Breakdown */}",
    monthlyPaymentModeSection + "\n            {/* Shift-Wise Revenue Breakdown */}"
);

// 4. Upgrade Custom tab with rich sections
const oldCustomContent = `            <div className="flex flex-col sm:flex-row gap-4 items-center justify-end mt-4">
               <button 
                  onClick={() => handlePrintStatement("custom")}
                  className="flex items-center justify-center gap-2 px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-md transition-all active:scale-95 w-full sm:w-auto"
               >
                  <FileSpreadsheet size={18} />
                  Download Official PDF Statement
               </button>
            </div>
          </div>
        )}`;

const newCustomContent = `
            {/* Custom Payment Mode Breakdown */}
            <div className="bg-white p-4 rounded-2xl shadow-xs border border-gray-200">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                Collections By Payment Mode
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">??</span>
                    <span className="text-sm font-semibold text-gray-700">Cash</span>
                  </div>
                  <span className="text-base font-extrabold text-gray-900">{formatCurrency(customCashCollection)}</span>
                </div>
                <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">??</span>
                    <span className="text-sm font-semibold text-indigo-900">UPI / QR Code</span>
                  </div>
                  <span className="text-base font-extrabold text-indigo-700">{formatCurrency(customUpiCollection)}</span>
                </div>
                <div className="p-3 bg-purple-50/60 rounded-xl border border-purple-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">??</span>
                    <span className="text-sm font-semibold text-purple-900">Bank Transfer</span>
                  </div>
                  <span className="text-base font-extrabold text-purple-700">{formatCurrency(customBankCollection)}</span>
                </div>
              </div>
            </div>

            {/* Custom Category-Wise Expenses Breakdown */}
            <div className="bg-white rounded-2xl shadow-xs border border-gray-200 overflow-hidden">
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingDown className="w-5 h-5 text-red-600" />
                  <h3 className="font-bold text-gray-900">Category-Wise Expenses</h3>
                </div>
                <span className="text-xs font-bold text-red-600">Total: {formatCurrency(customTotalExpense)}</span>
              </div>
              {Object.keys(customCategoryExpenseMap).length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      <tr>
                        <th className="px-4 py-3">Expense Category</th>
                        <th className="px-4 py-3">Share (%)</th>
                        <th className="px-4 py-3 text-right">Amount (?)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {Object.entries(customCategoryExpenseMap).map(([category, amount]) => {
                        const pct = customTotalExpense > 0 ? Math.round((amount / customTotalExpense) * 100) : 0;
                        return (
                          <tr key={category} className="hover:bg-gray-50/80">
                            <td className="px-4 py-3 font-semibold text-gray-800">{category}</td>
                            <td className="px-4 py-3 text-xs text-gray-500 font-medium">{pct}% of total</td>
                            <td className="px-4 py-3 font-bold text-gray-900 text-right">{formatCurrency(amount)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-6 text-center text-gray-400 text-xs">No expenses in this date range.</div>
              )}
            </div>

            {/* Custom Fee Collections Table */}
            <div className="bg-white rounded-2xl shadow-xs border border-gray-200 overflow-hidden">
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <IndianRupee className="w-5 h-5 text-indigo-600" />
                  <h3 className="font-bold text-gray-900">Fee Payments Collected</h3>
                </div>
                <span className="text-xs font-bold text-indigo-600">{customFees.length} Payments | Total: {formatCurrency(customTotalRevenue)}</span>
              </div>
              {customFees.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      <tr>
                        <th className="px-4 py-3">Student</th>
                        <th className="px-4 py-3">Date Paid</th>
                        <th className="px-4 py-3">Mode</th>
                        <th className="px-4 py-3 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {customFees.map((fee) => {
                        const student = getStudentInfo(fee.studentId);
                        return (
                          <tr key={fee.id} className="hover:bg-gray-50/80">
                            <td className="px-4 py-3 font-semibold text-gray-900">{student.name}</td>
                            <td className="px-4 py-3 text-xs text-gray-600">{formatDate(fee.paidDate || fee.month)}</td>
                            <td className="px-4 py-3">
                              <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-indigo-100 text-indigo-800 capitalize">
                                {fee.paymentMode || "Cash"}
                              </span>
                            </td>
                            <td className="px-4 py-3 font-bold text-green-700 text-right">{formatCurrency(Number(fee.amount) || 0)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-6 text-center text-gray-400 text-xs">No fee payments in this date range.</div>
              )}
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
        )}`;

content = content.replace(oldCustomContent, newCustomContent);

fs.writeFileSync("src/pages/Reports.jsx", content);
console.log("Big upgrade done!");

