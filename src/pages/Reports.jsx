import { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import StatusBadge from '../components/common/StatusBadge';
import {
  Calendar,
  CalendarDays,
  IndianRupee,
  TrendingUp,
  TrendingDown,
  Users,
  Printer,
  Loader2,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Building2,
  Sun,
  Sunrise,
  Sunset,
  Clock,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { COLLECTIONS } from '../utils/constants';
import { formatCurrency, formatDate, getMonthName } from '../utils/helpers';
import { fetchCollectionData } from '../firebase/storageService';
import { createPortal } from 'react-dom';
import TransactionStatement from '../components/reports/TransactionStatement';

export default function Reports() {
  const [activeTab, setActiveTab] = useState('daily'); // 'daily' | 'monthly'
  const [loading, setLoading] = useState(true);

  // Raw data from storage
  const [fees, setFees] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [students, setStudents] = useState([]);
  const [sections, setSections] = useState([]);
  const [seats, setSeats] = useState([]);

  // Date selection states
  const todayStr = new Date().toISOString().split('T')[0];
  const currentMonthStr = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;

  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [selectedMonth, setSelectedMonth] = useState(currentMonthStr);
  
  const [customStartDate, setCustomStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  
  const [customEndDate, setCustomEndDate] = useState(todayStr);
  const [showStatementMode, setShowStatementMode] = useState(null);

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


  const fetchData = async () => {
    setLoading(true);
    try {
      const [feeDocs, expDocs, stuDocs, secDocs, seatDocs] = await Promise.all([
        fetchCollectionData(COLLECTIONS.FEES),
        fetchCollectionData(COLLECTIONS.EXPENSES),
        fetchCollectionData(COLLECTIONS.STUDENTS),
        fetchCollectionData(COLLECTIONS.SECTIONS),
        fetchCollectionData(COLLECTIONS.SEATS),
      ]);
      setFees(feeDocs);
      setExpenses(expDocs);
      setStudents(stuDocs);
      setSections(secDocs);
      setSeats(seatDocs);
    } catch (err) {
      console.error('Error fetching report data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  
  const handlePrintStatement = (mode) => {
    setShowStatementMode(mode);
    setTimeout(() => {
      document.body.classList.add('is-printing-receipt');
      window.print();
      document.body.classList.remove('is-printing-receipt');
      setShowStatementMode(null);
    }, 100);
  };

  const handlePrint = () => {
    window.print();
  };

  // Helper date matchers
  const matchesDate = (dateVal, targetDateStr) => {
    if (!dateVal) return false;
    let dStr = '';
    if (typeof dateVal === 'string') {
      dStr = dateVal.split('T')[0];
    } else if (dateVal.seconds) {
      dStr = new Date(dateVal.seconds * 1000).toISOString().split('T')[0];
    } else if (dateVal.toDate) {
      dStr = dateVal.toDate().toISOString().split('T')[0];
    } else {
      dStr = new Date(dateVal).toISOString().split('T')[0];
    }
    return dStr === targetDateStr;
  };

  
  const matchesDateRange = (dateVal, startStr, endStr) => {
    if (!dateVal) return false;
    let dStr = "";
    try {
      if (typeof dateVal === "string") dStr = dateVal.split("T")[0];
      else if (dateVal.seconds) dStr = new Date(dateVal.seconds * 1000).toISOString().split("T")[0];
      else if (dateVal.toDate) dStr = dateVal.toDate().toISOString().split("T")[0];
      else dStr = new Date(dateVal).toISOString().split("T")[0];
    } catch (e) {
      dStr = "";
    }
    return dStr ? (dStr >= startStr && dStr <= endStr) : false;
  };

  const matchesMonth = (dateVal, targetMonthStr) => {
    if (!dateVal) return false;
    let mStr = '';
    if (typeof dateVal === 'string') {
      mStr = dateVal.substring(0, 7);
    } else if (dateVal.seconds) {
      mStr = new Date(dateVal.seconds * 1000).toISOString().substring(0, 7);
    } else if (dateVal.toDate) {
      mStr = dateVal.toDate().toISOString().substring(0, 7);
    } else {
      mStr = new Date(dateVal).toISOString().substring(0, 7);
    }
    return mStr === targetMonthStr;
  };

  

  

  // ----------------------------------------------------
  // DAILY REPORT CALCULATIONS
  // ----------------------------------------------------
  const dailyFees = fees.filter((f) => f.status === 'paid' && matchesDate(f.paidDate, selectedDate));
  const dailyExpenses = expenses.filter((e) => matchesDate(e.date, selectedDate));
  const dailyAdmissions = students.filter((s) => matchesDate(s.joinDate || s.createdAt, selectedDate));

  const dailyTotalCollection = dailyFees.reduce((sum, f) => sum + (Number(f.amount) || 0), 0);
  const dailyCashCollection = dailyFees
    .filter((f) => !f.paymentMode || f.paymentMode === 'cash')
    .reduce((sum, f) => sum + (Number(f.amount) || 0), 0);
  const dailyUpiCollection = dailyFees
    .filter((f) => f.paymentMode === 'upi')
    .reduce((sum, f) => sum + (Number(f.amount) || 0), 0);
  const dailyBankCollection = dailyFees
    .filter((f) => f.paymentMode === 'bank')
    .reduce((sum, f) => sum + (Number(f.amount) || 0), 0);

  const dailyTotalExpense = dailyExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const dailyNetCashFlow = dailyTotalCollection - dailyTotalExpense;

  // ----------------------------------------------------
  // MONTHLY REPORT CALCULATIONS
  // ----------------------------------------------------
  const monthlyPaidFees = fees.filter(
    (f) => (f.month === selectedMonth || matchesMonth(f.paidDate, selectedMonth)) && f.status === 'paid'
  );
  const monthlyPendingFees = fees.filter(
    (f) => f.month === selectedMonth && f.status !== 'paid'
  );
  const monthlyExpenses = expenses.filter((e) => matchesMonth(e.date, selectedMonth));

  const monthlyTotalRevenue = monthlyPaidFees.reduce((sum, f) => sum + (Number(f.amount) || 0), 0);
  const monthlyTotalPending = monthlyPendingFees.reduce((sum, f) => sum + (Number(f.amount) || 0), 0);
  const monthlyTotalExpense = monthlyExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const monthlyNetProfit = monthlyTotalRevenue - monthlyTotalExpense;


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
  // Shift-wise revenue breakdown in selected month
  const getShiftRevenue = (shiftId) => {
    return monthlyPaidFees
      .filter((f) => {
        const student = students.find((s) => s.id === f.studentId);
        if (shiftId === 'full_day') return !student?.shift || student?.shift === 'full_day';
        return student?.shift === shiftId;
      })
      .reduce((sum, f) => sum + (Number(f.amount) || 0), 0);
  };

  const fullDayRev = getShiftRevenue('full_day');
  const firstHalfRev = getShiftRevenue('first_half');
  const secondHalfRev = getShiftRevenue('second_half');
  const customShiftRev = getShiftRevenue('custom');

  // Category-wise monthly expenses
  const categoryExpenseMap = {};
  monthlyExpenses.forEach((exp) => {
    const cat = exp.category || 'Other';
    categoryExpenseMap[cat] = (categoryExpenseMap[cat] || 0) + (Number(exp.amount) || 0);
  });

  const getStudentInfo = (studentId) => {
    return students.find((s) => s.id === studentId) || { name: 'Unknown Student', phone: '—' };
  };

  const getSectionName = (sectionId) => {
    return sections.find((s) => s.id === sectionId)?.name || '—';
  };

  const getSeatNumber = (seatId) => {
    const seat = seats.find((s) => s.id === seatId);
    return seat ? `#${seat.seatNumber}` : '—';
  };

  if (loading) {
    return (
      <Layout title="Reports">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      </Layout>
    );
  }

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

  const customCashCollection = customFees
    .filter((f) => !f.paymentMode || f.paymentMode === 'cash')
    .reduce((sum, f) => sum + (Number(f.amount) || 0), 0);
  const customUpiCollection = customFees
    .filter((f) => f.paymentMode === 'upi')
    .reduce((sum, f) => sum + (Number(f.amount) || 0), 0);
  const customBankCollection = customFees
    .filter((f) => f.paymentMode === 'bank')
    .reduce((sum, f) => sum + (Number(f.amount) || 0), 0);
  const customCategoryExpenseMap = {};
  customExpenses.forEach((exp) => {
    const cat = exp.category || 'Other';
    customCategoryExpenseMap[cat] = (customCategoryExpenseMap[cat] || 0) + (Number(exp.amount) || 0);
  });

  return (
    <Layout title="Reports">
      <div className="space-y-6">
        {/* Top Header & Tab Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Study Point Reports</h1>
            <p className="text-gray-500 text-sm mt-0.5">
              Daily collections & expenses audit, monthly financials & profit/loss summary
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Tab Selector */}
            <div className="bg-gray-100 p-1 rounded-xl flex items-center shadow-inner">
              <button
                onClick={() => setActiveTab('daily')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'daily'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Daily Report (दैनिक)</span>
              </button>
              <button
                onClick={() => setActiveTab('monthly')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'monthly'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <CalendarDays className="w-3.5 h-3.5" />
                <span>Monthly Report (मासिक)</span>
              </button>
            
              <button
                onClick={() => setActiveTab("custom")}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "custom"
                    ? "bg-white text-indigo-700 shadow-xs"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Custom / Lifetime</span>
              </button>
            </div>

            <Button
              variant="secondary"
              icon={<Printer className="w-4 h-4" />}
              onClick={handlePrint}
              title="Print formatted report"
            >
              Print Report
            </Button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 1. DAILY REPORT VIEW                                                      */}
        {/* ========================================================================= */}
        {activeTab === 'daily' && (
          <div className="space-y-6" id="daily-report-section">
            {/* Date Filter Bar */}
            <div className="bg-white p-4 rounded-2xl shadow-xs border border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-600" />
                <span className="font-bold text-gray-900 text-sm">Select Date for Daily Audit:</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-3.5 py-1.5 border border-gray-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 bg-white"
                />
                <button
                  onClick={() => setSelectedDate(todayStr)}
                  className="px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Today
                </button>
              </div>
            </div>

            {/* Daily Stat Cards (4 Cards) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1: Total Collections */}
              <div className="bg-white rounded-2xl p-5 shadow-xs border border-gray-100 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Total Collections
                  </span>
                  <div className="w-9 h-9 bg-green-50 text-green-600 rounded-xl flex items-center justify-center">
                    <ArrowUpRight className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-3">
                  <p className="text-2xl font-extrabold text-gray-900">{formatCurrency(dailyTotalCollection)}</p>
                  <p className="text-xs text-green-600 font-medium mt-0.5">
                    {dailyFees.length} Fee Payments Received
                  </p>
                </div>
              </div>

              {/* Card 2: Daily Expenses */}
              <div className="bg-white rounded-2xl p-5 shadow-xs border border-gray-100 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Daily Expenses
                  </span>
                  <div className="w-9 h-9 bg-red-50 text-red-600 rounded-xl flex items-center justify-center">
                    <ArrowDownRight className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-3">
                  <p className="text-2xl font-extrabold text-gray-900">{formatCurrency(dailyTotalExpense)}</p>
                  <p className="text-xs text-red-600 font-medium mt-0.5">
                    {dailyExpenses.length} Expense Transactions
                  </p>
                </div>
              </div>

              {/* Card 3: Net In-Hand / Cash Flow */}
              <div
                className={`rounded-2xl p-5 shadow-xs border flex flex-col justify-between ${
                  dailyNetCashFlow >= 0
                    ? 'bg-gradient-to-br from-green-50/70 to-emerald-50/40 border-green-200'
                    : 'bg-gradient-to-br from-red-50/70 to-rose-50/40 border-red-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Net Cash Flow (Today)
                  </span>
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                      dailyNetCashFlow >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}
                  >
                    <Wallet className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-3">
                  <p
                    className={`text-2xl font-extrabold ${
                      dailyNetCashFlow >= 0 ? 'text-green-700' : 'text-red-700'
                    }`}
                  >
                    {formatCurrency(dailyNetCashFlow)}
                  </p>
                  <p className="text-xs text-gray-600 mt-0.5">Collection − Expense</p>
                </div>
              </div>

              {/* Card 4: New Admissions */}
              <div className="bg-white rounded-2xl p-5 shadow-xs border border-gray-100 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    New Admissions
                  </span>
                  <div className="w-9 h-9 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                    <Users className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-3">
                  <p className="text-2xl font-extrabold text-gray-900">{dailyAdmissions.length}</p>
                  <p className="text-xs text-indigo-600 font-medium mt-0.5">Students Enrolled Today</p>
                </div>
              </div>
            </div>

            {/* Payment Modes Breakdown Pills */}
            <div className="bg-white p-4 rounded-2xl shadow-xs border border-gray-200">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                Daily Collections By Payment Mode
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">💵</span>
                    <span className="text-sm font-semibold text-gray-700">Cash</span>
                  </div>
                  <span className="text-base font-extrabold text-gray-900">{formatCurrency(dailyCashCollection)}</span>
                </div>

                <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">📱</span>
                    <span className="text-sm font-semibold text-indigo-900">UPI / QR Code</span>
                  </div>
                  <span className="text-base font-extrabold text-indigo-700">{formatCurrency(dailyUpiCollection)}</span>
                </div>

                <div className="p-3 bg-purple-50/60 rounded-xl border border-purple-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🏦</span>
                    <span className="text-sm font-semibold text-purple-900">Bank Transfer</span>
                  </div>
                  <span className="text-base font-extrabold text-purple-700">{formatCurrency(dailyBankCollection)}</span>
                </div>
              </div>
            </div>

            {/* Daily Collections Table */}
            <div className="bg-white rounded-2xl shadow-xs border border-gray-200 overflow-hidden">
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <IndianRupee className="w-5 h-5 text-indigo-600" />
                  <h3 className="font-bold text-gray-900">Fee Payments Collected ({formatDate(selectedDate)})</h3>
                </div>
                <span className="text-xs font-semibold bg-green-50 text-green-700 px-2.5 py-1 rounded-full border border-green-200">
                  Total: {formatCurrency(dailyTotalCollection)}
                </span>
              </div>

              {dailyFees.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      <tr>
                        <th className="px-4 py-3">Student Name</th>
                        <th className="px-4 py-3">Shift / Timing</th>
                        <th className="px-4 py-3">Month</th>
                        <th className="px-4 py-3">Mode</th>
                        <th className="px-4 py-3">Amount</th>
                        <th className="px-4 py-3">Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {dailyFees.map((fee) => {
                        const student = getStudentInfo(fee.studentId);
                        return (
                          <tr key={fee.id} className="hover:bg-gray-50/80">
                            <td className="px-4 py-3 font-semibold text-gray-900">{student.name}</td>
                            <td className="px-4 py-3 text-xs text-gray-600">{student.shiftTiming || 'Full Day'}</td>
                            <td className="px-4 py-3 text-xs text-gray-500">{fee.month}</td>
                            <td className="px-4 py-3">
                              <span className="uppercase text-xs font-bold px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                                {fee.paymentMode || 'CASH'}
                              </span>
                            </td>
                            <td className="px-4 py-3 font-bold text-green-700">{formatCurrency(fee.amount)}</td>
                            <td className="px-4 py-3 text-xs text-gray-400">{fee.notes || '—'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-8 text-center text-gray-400 text-xs">
                  No fee collections recorded on {formatDate(selectedDate)}
                </div>
              )}
            </div>

            {/* Daily Expenses Table */}
            <div className="bg-white rounded-2xl shadow-xs border border-gray-200 overflow-hidden">
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingDown className="w-5 h-5 text-red-600" />
                  <h3 className="font-bold text-gray-900">Expenses Incurred ({formatDate(selectedDate)})</h3>
                </div>
                <span className="text-xs font-semibold bg-red-50 text-red-700 px-2.5 py-1 rounded-full border border-red-200">
                  Total: {formatCurrency(dailyTotalExpense)}
                </span>
              </div>

              {dailyExpenses.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      <tr>
                        <th className="px-4 py-3">Category</th>
                        <th className="px-4 py-3">Description</th>
                        <th className="px-4 py-3 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {dailyExpenses.map((exp) => (
                        <tr key={exp.id} className="hover:bg-gray-50/80">
                          <td className="px-4 py-3 font-semibold text-gray-800">{exp.category}</td>
                          <td className="px-4 py-3 text-xs text-gray-600">{exp.description || '—'}</td>
                          <td className="px-4 py-3 font-bold text-red-600 text-right">{formatCurrency(exp.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-6 text-center text-gray-400 text-xs">
                  No expenses recorded on {formatDate(selectedDate)}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 2. MONTHLY REPORT VIEW                                                    */}
        {/* ========================================================================= */}
        {activeTab === 'monthly' && (
          <div className="space-y-6" id="monthly-report-section">
            {/* Month Filter Bar */}
            <div className="bg-white p-4 rounded-2xl shadow-xs border border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-indigo-600" />
                <span className="font-bold text-gray-900 text-sm">Select Month for Financial Audit:</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="px-3.5 py-1.5 border border-gray-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 bg-white"
                />
                <button
                  onClick={() => setSelectedMonth(currentMonthStr)}
                  className="px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Current Month
                </button>
              </div>
            </div>

            {/* Monthly Key Metrics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Metric 1: Total Revenue */}
              <div className="bg-white rounded-2xl p-5 shadow-xs border border-gray-100 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Total Revenue
                  </span>
                  <div className="w-9 h-9 bg-green-50 text-green-600 rounded-xl flex items-center justify-center">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-3">
                  <p className="text-2xl font-extrabold text-gray-900">{formatCurrency(monthlyTotalRevenue)}</p>
                  <p className="text-xs text-green-600 font-medium mt-0.5">
                    {monthlyPaidFees.length} Paid Student Fees
                  </p>
                </div>
              </div>

              {/* Metric 2: Total Expenses */}
              <div className="bg-white rounded-2xl p-5 shadow-xs border border-gray-100 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Total Expenses
                  </span>
                  <div className="w-9 h-9 bg-red-50 text-red-600 rounded-xl flex items-center justify-center">
                    <TrendingDown className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-3">
                  <p className="text-2xl font-extrabold text-gray-900">{formatCurrency(monthlyTotalExpense)}</p>
                  <p className="text-xs text-red-600 font-medium mt-0.5">
                    {monthlyExpenses.length} Expense Bills Paid
                  </p>
                </div>
              </div>

              {/* Metric 3: Net Profit / Loss */}
              <div
                className={`rounded-2xl p-5 shadow-xs border flex flex-col justify-between ${
                  monthlyNetProfit >= 0
                    ? 'bg-gradient-to-br from-green-50/80 to-emerald-50/50 border-green-200'
                    : 'bg-gradient-to-br from-red-50/80 to-rose-50/50 border-red-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Net Profit / Loss
                  </span>
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                      monthlyNetProfit >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}
                  >
                    <IndianRupee className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-3">
                  <p
                    className={`text-2xl font-extrabold ${
                      monthlyNetProfit >= 0 ? 'text-green-700' : 'text-red-700'
                    }`}
                  >
                    {formatCurrency(monthlyNetProfit)}
                  </p>
                  <p className="text-xs text-gray-600 font-medium mt-0.5">
                    {monthlyNetProfit >= 0 ? '✅ Profitable Month' : '⚠️ Net Deficit'}
                  </p>
                </div>
              </div>

              {/* Metric 4: Pending Dues */}
              <div className="bg-white rounded-2xl p-5 shadow-xs border border-gray-100 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Pending Dues
                  </span>
                  <div className="w-9 h-9 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-3">
                  <p className="text-2xl font-extrabold text-amber-700">{formatCurrency(monthlyTotalPending)}</p>
                  <p className="text-xs text-amber-600 font-medium mt-0.5">
                    {monthlyPendingFees.length} Students Pending
                  </p>
                </div>
              </div>
            </div>


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

            {/* Shift-Wise Revenue Breakdown */}
            <div className="bg-white p-5 rounded-2xl shadow-xs border border-gray-200">
              <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Sun className="w-4 h-4 text-indigo-600" />
                <span>Shift-Wise Revenue Breakdown ({getMonthName(selectedMonth)})</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Full Day Shift */}
                <div className="p-4 rounded-xl bg-indigo-50/60 border border-indigo-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-bold text-indigo-900 text-sm">
                      <Sun className="w-4 h-4 text-indigo-600" />
                      <span>Full Day (6 AM - 11 PM)</span>
                    </div>
                    <span className="text-xs bg-indigo-200/60 text-indigo-800 font-semibold px-2 py-0.5 rounded">
                      Full Time
                    </span>
                  </div>
                  <p className="text-2xl font-extrabold text-indigo-700 mt-2">{formatCurrency(fullDayRev)}</p>
                </div>

                {/* 1st Half Shift */}
                <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-bold text-amber-900 text-sm">
                      <Sunrise className="w-4 h-4 text-amber-600" />
                      <span>1st Half / Morning</span>
                    </div>
                    <span className="text-xs bg-amber-200/60 text-amber-800 font-semibold px-2 py-0.5 rounded">
                      6 AM - 2 PM
                    </span>
                  </div>
                  <p className="text-2xl font-extrabold text-amber-700 mt-2">{formatCurrency(firstHalfRev)}</p>
                </div>

                {/* 2nd Half Shift */}
                <div className="p-4 rounded-xl bg-purple-50/60 border border-purple-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-bold text-purple-900 text-sm">
                      <Sunset className="w-4 h-4 text-purple-600" />
                      <span>2nd Half / Evening</span>
                    </div>
                    <span className="text-xs bg-purple-200/60 text-purple-800 font-semibold px-2 py-0.5 rounded">
                      2 PM - 11 PM
                    </span>
                  </div>
                  <p className="text-2xl font-extrabold text-purple-700 mt-2">{formatCurrency(secondHalfRev)}</p>
                </div>
              </div>
            </div>

            {/* Section-Wise Performance & Collections Table */}
            <div className="bg-white rounded-2xl shadow-xs border border-gray-200 overflow-hidden">
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-indigo-600" />
                  <h3 className="font-bold text-gray-900">Section-Wise Performance</h3>
                </div>
                <span className="text-xs font-semibold text-gray-500">{sections.length} Active Sections</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-3">Section Name</th>
                      <th className="px-4 py-3">Total Seats</th>
                      <th className="px-4 py-3">Active Students</th>
                      <th className="px-4 py-3">Occupancy</th>
                      <th className="px-4 py-3 text-right">Revenue Collected</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {sections.map((sec) => {
                      const secSeats = seats.filter((s) => s.sectionId === sec.id);
                      const secStudents = students.filter(
                        (s) => s.sectionId === sec.id && s.status === 'active'
                      );
                      const secRevenue = monthlyPaidFees
                        .filter((f) => {
                          const stu = students.find((s) => s.id === f.studentId);
                          return stu?.sectionId === sec.id;
                        })
                        .reduce((sum, f) => sum + (Number(f.amount) || 0), 0);

                      const occRate =
                        secSeats.length > 0
                          ? Math.min(100, Math.round((secStudents.length / secSeats.length) * 100))
                          : 0;

                      return (
                        <tr key={sec.id} className="hover:bg-gray-50/80">
                          <td className="px-4 py-3 font-semibold text-gray-900">{sec.name}</td>
                          <td className="px-4 py-3 text-gray-600">{secSeats.length} Seats</td>
                          <td className="px-4 py-3 font-medium text-indigo-600">{secStudents.length} Students</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-24 bg-gray-200 rounded-full h-2">
                                <div
                                  className="h-2 rounded-full bg-indigo-600"
                                  style={{ width: `${occRate}%` }}
                                />
                              </div>
                              <span className="text-xs font-semibold text-gray-700">{occRate}%</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 font-bold text-gray-900 text-right">
                            {formatCurrency(secRevenue)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Monthly Expenses Breakdown Table */}
            <div className="bg-white rounded-2xl shadow-xs border border-gray-200 overflow-hidden">
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingDown className="w-5 h-5 text-red-600" />
                  <h3 className="font-bold text-gray-900">Category-Wise Expenses Breakdown</h3>
                </div>
                <span className="text-xs font-bold text-red-600">Total: {formatCurrency(monthlyTotalExpense)}</span>
              </div>

              {Object.keys(categoryExpenseMap).length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      <tr>
                        <th className="px-4 py-3">Expense Category</th>
                        <th className="px-4 py-3">Share (%)</th>
                        <th className="px-4 py-3 text-right">Amount (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {Object.entries(categoryExpenseMap).map(([category, amount]) => {
                        const pct =
                          monthlyTotalExpense > 0
                            ? Math.round((amount / monthlyTotalExpense) * 100)
                            : 0;
                        return (
                          <tr key={category} className="hover:bg-gray-50/80">
                            <td className="px-4 py-3 font-semibold text-gray-800">{category}</td>
                            <td className="px-4 py-3 text-xs text-gray-500 font-medium">{pct}% of total</td>
                            <td className="px-4 py-3 font-bold text-gray-900 text-right">
                              {formatCurrency(amount)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-6 text-center text-gray-400 text-xs">
                  No expenses recorded for {getMonthName(selectedMonth)}
                </div>
              )}
            </div>
          </div>
        )}

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
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${customNetProfit >= 0 ? "bg-indigo-100 text-indigo-700" : "bg-orange-100 text-orange-700"}`}>
                    <IndianRupee className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-3 relative z-10">
                  <p className={`text-2xl font-extrabold ${customNetProfit >= 0 ? "text-indigo-700" : "text-orange-600"}`}>
                    {formatCurrency(customNetProfit)}
                  </p>
                  <p className="text-xs text-gray-500 font-medium mt-0.5">
                    Overall financial balance
                  </p>
                </div>
              </div>
            </div>


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
        )}

        {/* Portal for Statement PDF Printing */}
        {showStatementMode && portalTarget && createPortal(
            <TransactionStatement 
                title={showStatementMode === "daily" ? "Daily Ledger" : showStatementMode === "monthly" ? "Monthly Ledger" : "Custom Ledger"}
                dateRangeStr={
                    showStatementMode === "daily" ? formatDate(selectedDate) :
                    showStatementMode === "monthly" ? selectedMonth : 
                    `${formatDate(customStartDate)} to ${formatDate(customEndDate)}`
                }
                fees={showStatementMode === "daily" ? dailyFees : showStatementMode === "monthly" ? monthlyPaidFees : customFees}
                expenses={showStatementMode === "daily" ? dailyExpenses : showStatementMode === "monthly" ? monthlyExpenses : customExpenses}
                totalRevenue={showStatementMode === "daily" ? dailyTotalCollection : showStatementMode === "monthly" ? monthlyTotalRevenue : customTotalRevenue}
                totalExpense={showStatementMode === "daily" ? dailyTotalExpense : showStatementMode === "monthly" ? monthlyTotalExpense : customTotalExpense}
                netProfit={showStatementMode === "daily" ? dailyNetCashFlow : showStatementMode === "monthly" ? monthlyNetProfit : customNetProfit}
            />,
            portalTarget
        )}


        {/* Helper Action Buttons for Daily and Monthly */}
        {activeTab !== "custom" && (
            <div className="flex justify-end mt-8 border-t border-gray-200 pt-6">
                <Button variant="primary" icon={<FileSpreadsheet size={16}/>} onClick={() => handlePrintStatement(activeTab)}>
                    Download {activeTab === "daily" ? "Daily" : "Monthly"} Official PDF Statement
                </Button>
            </div>
        )}
      </div>
    </Layout>
  );
}
