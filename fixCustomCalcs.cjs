
const fs = require("fs");
let content = fs.readFileSync("src/pages/Reports.jsx", "utf-8");

// The custom calcs block is inside the loading block - it needs to be after the loading return
// Find: "  if (loading) {\n    // ----------------------------------------------------\n  // CUSTOM / LIFETIME REPORT CALCULATIONS"
// Replace with proper structure

content = content.replace(
    `    // ----------------------------------------------------
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
  
    return (`,
    `  // ----------------------------------------------------
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

  return (`
);

// Also fix the if(loading) block to have a proper return 
content = content.replace(
    `  if (loading) {
    // ----------------------------------------------------`,
    `  if (loading) {
    return (
      <Layout title="Reports">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      </Layout>
    );
  }

  // ----------------------------------------------------`
);

fs.writeFileSync("src/pages/Reports.jsx", content);
console.log("Custom calcs fixed!");

