import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Clock,
  Calendar,
  AlertTriangle,
  MessageSquare,
  ChevronRight,
  Wallet,
  IndianRupee,
  TrendingUp,
  PieChart,
  Tag,
  CheckCircle2,
  Lock,
  Search,
  Users,
  UserCheck,
  UserPlus,
  UserMinus,
  Sparkles,
  Building2,
  Armchair,
  FileText,
  Calculator,
  BellRing,
  HelpCircle,
  Phone,
  ShieldCheck,
  Edit2,
  Check,
  Zap,
} from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/helpers';
import { getActiveTemplates, renderTemplate } from '../../utils/templateHelpers';
import { getTenantItem } from '../../firebase/storageService';

// 1. Expiring Memberships in Next 7 Days
export function ExpiringMembershipsWidget({ students = [], seats = [] }) {
  const navigate = useNavigate();
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const expiringList = students
    .filter((s) => s.status === 'active' && s.membershipEnd)
    .map((s) => {
      const end = new Date(s.membershipEnd);
      end.setHours(0, 0, 0, 0);
      const diffTime = end - now;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const seat = seats.find((st) => st.id === s.seatId);
      return {
        ...s,
        diffDays,
        seatNumber: seat?.seatNumber || '—',
      };
    })
    .filter((s) => s.diffDays >= 0 && s.diffDays <= 7)
    .sort((a, b) => a.diffDays - b.diffDays);

  const handleSendReminder = (item) => {
    const cleanPhone = (item.phone || '').replace(/\D/g, '');
    const phoneWithCountry = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const currentTemplates = getActiveTemplates();
    const expiryDateStr = formatDate(item.membershipEnd);

    const message = renderTemplate(currentTemplates.expiryReminder?.template, {
      student_name: item.name || 'Student',
      library_name: getTenantItem('library_name', 'Study Point Library'),
      expiry_date: expiryDateStr,
      seat_number: item.seatNumber || '—',
      phone: item.phone || '',
    });

    const waUrl = `https://api.whatsapp.com/send?phone=${phoneWithCountry}&text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col h-full justify-between">
      <div>
        <div
          onClick={() => navigate('/students')}
          className="flex items-start justify-between mb-4 cursor-pointer group"
        >
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Clock className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-gray-900 group-hover:text-amber-600 transition-colors">
                Expiring This Week (7 Days)
              </h3>
            </div>
            <p className="text-xs text-gray-500 mt-1 ml-10">Memberships due for renewal soon</p>
          </div>
          {expiringList.length > 0 && (
            <span className="text-xs font-black text-amber-700 bg-amber-50 border border-amber-100 px-2.5 py-1 rounded-full">
              {expiringList.length} Due
            </span>
          )}
        </div>

        {expiringList.length > 0 ? (
          <div className="space-y-2.5">
            {expiringList.slice(0, 4).map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-2xl bg-amber-50/40 border border-amber-100/80 flex items-center justify-between gap-3 hover:bg-amber-50 transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {item.photo ? (
                    <img
                      src={item.photo}
                      alt={item.name}
                      className="w-9 h-9 rounded-xl object-cover border border-amber-200 shrink-0 shadow-2xs"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 font-bold text-xs flex items-center justify-center shrink-0">
                      {item.name?.charAt(0)?.toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-slate-900 text-sm truncate">{item.name}</p>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white text-slate-700 border border-slate-200">
                        Seat #{item.seatNumber}
                      </span>
                    </div>
                    <p className="text-xs text-amber-700 font-bold mt-0.5 flex items-center gap-1">
                      <span>{item.diffDays === 0 ? '⚠️ Expires Today!' : `⏳ In ${item.diffDays} days (${formatDate(item.membershipEnd)})`}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => handleSendReminder(item)}
                    className="p-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-1"
                    title="Send WhatsApp Renewal Reminder"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">WhatsApp</span>
                  </button>
                  <button
                    onClick={() => navigate('/fees', { state: { collectStudentId: item.id } })}
                    className="px-2.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-xs cursor-pointer"
                  >
                    Renew
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 flex flex-col items-center justify-center">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-1.5">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <p className="text-sm font-bold text-slate-800">No memberships expiring this week</p>
            <p className="text-xs text-slate-400 mt-0.5">All active subscriptions are valid.</p>
          </div>
        )}
      </div>

      <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs">
        <span className="text-slate-500 font-medium">Automatic 7-day alert window</span>
        <button
          onClick={() => navigate('/students')}
          className="font-bold text-amber-600 hover:text-amber-700 hover:underline inline-flex items-center gap-1 cursor-pointer"
        >
          <span>View All Students</span>
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

// 2. Counter Cash Register (Cash In Hand Drawer)
export function CashRegisterWidget({ todayCashFees = 0, todayCashExpenses = 0 }) {
  const navigate = useNavigate();
  const netCashInHand = Math.max(0, todayCashFees - todayCashExpenses);

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col h-full justify-between">
      <div>
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Wallet className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-gray-900">Counter Cash Drawer</h3>
            </div>
            <p className="text-xs text-gray-500 mt-1 ml-10">Physical cash on hand today</p>
          </div>
          <span className="text-xs font-black text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full">
            Drawer Live
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-emerald-50 to-teal-50 border border-emerald-200/60 mb-3">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-700 block">
            Net Cash in Hand
          </span>
          <p className="text-2xl sm:text-3xl font-black text-emerald-950 mt-1">
            {formatCurrency(netCashInHand)}
          </p>
          <p className="text-xs text-emerald-800/80 font-medium mt-1">
            Available in reception cash drawer
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div
            onClick={() => navigate('/fees')}
            className="p-2.5 rounded-xl bg-slate-50 hover:bg-indigo-50 border border-slate-200/70 cursor-pointer transition"
          >
            <span className="text-slate-500 font-medium block">💵 Cash Collected:</span>
            <span className="font-extrabold text-slate-900 text-sm">{formatCurrency(todayCashFees)}</span>
          </div>
          <div
            onClick={() => navigate('/expenses')}
            className="p-2.5 rounded-xl bg-slate-50 hover:bg-rose-50 border border-slate-200/70 cursor-pointer transition"
          >
            <span className="text-slate-500 font-medium block">💸 Cash Spent:</span>
            <span className="font-extrabold text-rose-700 text-sm">-{formatCurrency(todayCashExpenses)}</span>
          </div>
        </div>
      </div>

      <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs">
        <span className="text-slate-500 font-medium">Reconcile at shift close</span>
        <button
          onClick={() => navigate('/reports')}
          className="font-bold text-emerald-600 hover:text-emerald-700 hover:underline inline-flex items-center gap-1 cursor-pointer"
        >
          <span>Daily Statement</span>
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

// 3. Payment Mode Breakdown Widget (UPI vs Cash vs Bank)
export function PaymentModesWidget({ upiTotal = 0, cashTotal = 0, bankTotal = 0 }) {
  const navigate = useNavigate();
  const grandTotal = upiTotal + cashTotal + bankTotal;
  const getPct = (val) => (grandTotal > 0 ? Math.round((val / grandTotal) * 100) : 0);

  const upiPct = getPct(upiTotal);
  const cashPct = getPct(cashTotal);
  const bankPct = getPct(bankTotal);

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col h-full justify-between">
      <div>
        <div
          onClick={() => navigate('/reports')}
          className="flex items-start justify-between mb-4 cursor-pointer group"
        >
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <PieChart className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-gray-900 group-hover:text-purple-600 transition-colors">
                Payment Modes Split
              </h3>
            </div>
            <p className="text-xs text-gray-500 mt-1 ml-10">Monthly revenue collection channels</p>
          </div>
          <span className="text-xs font-black text-purple-700 bg-purple-50 border border-purple-100 px-2.5 py-1 rounded-full">
            {formatCurrency(grandTotal)} Total
          </span>
        </div>

        {/* Multi-segment Progress Bar */}
        <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden flex mb-4">
          <div style={{ width: `${upiPct}%` }} className="bg-indigo-600 h-full" title={`UPI: ${upiPct}%`} />
          <div style={{ width: `${cashPct}%` }} className="bg-emerald-500 h-full" title={`Cash: ${cashPct}%`} />
          <div style={{ width: `${bankPct}%` }} className="bg-purple-500 h-full" title={`Bank: ${bankPct}%`} />
        </div>

        <div className="space-y-2">
          {/* UPI */}
          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
              <span className="font-bold text-slate-800">📱 UPI / QR Scan</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-indigo-700">{formatCurrency(upiTotal)}</span>
              <span className="text-[10px] font-black bg-indigo-100 text-indigo-800 px-1.5 py-0.5 rounded">{upiPct}%</span>
            </div>
          </div>

          {/* Cash */}
          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="font-bold text-slate-800">💵 Cash Counter</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-emerald-700">{formatCurrency(cashTotal)}</span>
              <span className="text-[10px] font-black bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">{cashPct}%</span>
            </div>
          </div>

          {/* Bank */}
          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
              <span className="font-bold text-slate-800">🏦 Bank Transfer</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-purple-700">{formatCurrency(bankTotal)}</span>
              <span className="text-[10px] font-black bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded">{bankPct}%</span>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs">
        <span className="text-slate-500 font-medium">Digital vs Physical ratio</span>
        <button
          onClick={() => navigate('/reports')}
          className="font-bold text-purple-600 hover:text-purple-700 hover:underline inline-flex items-center gap-1 cursor-pointer"
        >
          <span>Payment Reports</span>
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

// 4. Monthly Revenue Target Widget
export function MonthlyTargetWidget({ currentRevenue = 0 }) {
  const [target, setTarget] = useState(() => {
    return Number(localStorage.getItem('studypoint_monthly_target')) || 50000;
  });
  const [isEditing, setIsEditing] = useState(false);
  const [tempTarget, setTempTarget] = useState(String(target));

  const pct = target > 0 ? Math.min(100, Math.round((currentRevenue / target) * 100)) : 0;
  const remaining = Math.max(0, target - currentRevenue);

  const handleSave = () => {
    const num = Number(tempTarget) || 50000;
    setTarget(num);
    localStorage.setItem('studypoint_monthly_target', String(num));
    setIsEditing(false);
  };

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col h-full justify-between">
      <div>
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-gray-900">Monthly Revenue Goal</h3>
            </div>
            <p className="text-xs text-gray-500 mt-1 ml-10">Collection milestone progress</p>
          </div>
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="text-xs text-indigo-600 hover:underline font-bold flex items-center gap-1 cursor-pointer"
            >
              <Edit2 className="w-3 h-3" />
              <span>Set Goal</span>
            </button>
          ) : (
            <div className="flex items-center gap-1">
              <input
                type="number"
                value={tempTarget}
                onChange={(e) => setTempTarget(e.target.value)}
                className="w-20 px-2 py-0.5 text-xs border rounded-lg"
              />
              <button
                onClick={handleSave}
                className="p-1 bg-emerald-600 text-white rounded-lg text-xs"
              >
                <Check className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>

        <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 mb-3">
          <div className="flex justify-between items-baseline mb-2">
            <span className="text-xs font-bold text-indigo-900">Achieved: {formatCurrency(currentRevenue)}</span>
            <span className="text-xs font-extrabold text-slate-600">Goal: {formatCurrency(target)}</span>
          </div>
          <div className="w-full bg-indigo-100 rounded-full h-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-indigo-600 to-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="flex justify-between items-center mt-2 text-xs">
            <span className="font-black text-indigo-700">{pct}% Completed</span>
            <span className="text-slate-500 font-medium">
              {remaining > 0 ? `Remaining: ${formatCurrency(remaining)}` : '🎉 Target Achieved!'}
            </span>
          </div>
        </div>
      </div>

      <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs">
        <span className="text-slate-500 font-medium">Track your branch growth</span>
        <span className="font-extrabold text-indigo-600">Aim High 🚀</span>
      </div>
    </div>
  );
}

// 5. Expense Categories Breakdown Widget
export function ExpenseCategoriesWidget({ expenses = [] }) {
  const navigate = useNavigate();
  const categoryTotals = expenses.reduce((acc, e) => {
    const cat = e.category || 'General';
    acc[cat] = (acc[cat] || 0) + (Number(e.amount) || 0);
    return acc;
  }, {});

  const totalExp = Object.values(categoryTotals).reduce((s, v) => s + v, 0);

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col h-full justify-between">
      <div>
        <div
          onClick={() => navigate('/expenses')}
          className="flex items-start justify-between mb-4 cursor-pointer group"
        >
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <FileText className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-gray-900 group-hover:text-rose-600 transition-colors">
                Expense Categories
              </h3>
            </div>
            <p className="text-xs text-gray-500 mt-1 ml-10">Current month spending breakdown</p>
          </div>
          <span className="text-xs font-black text-rose-700 bg-rose-50 border border-rose-100 px-2.5 py-1 rounded-full">
            {formatCurrency(totalExp)}
          </span>
        </div>

        {Object.keys(categoryTotals).length > 0 ? (
          <div className="space-y-2">
            {Object.entries(categoryTotals).slice(0, 4).map(([cat, amt]) => {
              const pct = totalExp > 0 ? Math.round((amt / totalExp) * 100) : 0;
              return (
                <div key={cat} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-slate-800 capitalize">{cat}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-rose-600">{formatCurrency(amt)}</span>
                      <span className="text-[10px] text-slate-400 font-bold">({pct}%)</span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-rose-500 h-full rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-6 text-xs text-slate-400">
            No expenses logged yet this month.
          </div>
        )}
      </div>

      <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs">
        <span className="text-slate-500 font-medium">Auto-aggregated categories</span>
        <button
          onClick={() => navigate('/expenses')}
          className="font-bold text-rose-600 hover:text-rose-700 hover:underline inline-flex items-center gap-1 cursor-pointer"
        >
          <span>Open Expenses</span>
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

// 6. Quick Fee & Discount Calculator Widget
export function FeeCalculatorWidget({ plans = [] }) {
  const [selectedPlanId, setSelectedPlanId] = useState(plans[0]?.id || '');
  const [hasLocker, setHasLocker] = useState(false);
  const [discount, setDiscount] = useState('');

  const activePlan = plans.find((p) => p.id === selectedPlanId) || plans[0];
  const planPrice = Number(activePlan?.price) || 800;
  const duration = activePlan?.durationMonths || 1;
  const lockerRate = 150 * duration;
  const discountNum = Number(discount) || 0;
  const netPayable = Math.max(0, planPrice + (hasLocker ? lockerRate : 0) - discountNum);

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col h-full justify-between">
      <div>
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
                <Calculator className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-gray-900">Quick Fee Estimator</h3>
            </div>
            <p className="text-xs text-gray-500 mt-1 ml-10">Instant price quote for new students</p>
          </div>
        </div>

        <div className="space-y-2.5 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Select Plan:</label>
            <select
              value={selectedPlanId}
              onChange={(e) => setSelectedPlanId(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 text-xs bg-white font-bold"
            >
              {plans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} (₹{p.price})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200/70">
            <label className="flex items-center gap-2 font-bold text-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={hasLocker}
                onChange={(e) => setHasLocker(e.target.checked)}
                className="rounded text-indigo-600"
              />
              <span>Include Locker (+₹{lockerRate})</span>
            </label>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Discount (₹):</label>
            <input
              type="number"
              placeholder="e.g. 100"
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 text-xs font-bold"
            />
          </div>

          <div className="p-3 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-between">
            <span className="font-extrabold text-indigo-900">Total Payable:</span>
            <span className="text-lg font-black text-indigo-700">{formatCurrency(netPayable)}</span>
          </div>
        </div>
      </div>

      <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs">
        <span className="text-slate-500 font-medium">Includes addons & discount</span>
        <span className="font-bold text-indigo-600">Reception Tool</span>
      </div>
    </div>
  );
}

// 7. Lockers & Facilities Utilization Widget
export function AddonUtilizationWidget({ seats = [], students = [] }) {
  const totalSeatsWithLocker = seats.filter((s) => s.addons?.locker).length;
  const activeStudentsWithLocker = students.filter(
    (s) => s.status === 'active' && s.addons?.locker
  ).length;

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col h-full justify-between">
      <div>
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
                <Lock className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-gray-900">Locker & Facility Status</h3>
            </div>
            <p className="text-xs text-gray-500 mt-1 ml-10">Locker allocation and occupancy</p>
          </div>
          <span className="text-xs font-black text-violet-700 bg-violet-50 border border-violet-100 px-2.5 py-1 rounded-full">
            {activeStudentsWithLocker} Rented
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-center">
            <span className="text-slate-500 text-xs font-bold block">Assigned Lockers</span>
            <p className="text-2xl font-black text-violet-900 mt-1">{activeStudentsWithLocker}</p>
          </div>
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-center">
            <span className="text-slate-500 text-xs font-bold block">Locker Capacity</span>
            <p className="text-2xl font-black text-slate-800 mt-1">{totalSeatsWithLocker || 24}</p>
          </div>
        </div>
      </div>

      <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs">
        <span className="text-slate-500 font-medium">Extra revenue stream</span>
        <span className="font-bold text-violet-600">Active Facilities</span>
      </div>
    </div>
  );
}

// 8. Instant Seat Finder Widget
export function QuickSeatSearchWidget({ seats = [], students = [], sections = [] }) {
  const [searchNum, setSearchNum] = useState('');
  const [searchedSeat, setSearchedSeat] = useState(null);

  const handleSearch = (e) => {
    e?.preventDefault();
    if (!searchNum.trim()) {
      setSearchedSeat(null);
      return;
    }
    const clean = searchNum.trim().toLowerCase();
    const foundSeat = seats.find(
      (s) => String(s.seatNumber).toLowerCase() === clean
    );

    if (foundSeat) {
      const assignedStudent = students.find(
        (st) => st.status === 'active' && st.seatId === foundSeat.id
      );
      const section = sections.find((sec) => sec.id === foundSeat.sectionId);
      setSearchedSeat({ ...foundSeat, assignedStudent, sectionName: section?.name || 'Section' });
    } else {
      setSearchedSeat('not_found');
    }
  };

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col h-full justify-between">
      <div>
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Search className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-gray-900">Instant Seat Lookup</h3>
            </div>
            <p className="text-xs text-gray-500 mt-1 ml-10">Check seat allocation in 1 second</p>
          </div>
        </div>

        <form onSubmit={handleSearch} className="flex gap-2 mb-3">
          <input
            type="text"
            placeholder="Enter Seat # (e.g. 15)"
            value={searchNum}
            onChange={(e) => setSearchNum(e.target.value)}
            className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-300 font-bold outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="px-3.5 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-xs hover:bg-blue-700 cursor-pointer"
          >
            Check
          </button>
        </form>

        {searchedSeat === 'not_found' && (
          <div className="p-3 rounded-2xl bg-rose-50 text-rose-700 text-xs font-bold border border-rose-100">
            Seat #{searchNum} not found in records.
          </div>
        )}

        {searchedSeat && searchedSeat !== 'not_found' && (
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1">
            <div className="flex justify-between items-center">
              <span className="font-extrabold text-slate-900">Seat #{searchedSeat.seatNumber} ({searchedSeat.sectionName})</span>
              <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                searchedSeat.assignedStudent ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
              }`}>
                {searchedSeat.assignedStudent ? 'Occupied' : 'Vacant (Empty)'}
              </span>
            </div>
            {searchedSeat.assignedStudent ? (
              <p className="text-slate-600 font-medium">
                Assigned to: <strong className="text-slate-900">{searchedSeat.assignedStudent.name}</strong> ({searchedSeat.assignedStudent.phone})
              </p>
            ) : (
              <p className="text-emerald-700 font-semibold">Available for new admission.</p>
            )}
          </div>
        )}
      </div>

      <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
        <span>Instant database query</span>
        <span className="font-bold text-blue-600">Quick Check</span>
      </div>
    </div>
  );
}

