import React from "react";
import { formatCurrency, formatDate } from "../../utils/helpers";
import { Building2 } from "lucide-react";

export default function TransactionStatement({ 
    title, 
    dateRangeStr, 
    fees, 
    expenses, 
    totalRevenue, 
    totalExpense, 
    netProfit 
}) {
    // Combine fees and expenses into a single ledger timeline
    const transactions = [];
    
    fees.forEach(f => {
        if(f.status === "paid") {
            // Find a valid date string
            let dStr = "";
            if (f.paidDate) {
                if (typeof f.paidDate === "string") dStr = f.paidDate.split("T")[0];
                else if (f.paidDate.toDate) dStr = f.paidDate.toDate().toISOString().split("T")[0];
                else dStr = new Date(f.paidDate).toISOString().split("T")[0];
            } else if (f.month) {
                dStr = f.month + "-01";
            }
            
            transactions.push({
                id: "f_" + f.id,
                date: dStr,
                type: "IN",
                category: "Fee Collection",
                description: f.studentName ? `Fee from ${f.studentName}` : "Student Fee Payment",
                amount: Number(f.amount) || 0,
                mode: f.paymentMode || "CASH",
                rawDate: new Date(dStr || 0)
            });
        }
    });
    
    expenses.forEach(e => {
        let dStr = "";
        if (e.date) {
            if (typeof e.date === "string") dStr = e.date.split("T")[0];
            else if (e.date.toDate) dStr = e.date.toDate().toISOString().split("T")[0];
            else dStr = new Date(e.date).toISOString().split("T")[0];
        }
        
        transactions.push({
            id: "e_" + e.id,
            date: dStr,
            type: "OUT",
            category: e.category,
            description: e.description || "-",
            amount: Number(e.amount) || 0,
            mode: "OUT",
            rawDate: new Date(dStr || 0)
        });
    });
    
    transactions.sort((a, b) => a.rawDate - b.rawDate);
    
    return (
        <div className="bg-white p-8 rounded-2xl border border-gray-200 print:border-none print:shadow-none print:m-0 print:p-0">
            <div className="flex justify-between items-start border-b border-gray-200 pb-6 mb-6">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                        <Building2 className="text-indigo-600" /> STUDY POINT LIBRARY
                    </h1>
                    <p className="text-sm text-gray-500 font-bold mt-1">Official Financial Statement</p>
                </div>
                <div className="text-right">
                    <h2 className="text-lg font-bold text-gray-800">{title}</h2>
                    <p className="text-xs text-gray-500 font-semibold">{dateRangeStr}</p>
                </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                    <p className="text-xs font-bold text-emerald-800 uppercase">Total Revenue (IN)</p>
                    <p className="text-xl font-black text-emerald-600 mt-1">{formatCurrency(totalRevenue)}</p>
                </div>
                <div className="bg-rose-50 p-4 rounded-xl border border-rose-100">
                    <p className="text-xs font-bold text-rose-800 uppercase">Total Expenses (OUT)</p>
                    <p className="text-xl font-black text-rose-600 mt-1">{formatCurrency(totalExpense)}</p>
                </div>
                <div className={netProfit >= 0 ? "bg-indigo-50 p-4 rounded-xl border border-indigo-100" : "bg-orange-50 p-4 rounded-xl border border-orange-100"}>
                    <p className={"text-xs font-bold uppercase " + (netProfit >= 0 ? "text-indigo-800" : "text-orange-800")}>Net Profit / Loss</p>
                    <p className={"text-xl font-black mt-1 " + (netProfit >= 0 ? "text-indigo-600" : "text-orange-600")}>
                        {formatCurrency(netProfit)}
                    </p>
                </div>
            </div>
            
            <table className="w-full text-left text-sm">
                <thead>
                    <tr className="bg-gray-50 text-gray-600 border-b border-gray-200">
                        <th className="p-3 font-bold">Date</th>
                        <th className="p-3 font-bold">Type</th>
                        <th className="p-3 font-bold">Category</th>
                        <th className="p-3 font-bold">Details</th>
                        <th className="p-3 font-bold text-right">Amount (?)</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {transactions.length === 0 ? (
                        <tr><td colSpan="5" className="p-4 text-center text-gray-400">No transactions in this period.</td></tr>
                    ) : (
                        transactions.map(t => (
                            <tr key={t.id}>
                                <td className="p-3 whitespace-nowrap">{formatDate(t.date)}</td>
                                <td className="p-3">
                                    <span className={"text-[10px] px-2 py-0.5 rounded-full font-bold " + (t.type === "IN" ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800")}>
                                        {t.type}
                                    </span>
                                </td>
                                <td className="p-3 font-semibold text-gray-800">{t.category}</td>
                                <td className="p-3 text-xs text-gray-600">{t.description}</td>
                                <td className={"p-3 font-bold text-right " + (t.type === "IN" ? "text-emerald-600" : "text-rose-600")}>
                                    {t.type === "IN" ? "+" : "-"}{formatCurrency(t.amount)}
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
            
            <div className="mt-12 pt-4 border-t border-gray-200 flex justify-between text-xs text-gray-400 font-medium">
                <p>Generated by Study Point System on {formatDate(new Date().toISOString().split("T")[0])}</p>
                <p>Authorized Signature: ____________________</p>
            </div>
        </div>
    );
}
