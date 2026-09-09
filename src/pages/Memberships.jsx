import React, { useState, useEffect, useMemo } from 'react';
import Layout from '../components/layout/Layout';
import Button from '../components/common/Button';
import ConfirmDialog from '../components/common/ConfirmDialog';
import PlanForm from '../components/memberships/PlanForm';
import PlanList from '../components/memberships/PlanList';
import {
  Plus,
  Loader2,
  CheckCircle2,
  Search,
  Calendar,
  CalendarDays,
  Flame,
  Users,
  Layers,
  Sparkles,
  Zap,
} from 'lucide-react';
import { COLLECTIONS } from '../utils/constants';
import { getDoc } from 'firebase/firestore';
import {
  fetchCollectionData,
  createDocument,
  updateDocument,
  removeDocument,
  getActiveTenantId,
  getFirestoreDocRef,
} from '../firebase/storageService';
import { getStoredShifts, getStoredAddons } from '../utils/helpers';
import { useAuth } from '../context/AuthContext';

export default function Memberships() {
  const { hasPermission } = useAuth();
  const canCreate = hasPermission('memberships', 'create');
  const canEdit = hasPermission('memberships', 'edit');
  const canDelete = hasPermission('memberships', 'delete');

  const [plans, setPlans] = useState([]);
  const [students, setStudents] = useState([]);
  const [studentCounts, setStudentCounts] = useState({});
  const [shifts, setShifts] = useState(getStoredShifts());
  const [addons, setAddons] = useState(getStoredAddons());
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [deleteData, setDeleteData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTab, setSelectedTab] = useState('all'); // 'all' | 'days' | 'months' | 'offers' | 'shifts'

  const fetchData = async () => {
    setLoading(true);
    try {
      const [plansData, studentsData] = await Promise.all([
        fetchCollectionData(COLLECTIONS.MEMBERSHIP_PLANS),
        fetchCollectionData(COLLECTIONS.STUDENTS),
      ]);
      setPlans(plansData);
      setStudents(studentsData);

      const counts = {};
      studentsData.forEach((student) => {
        const pId = student.membershipPlanId || student.planId;
        if (pId) {
          counts[pId] = (counts[pId] || 0) + 1;
        }
      });
      setStudentCounts(counts);

      // Load tenant-configured shifts from Firestore or localStorage
      try {
        const tenantId = getActiveTenantId();
        const shKey = `studypoint_${tenantId}_shifts`;
        const shiftDoc = await getDoc(getFirestoreDocRef(COLLECTIONS.SETTINGS, 'shiftTimings'));
        if (shiftDoc && shiftDoc.exists() && shiftDoc.data().shifts) {
          setShifts(shiftDoc.data().shifts);
          localStorage.setItem(shKey, JSON.stringify(shiftDoc.data().shifts));
        } else {
          setShifts(getStoredShifts());
        }
      } catch (_) {
        setShifts(getStoredShifts());
      }

      // Load tenant-configured addons/facilities from Firestore or localStorage
      try {
        const addonsData = await fetchCollectionData(COLLECTIONS.ADDON_PRICING);
        if (Array.isArray(addonsData) && addonsData.length > 0) {
          setAddons(addonsData);
        } else {
          setAddons(getStoredAddons());
        }
      } catch (_) {
        setAddons(getStoredAddons());
      }
    } catch (error) {
      console.error('Error fetching plans data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  const handleAdd = () => {
    setEditData(null);
    setIsFormOpen(true);
  };

  const handleEdit = (plan) => {
    setEditData(plan);
    setIsFormOpen(true);
  };

  const handleDeleteClick = (plan) => {
    setDeleteData(plan);
  };

  const handleToggle = async (plan) => {
    await updateDocument(COLLECTIONS.MEMBERSHIP_PLANS, plan.id, { isActive: !plan.isActive });
    showToast(`Plan status ${!plan.isActive ? 'Activated' : 'Deactivated'}`);
    await fetchData();
  };

  const handleFormSubmit = async (data) => {
    try {
      if (editData) {
        await updateDocument(COLLECTIONS.MEMBERSHIP_PLANS, editData.id, data);
        showToast(`Membership plan "${data.name}" updated successfully!`);
      } else {
        await createDocument(COLLECTIONS.MEMBERSHIP_PLANS, data);
        showToast(`New membership plan "${data.name}" added successfully!`);
      }
      setIsFormOpen(false);
      await fetchData();
    } catch (e) {
      console.error('Error saving plan:', e);
      showToast('Error saving plan: ' + e.message);
    }
  };

  const confirmDelete = async () => {
    if (deleteData) {
      try {
        await removeDocument(COLLECTIONS.MEMBERSHIP_PLANS, deleteData.id);
        showToast(`Plan "${deleteData.name}" removed`);
        setDeleteData(null);
        await fetchData();
      } catch (e) {
        console.error('Error deleting plan:', e);
      }
    }
  };

  // Stat metrics
  const stats = useMemo(() => {
    const total = plans.length;
    const dayPlans = plans.filter(
      (p) => p.durationUnit === 'days' || Boolean(p.durationDays && !p.durationMonths)
    ).length;
    const monthPlans = plans.filter(
      (p) => p.durationUnit !== 'days' && (!p.durationDays || p.durationMonths > 0)
    ).length;
    const offers = plans.filter((p) => p.isOffer).length;
    const totalEnrolled = Object.values(studentCounts).reduce((a, b) => a + b, 0);

    return { total, dayPlans, monthPlans, offers, totalEnrolled };
  }, [plans, studentCounts]);

  // Filtered plans
  const filteredPlans = useMemo(() => {
    return plans.filter((p) => {
      const isDay = p.durationUnit === 'days' || Boolean(p.durationDays && !p.durationMonths);

      // Search match
      const nameMatch = p.name?.toLowerCase().includes(searchTerm.toLowerCase());
      const priceMatch = String(p.price).includes(searchTerm);
      if (searchTerm && !nameMatch && !priceMatch) return false;

      // Tab match
      if (selectedTab === 'days') return isDay;
      if (selectedTab === 'months') return !isDay;
      if (selectedTab === 'offers') return !!p.isOffer;
      if (selectedTab === 'shifts') return p.shiftType && p.shiftType !== 'all';

      return true;
    });
  }, [plans, searchTerm, selectedTab]);

  if (loading) {
    return (
      <Layout title="Membership Plans">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Membership Plans">
      <div className="space-y-6 max-w-7xl mx-auto pb-10">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100">
                <Sparkles className="w-5 h-5" />
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Membership Plans & Offers
              </h1>
            </div>
            <p className="text-slate-500 text-xs sm:text-sm mt-1">
              Configure daily crash plans, monthly tiers, shift-specific passes, and special discount offers
            </p>
          </div>

          {canCreate && (
            <button
              onClick={handleAdd}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-extrabold text-sm shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Add Membership Plan</span>
            </button>
          )}
        </div>

        {/* Top Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4">
          <div className="p-4 rounded-3xl bg-white border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Total Plans</span>
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Layers className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-slate-900 mt-2">{stats.total}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Active catalog</p>
          </div>

          <div className="p-4 rounded-3xl bg-white border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Day Plans</span>
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <CalendarDays className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-slate-900 mt-2">{stats.dayPlans}</p>
            <p className="text-[11px] text-amber-700 font-bold mt-0.5">Exam / Crash plans</p>
          </div>

          <div className="p-4 rounded-3xl bg-white border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Monthly</span>
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Calendar className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-slate-900 mt-2">{stats.monthPlans}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Regular subscriptions</p>
          </div>

          <div className="p-4 rounded-3xl bg-white border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Special Offers</span>
              <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <Flame className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-rose-600 mt-2">{stats.offers}</p>
            <p className="text-[11px] text-rose-600 font-bold mt-0.5">Discounts active</p>
          </div>

          <div className="col-span-2 sm:col-span-1 p-4 rounded-3xl bg-white border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Enrolled</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-emerald-600 mt-2">{stats.totalEnrolled}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Students on plans</p>
          </div>
        </div>

        {/* Toast Notification */}
        {toastMessage && (
          <div className="p-3.5 bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all shadow-xs animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Filter Tabs & Search Bar */}
        <div className="bg-white p-3 sm:p-4 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Tab Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
            <button
              onClick={() => setSelectedTab('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                selectedTab === 'all'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Plans ({stats.total})
            </button>
            <button
              onClick={() => setSelectedTab('days')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1 ${
                selectedTab === 'days'
                  ? 'bg-amber-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <CalendarDays className="w-3 h-3" />
              <span>Day Plans ({stats.dayPlans})</span>
            </button>
            <button
              onClick={() => setSelectedTab('months')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1 ${
                selectedTab === 'months'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Calendar className="w-3 h-3" />
              <span>Monthly ({stats.monthPlans})</span>
            </button>
            <button
              onClick={() => setSelectedTab('offers')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1 ${
                selectedTab === 'offers'
                  ? 'bg-rose-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Flame className="w-3 h-3" />
              <span>Offers ({stats.offers})</span>
            </button>
            <button
              onClick={() => setSelectedTab('shifts')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1 ${
                selectedTab === 'shifts'
                  ? 'bg-purple-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Zap className="w-3 h-3" />
              <span>Shift Specific</span>
            </button>
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search plan or price..."
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-2xs"
            />
          </div>
        </div>

        {/* Plans Grid */}
        <PlanList
          plans={filteredPlans}
          studentCounts={studentCounts}
          onEdit={handleEdit}
          onDelete={handleDeleteClick}
          onToggle={handleToggle}
          shifts={shifts}
          canEdit={canEdit}
          canDelete={canDelete}
        />
      </div>

      <PlanForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleFormSubmit}
        editData={editData}
        shifts={shifts}
        addons={addons}
      />

      <ConfirmDialog
        isOpen={!!deleteData}
        title="Delete Plan Permanently?"
        message={`Are you sure you want to delete the plan "${deleteData?.name}"? Students currently enrolled under this plan will preserve their fee records.`}
        confirmText="Delete Plan"
        onConfirm={confirmDelete}
        onClose={() => setDeleteData(null)}
        variant="danger"
      />
    </Layout>
  );
}

