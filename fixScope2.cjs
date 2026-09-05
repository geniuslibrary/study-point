
const fs = require("fs");
let content = fs.readFileSync("src/pages/Reports.jsx", "utf-8");

// Find the if(loading) block and the custom calculations that follow inside it
// The problem: if(loading) { ... } but then the calculations are at wrong indentation INSIDE the loading block

// Step 1: remove the if(loading) and the calculations block embedded inside it
// They appear right before the return statement as: `  if (loading) {    // ----   // CUSTOM...`
// Then: declarations... then: return (

// Find if(loading) block which contains the calculations
const wrongBlock = /  if \(loading\) \{\s*\/\/ [-]{4,}\s*\/\/ CUSTOM \/ LIFETIME REPORT CALCULATIONS\s*\/\/ [-]{4,}\s*([\s\S]*?)  return \(\n    <Layout/;
const match = content.match(wrongBlock);

if (match) {
    const innerCalcs = match[1]; // Extract just the calc lines
    
    // Clean up the inner calcs indentation
    const cleanCalcs = `  // ----------------------------------------------------
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

  `;
    
    content = content.replace(wrongBlock, 
        `  if (loading) {
    return (
      <Layout title="Reports">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      </Layout>
    );
  }

` + cleanCalcs + `return (
    <Layout`
    );
    
    fs.writeFileSync("src/pages/Reports.jsx", content);
    console.log("Scope fixed perfectly!");
} else {
    console.log("Pattern not found. Manual inspection needed.");
    // Print the area around if(loading)
    const lines = content.split("\\n");
    const idx = lines.findIndex(l => l.includes("if (loading)"));
    console.log("Lines around if(loading):", lines.slice(idx - 2, idx + 10).join("\\n"));
}

