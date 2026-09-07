import React, { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import StatsCards from '../components/dashboard/StatsCards';
import RevenueChart from '../components/dashboard/RevenueChart';
import OccupancyOverview from '../components/dashboard/OccupancyOverview';
import RecentActivity from '../components/dashboard/RecentActivity';
import TodayPulse from '../components/dashboard/TodayPulse';
import ShiftDistribution from '../components/dashboard/ShiftDistribution';
import PendingDuesAlert from '../components/dashboard/PendingDuesAlert';
import LiveDemoTracker from '../components/dashboard/LiveDemoTracker';
import { COLLECTIONS, SEAT_STATUS } from '../utils/constants';
import { fetchCollectionData, updateDocument } from '../firebase/storageService';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import {
  getActiveDashboardConfig,
  DASHBOARD_CONFIG_STORAGE_KEY,
  DEFAULT_STAFF_DASHBOARD_WIDGETS,
  getActiveDashboardOrder,
  DASHBOARD_ORDER_STORAGE_KEY,
  DEFAULT_DASHBOARD_ORDER,
} from '../utils/templateHelpers';
import {
  ExpiringMembershipsWidget,
  CashRegisterWidget,
  PaymentModesWidget,
  MonthlyTargetWidget,
  ExpenseCategoriesWidget,
  FeeCalculatorWidget,
  AddonUtilizationWidget,
  QuickSeatSearchWidget,
  NoticeBoardWidget,
  StaffActivityWidget,
  NewInquiriesWidget,
  AdmissionsVsExitsWidget,
  RemindersCounterWidget,
  TopMembersWidget,
  LeftStudentsAuditWidget,
} from '../components/dashboard/DashboardExtraWidgets';
import {
  Users,
  UserPlus,
  UserCheck,
  IndianRupee,
  Armchair,
  Sparkles,
  Loader2,
  Calendar,
  Receipt,
  FileSpreadsheet,
  CreditCard,
  ShieldCheck,
  Building2,
  TrendingUp,
  Sliders,
} from 'lucide-react';
import { formatCurrency, formatDate, checkAndAutoReleaseExpiredMemberships } from '../utils/helpers';

export default function Dashboard() {
  const { user, userRole, hasPermission } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [dashConfig, setDashConfig] = useState(getActiveDashboardConfig());
  const [widgetOrder, setWidgetOrder] = useState(getActiveDashboardOrder());

  const [stats, setStats] = useState({
    totalStudents: 0,
    seatsOccupied: 0,
    totalSeats: 0,
    revenue: 0,
    pendingFees: 0,
  });

  // New Live Metrics State
  const [todayPulse, setTodayPulse] = useState({
    todayCollection: 0,
    todayFeesCount: 0,
    todayAdmissions: 0,
    todayExpense: 0,
    emptySeats: 0,
  });

  const [shiftStats, setShiftStats] = useState({
    fullDayCount: 0,
    morningCount: 0,
    eveningCount: 0,
  });

  const [urgentPendingList, setUrgentPendingList] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [recentFees, setRecentFees] = useState([]);
  const [occupancyData, setOccupancyData] = useState([]);
  const [visitors, setVisitors] = useState([]);
  const [allSeatsList, setAllSeatsList] = useState([]);
  const [allSectionsList, setAllSectionsList] = useState([]);
  const [allStudentsList, setAllStudentsList] = useState([]);
  const [allPlansList, setAllPlansList] = useState([]);
  const [allStaffList, setAllStaffList] = useState([]);
  const [cashStats, setCashStats] = useState({ cashFees: 0, cashExpenses: 0 });
  const [paymentModeStats, setPaymentModeStats] = useState({ upi: 0, cash: 0, bank: 0 });
  const [monthExpensesList, setMonthExpensesList] = useState([]);
  const [admissionsVsLeft, setAdmissionsVsLeft] = useState({ admissions: 0, left: 0 });

  // Date matcher helper
  const matchesDate = (dateVal, targetDateStr) => {
    if (!dateVal) return false;
    let dStr = '';
    try {
      if (typeof dateVal === 'string') {
        dStr = dateVal.split('T')[0];
      } else if (dateVal.seconds) {
        dStr = new Date(dateVal.seconds * 1000).toISOString().split('T')[0];
      } else if (dateVal.toDate) {
        dStr = dateVal.toDate().toISOString().split('T')[0];
      } else {
        dStr = new Date(dateVal).toISOString().split('T')[0];
      }
    } catch (e) {
      dStr = '';
    }
    return dStr === targetDateStr;
  };

  const fetchAll = async () => {
    try {
      const [students, allSeats, allFees, allExpenses, allSections, allVisitors, allPlans, allStaff] = await Promise.all([
        fetchCollectionData(COLLECTIONS.STUDENTS),
        fetchCollectionData(COLLECTIONS.SEATS),
        fetchCollectionData(COLLECTIONS.FEES),
        fetchCollectionData(COLLECTIONS.EXPENSES),
        fetchCollectionData(COLLECTIONS.SECTIONS),
        fetchCollectionData(COLLECTIONS.VISITORS),
        fetchCollectionData(COLLECTIONS.MEMBERSHIP_PLANS),
        fetchCollectionData(COLLECTIONS.STAFF_USERS),
      ]);

      let currentStudents = students;
      let currentSeats = allSeats;
      try {
        const released = await checkAndAutoReleaseExpiredMemberships({
          students,
          seats: allSeats,
          updateDocument,
          COLLECTIONS,
          SEAT_STATUS,
        });
        if (released && released.length > 0) {
          const [refreshedStudents, refreshedSeats] = await Promise.all([
            fetchCollectionData(COLLECTIONS.STUDENTS),
            fetchCollectionData(COLLECTIONS.SEATS),
          ]);
          currentStudents = refreshedStudents;
          currentSeats = refreshedSeats;
        }
      } catch (err) {
        console.warn('Dashboard auto-release check failed gracefully:', err);
      }

      setAllStudentsList(currentStudents);
      setAllPlansList(allPlans || []);
      setAllStaffList(allStaff || []);

      const activeStudents = currentStudents.filter((s) => s.status === 'active');
      const occupiedSeatIds = new Set(activeStudents.map((s) => s.seatId).filter(Boolean));

      // Deduplicate seats to get exact physical seat count
      const uniqueSeatsMap = new Map();
      currentSeats.forEach((seat) => {
        const key = `${seat.sectionId}_${Number(seat.seatNumber) || seat.seatNumber}`;
        if (!uniqueSeatsMap.has(key)) uniqueSeatsMap.set(key, seat);
      });
      const uniqueSeatsList = Array.from(uniqueSeatsMap.values());

      const now = new Date();
      const todayIso = now.toISOString().split('T')[0];
      const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      
      const currentMonthFees = allFees.filter((f) => f.month === currentMonth);
      const revenue = currentMonthFees
        .filter((f) => f.status === 'paid')
        .reduce((sum, f) => sum + (Number(f.amount) || 0), 0);
      const pendingFees = currentMonthFees.filter((f) => f.status !== 'paid').length;

      setStats({
        totalStudents: activeStudents.length,
        seatsOccupied: occupiedSeatIds.size,
        totalSeats: uniqueSeatsList.length,
        revenue,
        pendingFees,
      });

      // 1. Calculate Today's Live Pulse
      const todayPaidFees = allFees.filter(
        (f) => f.status === 'paid' && matchesDate(f.paidDate, todayIso)
      );
      const todayCollection = todayPaidFees.reduce((sum, f) => sum + (Number(f.amount) || 0), 0);

      const todayAdmissions = students.filter((s) =>
        matchesDate(s.joinDate || s.createdAt, todayIso)
      ).length;

      const todayExpenses = allExpenses.filter((e) => matchesDate(e.date, todayIso));
      const todayExpenseTotal = todayExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

      const emptySeatsCount = Math.max(0, uniqueSeatsList.length - occupiedSeatIds.size);

      setTodayPulse({
        todayCollection,
        todayFeesCount: todayPaidFees.length,
        todayAdmissions,
        todayExpense: todayExpenseTotal,
        emptySeats: emptySeatsCount,
      });

      // 2. Shift Wise Counts
      const fullDay = activeStudents.filter((s) => !s.shift || s.shift === 'full_day').length;
      const morning = activeStudents.filter((s) => s.shift === 'first_half').length;
      const evening = activeStudents.filter((s) => s.shift === 'second_half').length;

      setShiftStats({
        fullDayCount: fullDay,
        morningCount: morning,
        eveningCount: evening,
      });

      // 3. Urgent Pending Dues List (With Student & Seat Info for 1-Click WhatsApp)
      const pendingDuesWithDetails = currentMonthFees
        .filter((f) => f.status !== 'paid')
        .map((fee) => {
          const stu = students.find((s) => s.id === fee.studentId);
          const seat = uniqueSeatsList.find((st) => st.id === stu?.seatId);
          return {
            ...fee,
            studentId: stu?.id || fee.studentId,
            studentName: stu?.name || 'Student',
            studentPhoto: stu?.photo || '',
            phone: stu?.phone || '',
            seatNumber: seat?.seatNumber || '—',
            lastFeeReminderAt: stu?.lastFeeReminderMonth === currentMonth ? stu?.lastFeeReminderAt : null,
          };
        });

      setUrgentPendingList(pendingDuesWithDetails);

      // 4. 6-Month Chart Data
      const months = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const label = d.toLocaleDateString('en-IN', { month: 'short' });
        const monthRevenue = allFees
          .filter((f) => f.month === key && f.status === 'paid')
          .reduce((s, f) => s + (Number(f.amount) || 0), 0);
        const monthExpenses = allExpenses
          .filter((e) => {
            const eDate = e.date?.toDate ? e.date.toDate() : new Date(e.date || now);
            return `${eDate.getFullYear()}-${String(eDate.getMonth() + 1).padStart(2, '0')}` === key;
          })
          .reduce((s, e) => s + (Number(e.amount) || 0), 0);
        months.push({ month: label, revenue: monthRevenue, expenses: monthExpenses });
      }
      setChartData(months);

      // 5. Recent Activity
      const feesSorted = [...allFees]
        .filter((f) => f.status === 'paid')
        .sort((a, b) => {
          const da = a.paidDate?.toDate ? a.paidDate.toDate() : new Date(a.paidDate || 0);
          const db2 = b.paidDate?.toDate ? b.paidDate.toDate() : new Date(b.paidDate || 0);
          return db2 - da;
        })
        .slice(0, 8);

      const feesWithNames = feesSorted.map((f) => {
        const stu = students.find((s) => s.id === f.studentId);
        return {
          ...f,
          studentName: stu?.name || 'Unknown Student',
          studentPhoto: stu?.photo || '',
        };
      });
      setRecentFees(feesWithNames);

      // 6. Section Occupancy
      const occData = allSections.map((sec) => {
        const secSeats = uniqueSeatsList.filter((s) => s.sectionId === sec.id);
        const occupied = secSeats.filter((s) => occupiedSeatIds.has(s.id)).length;
        return {
          id: sec.id,
          name: sec.name,
          totalSeats: secSeats.length || sec.totalSeats || 0,
          occupied,
          percentage: secSeats.length > 0 ? Math.round((occupied / secSeats.length) * 100) : 0,
        };
      });
      setOccupancyData(occData);
      setVisitors(allVisitors || []);
      setAllSeatsList(uniqueSeatsList || []);
      setAllSectionsList(allSections || []);

      // 7. Extra Smart Metrics Calculations
      const todayCashFees = todayPaidFees
        .filter((f) => !f.paymentMode || f.paymentMode === 'cash')
        .reduce((sum, f) => sum + (Number(f.amount) || 0), 0);
      const todayCashExpenses = todayExpenses
        .filter((e) => !e.paymentMode || e.paymentMode === 'cash')
        .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
      setCashStats({ cashFees: todayCashFees, cashExpenses: todayCashExpenses });

      const upiTotal = currentMonthFees
        .filter((f) => f.status === 'paid' && f.paymentMode === 'upi')
        .reduce((s, f) => s + (Number(f.amount) || 0), 0);
      const cashTotal = currentMonthFees
        .filter((f) => f.status === 'paid' && (!f.paymentMode || f.paymentMode === 'cash'))
        .reduce((s, f) => s + (Number(f.amount) || 0), 0);
      const bankTotal = currentMonthFees
        .filter((f) => f.status === 'paid' && (f.paymentMode === 'bank' || f.paymentMode === 'online' || f.paymentMode === 'card'))
        .reduce((s, f) => s + (Number(f.amount) || 0), 0);
      setPaymentModeStats({ upi: upiTotal, cash: cashTotal, bank: bankTotal });

      const mExpenses = allExpenses.filter((e) => {
        const d = e.date?.toDate ? e.date.toDate() : new Date(e.date || 0);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` === currentMonth;
      });
      setMonthExpensesList(mExpenses);

      const mAdmissions = students.filter((s) =>
        (s.joinDate || s.createdAt || '').toString().startsWith(currentMonth)
      ).length;
      const mLeft = students.filter((s) => s.status === 'left' || s.status === 'inactive').length;
      setAdmissionsVsLeft({ admissions: mAdmissions, left: mLeft });

      // 8. Cloud Customization Settings (Owner / Library Default)
      try {
        const custSnap = await getDoc(doc(db, COLLECTIONS.SETTINGS, 'customization'));
        if (custSnap.exists()) {
          const data = custSnap.data();
          if (data.dashboardConfig) {
            setDashConfig(data.dashboardConfig);
            localStorage.setItem(DASHBOARD_CONFIG_STORAGE_KEY, JSON.stringify(data.dashboardConfig));
          }
          if (data.dashboardWidgetOrder && Array.isArray(data.dashboardWidgetOrder)) {
            setWidgetOrder(data.dashboardWidgetOrder);
            localStorage.setItem(DASHBOARD_ORDER_STORAGE_KEY, JSON.stringify(data.dashboardWidgetOrder));
          }
        }
      } catch (err) {
        console.warn('Could not load cloud customization settings, using local:', err);
      }
    } catch (err) {
      console.error('Error fetching dashboard metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();

    const handleSync = () => {
      setDashConfig(getActiveDashboardConfig());
      setWidgetOrder(getActiveDashboardOrder());
    };
    window.addEventListener('storage', handleSync);
    window.addEventListener('focus', handleSync);
    return () => {
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('focus', handleSync);
    };
  }, []);

  const today = new Date();
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const todayStr = `${dayNames[today.getDay()]}, ${today.getDate()} ${monthNames[today.getMonth()]} ${today.getFullYear()}`;

  if (loading) {
    return (
      <Layout title="Dashboard">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      </Layout>
    );
  }

  const occupancyRate = stats.totalSeats > 0 ? Math.round((stats.seatsOccupied / stats.totalSeats) * 100) : 0;

  // Customization & Role-based visibility flags
  const effectiveRole = user?.role || userRole || 'owner';
  const isStaff = effectiveRole !== 'owner' && effectiveRole !== 'admin';
  const staffWidgets = isStaff
    ? user?.dashboardWidgets || user?.permissions?.dashboardWidgets || DEFAULT_STAFF_DASHBOARD_WIDGETS
    : null;

  const isFinancialHidden = isStaff && !!staffWidgets?.hideFinancials;

  const isVisible = (key, defaultStaff = true, isFinancial = false) => {
    if (isStaff) {
      if (isFinancial && isFinancialHidden) return false;
      if (staffWidgets && staffWidgets[key] !== undefined) {
        return !!staffWidgets[key];
      }
      return defaultStaff;
    }
    // Library Owner: strictly controlled by Customization dashConfig
    return dashConfig[key] === true;
  };

  // Group 1: Core Operations
  const showQuickActions = isVisible('quickActions', true);
  const showTodayPulse = isVisible('todayPulse', true, true);
  const showCoreStats = isVisible('coreStats', true);
  const showOccupancy = isVisible('occupancyOverview', true);
  const showShiftDist = isVisible('shiftDistribution', true);
  const showQuickSeatSearch = isVisible('quickSeatSearch', true);

  // Group 2: Financials & Money
  const showRevenueChart = isVisible('revenueChart', false, true);
  const showCashRegister = isVisible('cashRegister', false, true);
  const showPaymentModes = isVisible('paymentModesPie', false, true);
  const showMonthlyTarget = isVisible('monthlyTarget', false, true);
  const showExpenseCategories = isVisible('expenseCategories', false, true);
  const showRecentActivity = isVisible('recentActivity', false, true);
  const showFeeCalculator = isVisible('feeCalculator', true);

  // Group 3: Students, Inquiries & Retention
  const showPendingDues = isVisible('pendingDuesAlert', true);
  const showExpiringMemberships = isVisible('expiringMemberships', true);
  const showDemoTracker = isVisible('demoTracker', true);
  const showNewInquiries = isVisible('newInquiries', true);
  const showAdmissionsVsExits = isVisible('admissionsVsExits', true);
  const showTopMembers = isVisible('topMembers', false);
  const showLeftStudentsAudit = isVisible('leftStudentsAudit', false);

  // Group 4: Facilities, Automation & Team
  const showAddonUtilization = isVisible('addonUtilization', true);
  const showRemindersCounter = isVisible('remindersCounter', true);
  const showNoticeBoard = isVisible('noticeBoard', true);
  const showStaffActivity = isVisible('staffActivity', true);

  const hideRevenueCard = isStaff && (staffWidgets?.hideFinancials || !staffWidgets?.revenueChart);

  const anyWidgetVisible =
    showQuickActions ||
    showTodayPulse ||
    showCoreStats ||
    showQuickSeatSearch ||
    showOccupancy ||
    showRevenueChart ||
    showMonthlyTarget ||
    showCashRegister ||
    showPaymentModes ||
    showExpenseCategories ||
    showFeeCalculator ||
    showPendingDues ||
    showExpiringMemberships ||
    showDemoTracker ||
    showNewInquiries ||
    showAdmissionsVsExits ||
    showRemindersCounter ||
    showShiftDist ||
    showAddonUtilization ||
    showTopMembers ||
    showLeftStudentsAudit ||
    showNoticeBoard ||
    showStaffActivity ||
    showRecentActivity;

  const widgetVisibilityMap = {
    quickActions: showQuickActions,
    todayPulse: showTodayPulse,
    coreStats: showCoreStats,
    quickSeatSearch: showQuickSeatSearch,
    occupancyOverview: showOccupancy,
    revenueChart: showRevenueChart,
    monthlyTarget: showMonthlyTarget,
    cashRegister: showCashRegister,
    paymentModesPie: showPaymentModes,
    expenseCategories: showExpenseCategories,
    feeCalculator: showFeeCalculator,
    pendingDuesAlert: showPendingDues,
    expiringMemberships: showExpiringMemberships,
    demoTracker: showDemoTracker,
    newInquiries: showNewInquiries,
    admissionsVsExits: showAdmissionsVsExits,
    remindersCounter: showRemindersCounter,
    shiftDistribution: showShiftDist,
    addonUtilization: showAddonUtilization,
    topMembers: showTopMembers,
    leftStudentsAudit: showLeftStudentsAudit,
    noticeBoard: showNoticeBoard,
    staffActivity: showStaffActivity,
    recentActivity: showRecentActivity,
  };

  const renderWidgetById = (id) => {
    switch (id) {
      case 'quickActions':
        return (
          <div key={id} className="col-span-1 lg:col-span-2">
            <div className="bg-white rounded-2xl p-3 sm:p-4 border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between gap-2 overflow-x-auto scrollbar-hide py-1">
                <button
                  onClick={() => navigate('/students')}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 text-xs font-bold transition-all whitespace-nowrap flex-shrink-0 cursor-pointer group"
                >
                  <Users className="w-4 h-4 text-indigo-600 group-hover:scale-110 transition-transform" />
                  <span>Students</span>
                </button>
                <button
                  onClick={() => navigate('/visitors')}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 text-xs font-bold transition-all whitespace-nowrap flex-shrink-0 cursor-pointer group"
                >
                  <UserCheck className="w-4 h-4 text-blue-600 group-hover:scale-110 transition-transform" />
                  <span>Visit & Demo</span>
                </button>
                <button
                  onClick={() => navigate('/seats')}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 text-xs font-bold transition-all whitespace-nowrap flex-shrink-0 cursor-pointer group"
                >
                  <Armchair className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
                  <span>Seat Matrix</span>
                </button>
                <button
                  onClick={() => navigate('/fees')}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-purple-50 text-slate-700 hover:text-purple-700 text-xs font-bold transition-all whitespace-nowrap flex-shrink-0 cursor-pointer group"
                >
                  <CreditCard className="w-4 h-4 text-purple-600 group-hover:scale-110 transition-transform" />
                  <span>Fee Manager</span>
                </button>
                <button
                  onClick={() => navigate('/expenses')}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-rose-50 text-slate-700 hover:text-rose-700 text-xs font-bold transition-all whitespace-nowrap flex-shrink-0 cursor-pointer group"
                >
                  <Receipt className="w-4 h-4 text-rose-600 group-hover:scale-110 transition-transform" />
                  <span>Expenses</span>
                </button>
                <button
                  onClick={() => navigate('/reports')}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-amber-50 text-slate-700 hover:text-amber-700 text-xs font-bold transition-all whitespace-nowrap flex-shrink-0 cursor-pointer group"
                >
                  <FileSpreadsheet className="w-4 h-4 text-amber-600 group-hover:scale-110 transition-transform" />
                  <span>Reports & Statement</span>
                </button>
              </div>
            </div>
          </div>
        );

      case 'todayPulse':
        return (
          <div key={id} className="col-span-1 lg:col-span-2">
            <TodayPulse
              todayCollection={todayPulse.todayCollection}
              todayFeesCount={todayPulse.todayFeesCount}
              todayAdmissions={todayPulse.todayAdmissions}
              todayExpense={todayPulse.todayExpense}
              emptySeats={todayPulse.emptySeats}
            />
          </div>
        );

      case 'coreStats':
        return (
          <div key={id} className="col-span-1 lg:col-span-2">
            <StatsCards stats={stats} hideRevenue={hideRevenueCard} />
          </div>
        );

      case 'quickSeatSearch':
        return (
          <div key={id} className="col-span-1">
            <QuickSeatSearchWidget
              seats={allSeatsList}
              students={allStudentsList}
              sections={allSectionsList}
            />
          </div>
        );

      case 'occupancyOverview':
        return (
          <div key={id} className="col-span-1 bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col">
            <OccupancyOverview sections={occupancyData} />
          </div>
        );

      case 'revenueChart':
        return (
          <div key={id} className="col-span-1 bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col">
            <RevenueChart data={chartData} />
          </div>
        );

      case 'monthlyTarget':
        return (
          <div key={id} className="col-span-1">
            <MonthlyTargetWidget currentRevenue={stats.revenue} />
          </div>
        );

      case 'cashRegister':
        return (
          <div key={id} className="col-span-1">
            <CashRegisterWidget
              todayCashFees={cashStats.cashFees}
              todayCashExpenses={cashStats.cashExpenses}
            />
          </div>
        );

      case 'paymentModesPie':
        return (
          <div key={id} className="col-span-1">
            <PaymentModesWidget
              upiTotal={paymentModeStats.upi}
              cashTotal={paymentModeStats.cash}
              bankTotal={paymentModeStats.bank}
            />
          </div>
        );

      case 'expenseCategories':
        return (
          <div key={id} className="col-span-1">
            <ExpenseCategoriesWidget expenses={monthExpensesList} />
          </div>
        );

      case 'feeCalculator':
        return (
          <div key={id} className="col-span-1">
            <FeeCalculatorWidget plans={allPlansList} />
          </div>
        );

      case 'pendingDuesAlert':
        return (
          <div key={id} className="col-span-1 flex flex-col">
            <PendingDuesAlert pendingFees={urgentPendingList} />
          </div>
        );

      case 'expiringMemberships':
        return (
          <div key={id} className="col-span-1">
            <ExpiringMembershipsWidget
              students={allStudentsList}
              seats={allSeatsList}
            />
          </div>
        );

      case 'demoTracker':
        return (
          <div key={id} className="col-span-1 flex flex-col">
            <LiveDemoTracker
              visitors={visitors}
              seats={allSeatsList}
              sections={allSectionsList}
              onUpdate={fetchAll}
            />
          </div>
        );

      case 'newInquiries':
        return (
          <div key={id} className="col-span-1">
            <NewInquiriesWidget visitors={visitors} />
          </div>
        );

      case 'admissionsVsExits':
        return (
          <div key={id} className="col-span-1">
            <AdmissionsVsExitsWidget
              admissionsCount={admissionsVsLeft.admissions}
              leftCount={admissionsVsLeft.left}
            />
          </div>
        );

      case 'remindersCounter':
        return (
          <div key={id} className="col-span-1">
            <RemindersCounterWidget urgentPendingCount={urgentPendingList.length} />
          </div>
        );

      case 'shiftDistribution':
        return (
          <div key={id} className="col-span-1 flex flex-col">
            <ShiftDistribution
              fullDayCount={shiftStats.fullDayCount}
              morningCount={shiftStats.morningCount}
              eveningCount={shiftStats.eveningCount}
              totalStudents={stats.totalStudents}
            />
          </div>
        );

      case 'addonUtilization':
        return (
          <div key={id} className="col-span-1">
            <AddonUtilizationWidget
              seats={allSeatsList}
              students={allStudentsList}
            />
          </div>
        );

      case 'topMembers':
        return (
          <div key={id} className="col-span-1">
            <TopMembersWidget
              students={allStudentsList}
              plans={allPlansList}
            />
          </div>
        );

      case 'leftStudentsAudit':
        return (
          <div key={id} className="col-span-1">
            <LeftStudentsAuditWidget students={allStudentsList} />
          </div>
        );

      case 'noticeBoard':
        return (
          <div key={id} className="col-span-1">
            <NoticeBoardWidget />
          </div>
        );

      case 'staffActivity':
        return (
          <div key={id} className="col-span-1">
            <StaffActivityWidget staffUsers={allStaffList} />
          </div>
        );

      case 'recentActivity':
        return (
          <div key={id} className="col-span-1 lg:col-span-2 bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col">
            <RecentActivity fees={recentFees} />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Layout title="Dashboard">
      <div className="space-y-5 sm:space-y-6">
        
        {/* Welcome Header Hero Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-950 via-indigo-900 to-slate-950 p-6 sm:p-8 text-white shadow-xl shadow-indigo-950/20 border border-indigo-800/40">
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 -mb-12 w-48 h-48 rounded-full bg-emerald-500/15 blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-5">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-bold text-indigo-200 border border-white/10">
                  <Calendar className="w-3.5 h-3.5 text-indigo-300" />
                  <span>{todayStr}</span>
                </div>
                <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-extrabold border border-emerald-400/30">
                  <ShieldCheck className="w-3 h-3" />
                  <span>{!isStaff ? 'Library Owner' : 'Staff Admin'}</span>
                </div>
              </div>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white">
                Welcome back, {user?.displayName || user?.name || (!isStaff ? 'Owner' : 'Team Member')} 👋
              </h1>
              <p className="text-indigo-200/90 text-xs sm:text-sm mt-1.5 max-w-xl font-medium leading-relaxed">
                Study Point Smart Hub • <span className="text-white font-bold">{stats.totalStudents} Active Students</span> enrolled across <span className="text-white font-bold">{stats.totalSeats} seats</span> ({occupancyRate}% occupancy).
              </p>
            </div>

            {/* Quick Action Shortcuts inside Banner (only shown if quickActions enabled) */}
            {showQuickActions && (
              <div className="flex flex-wrap items-center gap-2.5 pt-1 md:pt-0">
                {hasPermission('students', 'create') && (
                  <button
                    onClick={() => navigate('/students')}
                    className="px-4 py-2.5 bg-white text-indigo-950 hover:bg-indigo-50 active:scale-95 rounded-2xl text-xs font-black transition-all shadow-md flex items-center gap-2 cursor-pointer"
                  >
                    <UserPlus className="w-4 h-4 text-indigo-600" />
                    <span>+ New Admission</span>
                  </button>
                )}

                {hasPermission('fees', 'create') && (
                  <button
                    onClick={() => navigate('/fees')}
                    className="px-4 py-2.5 bg-indigo-500/30 hover:bg-indigo-500/50 active:scale-95 text-white border border-white/20 rounded-2xl text-xs font-black transition-all shadow-md flex items-center gap-2 backdrop-blur-md cursor-pointer"
                  >
                    <IndianRupee className="w-4 h-4 text-emerald-400" />
                    <span>Collect Fee</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Empty State Banner if all 24 widgets are hidden */}
        {!anyWidgetVisible && (
          <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200/80 shadow-xs text-center flex flex-col items-center justify-center max-w-lg mx-auto my-6">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
              <Sliders className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">Sabhi Widgets Disable Hain</h3>
            <p className="text-xs sm:text-sm text-gray-500 mb-5 leading-relaxed">
              Aapne Customization page se dashboard ke sabhi widgets ko disable kar rakha hai. Dashboard par widgets dekhne ke liye Customization me jaakar widgets ON karein.
            </p>
            <button
              onClick={() => navigate('/customization')}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md cursor-pointer transition-all flex items-center gap-2"
            >
              <Sliders className="w-4 h-4" />
              <span>Customization Kholiye (Enable Widgets)</span>
            </button>
          </div>
        )}

        {/* Dynamic Ordered Widgets Grid */}
        {anyWidgetVisible && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
            {widgetOrder.map((widgetId) => {
              if (!widgetVisibilityMap[widgetId]) return null;
              return renderWidgetById(widgetId);
            })}
          </div>
        )}

      </div>
    </Layout>
  );
}
