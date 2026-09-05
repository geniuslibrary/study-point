import React, { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import StatsCards from '../components/dashboard/StatsCards';
import RevenueChart from '../components/dashboard/RevenueChart';
import OccupancyOverview from '../components/dashboard/OccupancyOverview';
import RecentActivity from '../components/dashboard/RecentActivity';
import { COLLECTIONS } from '../utils/constants';
import { fetchCollectionData } from '../firebase/storageService';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  UserPlus,
  IndianRupee,
  Armchair,
  Sparkles,
  Loader2,
  Calendar,
  Receipt,
  FileSpreadsheet,
  ArrowRight,
  TrendingUp,
  CreditCard,
  ShieldCheck,
} from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/helpers';

export default function Dashboard() {
  const { user, userRole, hasPermission } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalStudents: 0,
    seatsOccupied: 0,
    totalSeats: 0,
    revenue: 0,
    pendingFees: 0,
  });
  const [chartData, setChartData] = useState([]);
  const [recentFees, setRecentFees] = useState([]);
  const [occupancyData, setOccupancyData] = useState([]);

  const fetchAll = async () => {
    try {
      const [students, allSeats, allFees, allExpenses, allSections] = await Promise.all([
        fetchCollectionData(COLLECTIONS.STUDENTS),
        fetchCollectionData(COLLECTIONS.SEATS),
        fetchCollectionData(COLLECTIONS.FEES),
        fetchCollectionData(COLLECTIONS.EXPENSES),
        fetchCollectionData(COLLECTIONS.SECTIONS),
      ]);

      const activeStudents = students.filter((s) => s.status === 'active');
      const occupiedSeatIds = new Set(activeStudents.map((s) => s.seatId).filter(Boolean));

      // Deduplicate seats to get exact physical seat count
      const uniqueSeatsMap = new Map();
      allSeats.forEach((seat) => {
        const key = `${seat.sectionId}_${Number(seat.seatNumber) || seat.seatNumber}`;
        if (!uniqueSeatsMap.has(key)) uniqueSeatsMap.set(key, seat);
      });
      const uniqueSeatsList = Array.from(uniqueSeatsMap.values());

      const now = new Date();
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

      // 6-Month Chart Data
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

      // Recent Activity
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
        return { ...f, studentName: stu?.name || 'Unknown Student' };
      });
      setRecentFees(feesWithNames);

      // Section Occupancy
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
    } catch (err) {
      console.error('Error fetching dashboard metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
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

  return (
    <Layout title="Dashboard">
      <div className="space-y-5 sm:space-y-6">
        
        {/* Welcome Header Hero Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-950 via-indigo-900 to-slate-950 p-6 sm:p-8 text-white shadow-xl shadow-indigo-950/20 border border-indigo-800/40">
          {/* Subtle Ambient Background Gradients */}
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 -mb-12 w-48 h-48 rounded-full bg-emerald-500/15 blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-5">
            <div>
              {/* Date & Role Pill */}
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-bold text-indigo-200 border border-white/10">
                  <Calendar className="w-3.5 h-3.5 text-indigo-300" />
                  <span>{todayStr}</span>
                </div>
                <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-extrabold border border-emerald-400/30">
                  <ShieldCheck className="w-3 h-3" />
                  <span>{userRole === 'owner' ? 'Library Owner' : 'Staff Admin'}</span>
                </div>
              </div>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white">
                Welcome back, {user?.displayName || user?.name || (userRole === 'owner' ? 'Admin' : 'Team Member')} 👋
              </h1>
              <p className="text-indigo-200/90 text-xs sm:text-sm mt-1.5 max-w-xl font-medium leading-relaxed">
                Study Point Smart Hub • <span className="text-white font-bold">{stats.totalStudents} Active Students</span> currently enrolled across <span className="text-white font-bold">{stats.totalSeats} seats</span> ({occupancyRate}% occupancy).
              </p>
            </div>

            {/* Quick Action Shortcuts inside Banner */}
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
          </div>
        </div>

        {/* Quick Workflow Action Strip (Instant 1-Click Access for Mobile & Desktop) */}
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

        {/* 4 Core Stat Cards */}
        <StatsCards stats={stats} />

        {/* Charts & Occupancy Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col">
            <RevenueChart data={chartData} />
          </div>
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col">
            <OccupancyOverview sections={occupancyData} />
          </div>
        </div>

        {/* Recent Activity Table */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <RecentActivity fees={recentFees} />
        </div>

      </div>
    </Layout>
  );
}