// 9. Digital Notice Board Widget
export function NoticeBoardWidget() {
  const [notice, setNotice] = useState(() => {
    return (
      localStorage.getItem('studypoint_daily_notice') ||
      '🔔 Welcome students! Maintain pin-drop silence in Hall A & B. High-speed 5G WiFi is active.'
    );
  });
  const [isEditing, setIsEditing] = useState(false);
  const [tempNotice, setTempNotice] = useState(notice);

  const handleSave = () => {
    setNotice(tempNotice);
    localStorage.setItem('studypoint_daily_notice', tempNotice);
    setIsEditing(false);
  };

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col h-full justify-between">
      <div>
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-gray-900">Library Notice Board</h3>
            </div>
            <p className="text-xs text-gray-500 mt-1 ml-10">Daily announcement & broadcast</p>
          </div>
          {!isEditing ? (
            <button
              onClick={() => {
                setTempNotice(notice);
                setIsEditing(true);
              }}
              className="text-xs font-bold text-amber-600 hover:underline cursor-pointer flex items-center gap-1"
            >
              <Edit2 className="w-3 h-3" />
              <span>Edit</span>
            </button>
          ) : (
            <button
              onClick={handleSave}
              className="text-xs font-bold text-emerald-600 hover:underline cursor-pointer flex items-center gap-1"
            >
              <Check className="w-3 h-3" />
              <span>Save</span>
            </button>
          )}
        </div>

        {isEditing ? (
          <textarea
            rows={3}
            value={tempNotice}
            onChange={(e) => setTempNotice(e.target.value)}
            className="w-full p-2.5 text-xs rounded-xl border border-slate-300 font-medium outline-none focus:ring-2 focus:ring-amber-500"
          />
        ) : (
          <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200/70 text-xs font-medium text-amber-950 leading-relaxed shadow-2xs">
            {notice}
          </div>
        )}
      </div>

      <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
        <span>Broadcasted to reception</span>
        <span className="font-bold text-amber-600">Daily Notice</span>
      </div>
    </div>
  );
}

