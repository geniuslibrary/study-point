const fs = require("fs");
let content = fs.readFileSync("src/pages/Reports.jsx", "utf-8");

// 1. FIX HEADER wrapper - flex col always
content = content.replace(
  `<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">`,
  `<div className="flex flex-col gap-3">`
);

// 2. FIX TAB CONTROLS - horizontal scrollable wrapper
content = content.replace(
  `<div className="flex flex-wrap items-center gap-3">
            {/* Tab Selector */}
            <div className="bg-gray-100 p-1 rounded-xl flex items-center shadow-inner">`,
  `<div className="flex flex-col sm:flex-row sm:items-center gap-2">
            {/* Tab Selector - scrollable on mobile */}
            <div className="flex-1 overflow-x-auto -mx-1 px-1">
            <div className="bg-gray-100 p-1 rounded-xl flex items-center shadow-inner min-w-max gap-0.5">`
);

// Close extra div we added above
content = content.replace(
  `            </div>\n\n            <Button\n              variant="secondary"`,
  `            </div>\n            </div>\n\n            <Button\n              variant="secondary"`
);

// 3. Shorten tab button text on mobile
content = content.replace(`<span>Daily Report (दैनिक)</span>`, `<span>Daily</span>`);
content = content.replace(`<span>Monthly Report (मासिक)</span>`, `<span>Monthly</span>`);

// 4. FIX DAILY DATE FILTER inputs - full width on mobile
content = content.replace(
  `<div className="flex items-center gap-2">
                <input
                  type="date"
                  value={selectedDate}`,
  `<div className="flex items-center gap-2 w-full sm:w-auto">
                <input
                  type="date"
                  value={selectedDate}`
);

// 5. FIX MONTHLY DATE FILTER
content = content.replace(
  `<div className="flex items-center gap-2">
                <input
                  type="month"
                  value={selectedMonth}`,
  `<div className="flex items-center gap-2 w-full sm:w-auto">
                <input
                  type="month"
                  value={selectedMonth}`
);

// 6. FIX CUSTOM DATE RANGE - stack on mobile
content = content.replace(
  `<div className="flex items-center gap-2">
                <input
                  type="date"
                  value={customStartDate}`,
  `<div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <input
                  type="date"
                  value={customStartDate}`
);

// 7. FIX BOTTOM PDF BUTTON - center on mobile
content = content.replace(
  `<div className="flex justify-end mt-8 border-t border-gray-200 pt-6">`,
  `<div className="flex justify-center sm:justify-end mt-8 border-t border-gray-200 pt-6">`
);

// 8. Download button full width on mobile in custom tab
content = content.replace(
  `className="flex items-center justify-center gap-2 px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-md transition-all active:scale-95 w-full sm:w-auto"`,
  `className="flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-md transition-all active:scale-95 w-full"`
);

// 9. FIX Monthly stat cards - 2 col on mobile tablet
content = content.replace(
  `<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Metric 1: Total Revenue */}`,
  `<div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Metric 1: Total Revenue */}`
);

// 10. FIX Custom stat cards - 1 col mobile, 3 col desktop
content = content.replace(
  `<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Card 1: Revenue */}`,
  `<div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Card 1: Revenue */>`
);

fs.writeFileSync("src/pages/Reports.jsx", content);
console.log("Responsive UI applied!");
