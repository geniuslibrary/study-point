import React from "react";
import { formatCurrency, formatDate } from "../../utils/helpers";
import { Building2 } from "lucide-react";
import { getTenantItem } from "../../firebase/storageService";

export default function TransactionStatement({ 
    title, 
    dateRangeStr, 
    fees, 
    expenses, 
    totalRevenue, 
    totalExpense, 
    netProfit,
    libraryInfo: propLibraryInfo
}) {
    const getStoredSettings = () => {
        try {
            const raw = getTenantItem('settings');
            if (raw) return typeof raw === 'string' ? JSON.parse(raw) : raw;
        } catch (e) {}
        return {};
    };

    const stored = getStoredSettings();
    const libInfo = propLibraryInfo || stored || {};

    const libraryTitle = (libInfo.studyPointName || getTenantItem('library_name', 'Study Point Library') || 'Study Point Library').toUpperCase();
    const ownerName = libInfo.ownerName || 'Study Point Owner';
    const address = libInfo.address || '';
    const phone = libInfo.phone || '';
    const email = libInfo.email || '';
    const logoUrl = libInfo.logoUrl || '';
    const signatureUrl = libInfo.signatureUrl || '';

    // Combine fees and expenses into a single ledger timeline
    const transactions = [];
    
    fees.forEach(f => {
        if(f.status === "paid" || f.status === "partial") {
            let dStr = "";
            try {
                if (f.paidDate) {
                    if (typeof f.paidDate === "string") dStr = f.paidDate.split("T")[0];
                    else if (f.paidDate.toDate) dStr = f.paidDate.toDate().toISOString().split("T")[0];
                    else dStr = new Date(f.paidDate).toISOString().split("T")[0];
                } else if (f.month) {
                    dStr = f.month + "-01";
                }
            } catch (e) {
                dStr = f.month ? f.month + "-01" : "2026-01-01";
            }
            
            const collectedAmt = Number(f.amount !== undefined && f.amount !== null ? f.amount : f.paidAmount) || 0;
            if (collectedAmt <= 0) return;

            const modeText = f.paymentMode === 'split'
                ? `Split (Cash: ₹${f.splitDetails?.cash || 0} + UPI: ₹${f.splitDetails?.upi || 0})`
                : (f.paymentMode || "CASH").toUpperCase();

            const partialTag = f.isPartial ? ' [Partial/किस्त]' : '';
            const descriptionText = f.studentName 
                ? `Fee from ${f.studentName}${partialTag} (${modeText})` 
                : `Student Fee${partialTag} (${modeText})`;

            transactions.push({
                id: "f_" + f.id,
                date: dStr,
                type: "IN",
                category: f.isPartial ? "Fee Collection (Partial)" : "Fee Collection",
                description: descriptionText,
                amount: collectedAmt,
                mode: modeText,
                rawDate: new Date(dStr || 0)
            });
        }
    });
    
    expenses.forEach(e => {
        let dStr = "";
        try {
            if (e.date) {
                if (typeof e.date === "string") dStr = e.date.split("T")[0];
                else if (e.date.toDate) dStr = e.date.toDate().toISOString().split("T")[0];
                else dStr = new Date(e.date).toISOString().split("T")[0];
            }
        } catch (e) {
            dStr = "2026-01-01";
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
            {/* Header with Library Details and Logo */}
            <div className="flex justify-between items-start border-b-2 border-gray-200 pb-6 mb-6">
                <div className="flex items-center gap-4">
                    {logoUrl ? (
                        <img 
                            src={logoUrl} 
                            alt="Library Logo" 
                            crossOrigin="anonymous"
                            className="max-h-16 max-w-32 object-contain rounded-xl border border-gray-200 p-1 bg-white shrink-0"
                        />
                    ) : (
                        <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black shadow-sm shrink-0">
                            <Building2 className="w-7 h-7" />
                        </div>
                    )}
                    <div>
                        <h1 className="text-2xl font-black text-gray-900 tracking-tight uppercase">
                            {libraryTitle}
                        </h1>
                        <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest mt-0.5">
                            Official Financial Statement & Ledger
                        </p>
                        {address && <p className="text-xs text-gray-600 font-medium mt-0.5">{address}</p>}
                        {(phone || email) && (
                            <p className="text-[11px] text-gray-500 mt-0.5">
                                {phone ? `Phone: ${phone}` : ''} {phone && email ? '• ' : ''}{email ? `Email: ${email}` : ''}
                            </p>
                        )}
                    </div>
                </div>
                <div className="text-right">
                    <span className="inline-block px-3 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-black uppercase">
                        {title}
                    </span>
                    <p className="text-xs text-gray-800 font-bold mt-1.5">{dateRangeStr}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">Date: {formatDate(new Date().toISOString().split("T")[0])}</p>
                </div>
            </div>
            
            {/* Revenue, Expenses, Net Summary Cards */}
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
            
            {/* Transaction Details Table */}
            <table className="w-full text-left text-sm">
                <thead>
                    <tr className="bg-gray-50 text-gray-600 border-b border-gray-200">
                        <th className="p-3 font-bold">Date</th>
                        <th className="p-3 font-bold">Type</th>
                        <th className="p-3 font-bold">Category</th>
                        <th className="p-3 font-bold">Details</th>
                        <th className="p-3 font-bold text-right">Amount (₹)</th>
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
            
            {/* Footer with Library Info, System Timestamp & Authorized Signature */}
            <div className="mt-12 pt-6 border-t-2 border-gray-200 flex items-end justify-between text-xs">
                <div className="space-y-1 text-gray-500">
                    <p className="font-bold text-gray-800 uppercase tracking-wide">
                        {libraryTitle}
                    </p>
                    <p className="text-[11px] text-gray-500">
                        Generated by Study Point System on {formatDate(new Date().toISOString().split("T")[0])}
                    </p>
                    <p className="text-[10px] text-gray-400">Official computer-generated financial statement & ledger.</p>
                </div>

                <div className="text-center min-w-44">
                    {signatureUrl ? (
                        <div className="flex flex-col items-center">
                            <img 
                                src={signatureUrl} 
                                alt="Authorized Signature" 
                                crossOrigin="anonymous"
                                className="max-h-14 max-w-36 object-contain mb-1"
                            />
                            <div className="border-t border-gray-400 w-full pt-1">
                                <p className="text-[11px] font-black uppercase tracking-wider text-gray-800">
                                    Authorized Signatory
                                </p>
                                <p className="text-xs font-extrabold text-indigo-700">
                                    {ownerName}
                                </p>
                                <p className="text-[10px] font-bold text-gray-500 uppercase">
                                    {libraryTitle}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center">
                            <div className="h-12 flex items-end justify-center pb-1">
                                <span className="text-[11px] italic text-gray-400">Sign / Stamp</span>
                            </div>
                            <div className="border-t border-gray-400 w-full pt-1">
                                <p className="text-[11px] font-black uppercase tracking-wider text-gray-800">
                                    Authorized Signatory
                                </p>
                                <p className="text-xs font-extrabold text-indigo-700">
                                    {ownerName}
                                </p>
                                <p className="text-[10px] font-bold text-gray-500 uppercase">
                                    {libraryTitle}
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
