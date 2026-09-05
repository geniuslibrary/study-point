
const fs = require("fs");
let content = fs.readFileSync("src/pages/Reports.jsx", "utf-8");

// We want to turn:
//   if (loading) {
//       // ----------------------------------------------------
//     // CUSTOM / LIFETIME REPORT CALCULATIONS
// Into:
//   if (loading) {
//     return (
//       <Layout title="Reports">
//         <div className="flex items-center justify-center h-64">
//           <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
//         </div>
//       </Layout>
//     );
//   }
//
//   // ----------------------------------------------------
//   // CUSTOM / LIFETIME REPORT CALCULATIONS

content = content.replace(
    /  if \(loading\) {\s*\/\/ ----------------------------------------------------\s*\/\/ CUSTOM \/ LIFETIME REPORT CALCULATIONS/g,
    `  if (loading) {
    return (
      <Layout title="Reports">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      </Layout>
    );
  }

  // ----------------------------------------------------
  // CUSTOM / LIFETIME REPORT CALCULATIONS`
);

fs.writeFileSync("src/pages/Reports.jsx", content);
console.log("Loading block fixed!");