// 10. Staff On-Duty Overview Widget
export function StaffActivityWidget({ staffUsers = [] }) {
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col h-full justify-between">
      <div>
        <div
          onClick={() => navigate('/staff')}
          className="flex items-start justify-between mb-4 cursor-pointer group"
        >
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                Staff & Roles Team
              </h3>
            </div>
            <p className="text-xs text-gray-500 mt-1 ml-10">Active branch staff members</p>
          </div>
          <span className="text-xs font-black text-indigo-700 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-full">
            {staffUsers.length} Staff
          </span>
        </div>

        {staffUsers.length > 0 ? (
          <div className="space-y-2">
            {staffUsers.slice(0, 3).map((st) => (
              <div
                key={st.id}
                className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center shrink-0">
                    {st.name?.charAt(0)?.toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-slate-800 truncate">{st.name}</p>
                    <p className="text-[10px] text-slate-400 capitalize">{st.roleLabel || st.role || 'Receptionist'}</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  Active
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-xs text-slate-400">
            No secondary staff created yet.
          </div>
        )}
      </div>

      <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs">
        <span className="text-slate-500 font-medium">Access control managed</span>
        <button
          onClick={() => navigate('/staff')}
          className="font-bold text-indigo-600 hover:text-indigo-700 hover:underline inline-flex items-center gap-1 cursor-pointer"
        >
          <span>Manage Staff</span>
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

// 11. New Inquiries Pipeline Widget
export function NewInquiriesWidget({ visitors = [] }) {
  const navigate = useNavigate();
  const inquiries = visitors.filter((v) => v.purpose === 'inquiry' || v.status === 'inquiry');

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col h-full justify-between">
      <div>
        <div
          onClick={() => navigate('/visitors')}
          className="flex items-start justify-between mb-4 cursor-pointer group"
        >
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <HelpCircle className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-gray-900 group-hover:text-teal-600 transition-colors">
                New Inquiries & Leads
              </h3>
            </div>
            <p className="text-xs text-gray-500 mt-1 ml-10">Walk-in visitors requiring follow-up</p>
          </div>
          {inquiries.length > 0 && (
            <span className="text-xs font-black text-teal-700 bg-teal-50 border border-teal-100 px-2.5 py-1 rounded-full">
              {inquiries.length} Leads
            </span>
          )}
        </div>

        {inquiries.length > 0 ? (
          <div className="space-y-2">
            {inquiries.slice(0, 3).map((v) => (
              <div
                key={v.id}
                className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs"
              >
                <div>
                  <p className="font-bold text-slate-800">{v.name}</p>
                  <p className="text-[11px] text-slate-500">📞 {v.phone || '—'}</p>
                </div>
                <button
                  onClick={() => navigate('/students', { state: { convertVisitor: v } })}
                  className="px-2.5 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-bold text-xs"
                >
                  Admit
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-xs text-slate-400">
            No pending walk-in inquiries.
          </div>
        )}
      </div>

      <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs">
        <span className="text-slate-500 font-medium">Convert leads to members</span>
        <button
          onClick={() => navigate('/visitors')}
          className="font-bold text-teal-600 hover:text-teal-700 hover:underline inline-flex items-center gap-1 cursor-pointer"
        >
          <span>View Leads</span>
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

// 12. Net Growth (Admissions vs Left Students)
export function AdmissionsVsExitsWidget({ admissionsCount = 0, leftCount = 0 }) {
  const net = admissionsCount - leftCount;

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col h-full justify-between">
      <div>
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <UserPlus className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-gray-900">Monthly Net Growth</h3>
            </div>
            <p className="text-xs text-gray-500 mt-1 ml-10">Admissions vs Exits balance</p>
          </div>
          <span className={`text-xs font-black px-2.5 py-1 rounded-full ${
            net >= 0 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
          }`}>
            {net >= 0 ? `+${net} Net` : `${net} Net`}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 text-center mb-2">
          <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-100">
            <span className="text-xs font-bold text-emerald-800">New Joined</span>
            <p className="text-2xl font-black text-emerald-950 mt-1">+{admissionsCount}</p>
          </div>
          <div className="p-3 rounded-2xl bg-rose-50/70 border border-rose-100">
            <span className="text-xs font-bold text-rose-800">Left / Inactive</span>
            <p className="text-2xl font-black text-rose-950 mt-1">-{leftCount}</p>
          </div>
        </div>
      </div>

      <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
        <span>Retention health metric</span>
        <span className="font-bold text-slate-700">{admissionsCount} enrolled</span>
      </div>
    </div>
  );
}

// 13. WhatsApp Reminders Sent Today Widget
export function RemindersCounterWidget({ urgentPendingCount = 0 }) {
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col h-full justify-between">
      <div>
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <BellRing className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-gray-900">WhatsApp Dispatch Hub</h3>
            </div>
            <p className="text-xs text-gray-500 mt-1 ml-10">Follow-up notification tracker</p>
          </div>
          <span className="text-xs font-black text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full">
            Active
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70 text-xs space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-slate-600 font-medium">Pending Recovery Queue:</span>
            <span className="font-black text-rose-600">{urgentPendingCount} Students</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-600 font-medium">Automated Templates:</span>
            <span className="font-bold text-slate-900">5 Ready</span>
          </div>
        </div>
      </div>

      <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs">
        <span className="text-slate-500 font-medium">1-click WhatsApp web API</span>
        <button
          onClick={() => navigate('/customization')}
          className="font-bold text-indigo-600 hover:underline cursor-pointer"
        >
          Edit Templates
        </button>
      </div>
    </div>
  );
}

// 14. Long-Term Multi-Month Members
export function TopMembersWidget({ students = [], plans = [] }) {
  const navigate = useNavigate();
  const multiMonthPlans = new Set(plans.filter((p) => p.durationMonths > 1).map((p) => p.id));
  const longTermStudents = students.filter(
    (s) => s.status === 'active' && multiMonthPlans.has(s.membershipPlanId)
  );

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col h-full justify-between">
      <div>
        <div
          onClick={() => navigate('/students')}
          className="flex items-start justify-between mb-4 cursor-pointer group"
        >
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Sparkles className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-gray-900 group-hover:text-amber-600 transition-colors">
                Long-Term VIP Members
              </h3>
            </div>
            <p className="text-xs text-gray-500 mt-1 ml-10">Quarterly & Annual subscribers</p>
          </div>
          <span className="text-xs font-black text-amber-700 bg-amber-50 border border-amber-100 px-2.5 py-1 rounded-full">
            {longTermStudents.length} VIPs
          </span>
        </div>

        {longTermStudents.length > 0 ? (
          <div className="space-y-2">
            {longTermStudents.slice(0, 3).map((st) => (
              <div
                key={st.id}
                className="p-2.5 rounded-xl bg-amber-50/40 border border-amber-100 flex items-center justify-between text-xs"
              >
                <p className="font-bold text-slate-800 truncate">{st.name}</p>
                <span className="text-[10px] font-extrabold bg-amber-200/70 text-amber-900 px-2 py-0.5 rounded-full">
                  Multi-Month
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-xs text-slate-400">
            No students currently on multi-month plans.
          </div>
        )}
      </div>

      <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
        <span>High-loyalty patrons</span>
        <button
          onClick={() => navigate('/memberships')}
          className="font-bold text-amber-600 hover:underline cursor-pointer"
        >
          View Plans
        </button>
      </div>
    </div>
  );
}

// 15. Recently Left / Departed Students Audit
export function LeftStudentsAuditWidget({ students = [] }) {
  const navigate = useNavigate();
  const leftStudents = students.filter(
    (s) => s.status === 'left' || s.status === 'inactive'
  );

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col h-full justify-between">
      <div>
        <div
          onClick={() => navigate('/students')}
          className="flex items-start justify-between mb-4 cursor-pointer group"
        >
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <UserMinus className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-gray-900 group-hover:text-slate-900 transition-colors">
                Recently Left Students
              </h3>
            </div>
            <p className="text-xs text-gray-500 mt-1 ml-10">Departed students & freed seat history</p>
          </div>
          <span className="text-xs font-black text-slate-700 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-full">
            {leftStudents.length} Total
          </span>
        </div>

        {leftStudents.length > 0 ? (
          <div className="space-y-2">
            {leftStudents.slice(0, 3).map((st) => (
              <div
                key={st.id}
                className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs"
              >
                <div className="min-w-0">
                  <p className="font-bold text-slate-700 truncate">{st.name}</p>
                  <p className="text-[11px] text-slate-400">📞 {st.phone || '—'}</p>
                </div>
                <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100">
                  Left
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-xs text-slate-400">
            No inactive students in records.
          </div>
        )}
      </div>

      <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs">
        <span className="text-slate-500 font-medium">Re-admission follow-up</span>
        <button
          onClick={() => navigate('/students')}
          className="font-bold text-slate-600 hover:text-slate-900 hover:underline inline-flex items-center gap-1 cursor-pointer"
        >
          <span>Audit Log</span>
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
