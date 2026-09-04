import { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import FeeTracker from '../components/fees/FeeTracker';
import CollectFeeModal from '../components/fees/CollectFeeModal';
import FeeReceipt from '../components/fees/FeeReceipt';
import Button from '../components/common/Button';
import {
  IndianRupee,
  Plus,
  Loader2,
  Calendar,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { COLLECTIONS } from '../utils/constants';
import { formatCurrency, getMonthYear, calculateSeatAddonCharges, getStoredAddons } from '../utils/helpers';
import {
  fetchCollectionData,
  createDocument,
  updateDocument,
} from '../firebase/storageService';

export default function Fees() {
  const [fees, setFees] = useState([]);
  const [students, setStudents] = useState([]);
  const [sections, setSections] = useState([]);
  const [seats, setSeats] = useState([]);
  const [plans, setPlans] = useState([]);
  const [addonPricing, setAddonPricing] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(getMonthYear());
  const [collectFee, setCollectFee] = useState(null);
  const [receiptFee, setReceiptFee] = useState(null);

  // Automatic Background Dues Synchronizer
  // Automatic Background Dues Synchronizer
  const autoSyncMonthlyDues = async (currentFees, activeStudents, allPlans, allSeats, allAddons) => {
    const currentMonth = getMonthYear();
    const activeAddonsList = allAddons && allAddons.length > 0 ? allAddons : getStoredAddons();

    // 1. Sync existing fees to make sure seat addons (like Locker) and durations are accurately reflected
    const updatedCurrentFees = await Promise.all(
      currentFees.map(async (fee) => {
        const student = activeStudents.find((s) => s.id === fee.studentId);
        if (!student) return fee;

        const seat = allSeats.find((s) => s.id === student.seatId);
        const plan = allPlans.find((p) => p.id === student.membershipPlanId) || {
          price: fee.baseFee || 800,
          durationMonths: fee.planDuration || 1,
        };
        const duration = Number(fee.planDuration) || Number(plan.durationMonths) || 1;
        const baseFee = Number(fee.baseFee) || Number(plan.price) || 800;
        const discount = fee.discountAmount !== undefined ? Number(fee.discountAmount) : (Number(student.discountAmount) || 0);

        const { charges: addonCharges, total: addonTotal } = calculateSeatAddonCharges(
          seat?.addons,
          activeAddonsList,
          duration
        );

        // Check if addonCharges need updating
        const currentAddonKeys = Object.keys(fee.addonCharges || {});
        const newAddonKeys = Object.keys(addonCharges);
        const needsAddonSync =
          currentAddonKeys.length !== newAddonKeys.length ||
          newAddonKeys.some((k) => fee.addonCharges?.[k] !== addonCharges[k]);

        if (needsAddonSync) {
          const newAmount = Math.max(0, baseFee + addonTotal - discount);
          const updatedPayload = {
            baseFee,
            discountAmount: discount,
            addonCharges,
            amount: newAmount,
          };
          updateDocument(COLLECTIONS.FEES, fee.id, updatedPayload).catch(console.warn);
          return { ...fee, ...updatedPayload };
        }

        return fee;
      })
    );

    // 2. Create missing monthly fees for active students
    const missingStudents = activeStudents.filter((student) => {
      return !updatedCurrentFees.some((f) => f.studentId === student.id && f.month === currentMonth);
    });

    if (missingStudents.length === 0) return updatedCurrentFees;

    const newFeePromises = [];
    const newFeeRecords = [];

    for (const student of missingStudents) {
      const plan = allPlans.find((p) => p.id === student.membershipPlanId);
      const seat = allSeats.find((s) => s.id === student.seatId);
      const baseFee = plan ? Number(plan.price) : 800;
      const discount = Number(student.discountAmount) || 0;
      const duration = Number(plan?.durationMonths) || 1;

      const { charges: addonCharges, total: addonTotal } = calculateSeatAddonCharges(
        seat?.addons,
        activeAddonsList,
        duration
      );

      // Calculate start and end date from joining date
      let startDate = new Date();
      if (student.joinDate) {
        const jDate = student.joinDate.toDate ? student.joinDate.toDate() : new Date(student.joinDate);
        if (!isNaN(jDate.getTime())) startDate = jDate;
      } else if (student.membershipStart) {
        const mStart = student.membershipStart.toDate ? student.membershipStart.toDate() : new Date(student.membershipStart);
        if (!isNaN(mStart.getTime())) startDate = mStart;
      }

      const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + duration, startDate.getDate());

      const dueDate = new Date();
      dueDate.setDate(10);
      if (dueDate < new Date()) dueDate.setMonth(dueDate.getMonth() + 1);

      const feePayload = {
        studentId: student.id,
        amount: Math.max(0, baseFee + addonTotal - discount),
        baseFee,
        discountAmount: discount,
        addonCharges,
        dueDate: dueDate.toISOString(),
        paidDate: null,
        status: 'pending',
        month: currentMonth,
        paymentMode: '',
        notes: '',
        planId: plan?.id || '',
        planName: plan?.name || 'Standard Monthly Plan',
        planDuration: duration,
        periodStart: startDate.toISOString(),
        periodEnd: endDate.toISOString(),
      };

      const docId = `fee_${student.id}_${currentMonth.replace('-', '_')}`;
      newFeePromises.push(createDocument(COLLECTIONS.FEES, feePayload, docId));
      newFeeRecords.push({ id: docId, ...feePayload });
    }

    try {
      await Promise.all(newFeePromises);
    } catch (e) {
      console.warn('Auto-sync monthly dues background warning:', e);
    }

    return [...updatedCurrentFees, ...newFeeRecords];
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [feeDocs, stuDocs, secDocs, seatDocs, planDocs, addonDocs] = await Promise.all([
        fetchCollectionData(COLLECTIONS.FEES),
        fetchCollectionData(COLLECTIONS.STUDENTS),
        fetchCollectionData(COLLECTIONS.SECTIONS),
        fetchCollectionData(COLLECTIONS.SEATS),
        fetchCollectionData(COLLECTIONS.MEMBERSHIP_PLANS),
        fetchCollectionData(COLLECTIONS.ADDON_PRICING),
      ]);

      const activeStudents = stuDocs.filter((s) => s.status === 'active');
      const syncedFees = await autoSyncMonthlyDues(
        feeDocs,
        activeStudents,
        planDocs,
        seatDocs,
        addonDocs
      );

      setFees(syncedFees);
      setStudents(stuDocs);
      setSections(secDocs);
      setSeats(seatDocs);
      setPlans(planDocs);
      setAddonPricing(addonDocs);
    } catch (err) {
      console.error('Error fetching fees data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCollectFee = async (paymentData) => {
    if (!collectFee) return;

    // 1. Update Fee Record
    await updateDocument(COLLECTIONS.FEES, collectFee.id, {
      status: 'paid',
      paidDate: new Date().toISOString(),
      paymentMode: paymentData.paymentMode,
      notes: paymentData.notes,
      amount: paymentData.amount,
      baseFee: paymentData.baseFee,
      discountAmount: paymentData.discountAmount || 0,
      addonCharges: paymentData.addonCharges,
      planName: paymentData.planName,
      planDuration: paymentData.planDuration,
      periodStart: paymentData.periodStart,
      periodEnd: paymentData.periodEnd,
    });

    // 2. Automatically Renew Student's Membership Validity Cycle
    if (collectFee.studentId && paymentData.periodEnd) {
      await updateDocument(COLLECTIONS.STUDENTS, collectFee.studentId, {
        membershipPlanId: paymentData.planId,
        membershipStart: paymentData.periodStart,
        membershipEnd: paymentData.periodEnd,
        hasPaidBefore: true,
        status: 'active',
      });
    }

    setCollectFee(null);
    await fetchData();
  };

  const currentMonth = getMonthYear();
  const monthFees = fees.filter((f) => f.month === (selectedMonth || currentMonth));
  const totalRevenue = fees.filter((f) => f.status === 'paid').reduce((s, f) => s + (Number(f.amount) || 0), 0);
  const monthCollected = monthFees.filter((f) => f.status === 'paid').reduce((s, f) => s + (Number(f.amount) || 0), 0);
  const pendingCount = monthFees.filter((f) => f.status !== 'paid').length;

  const collectFeeStudent = collectFee ? students.find((s) => s.id === collectFee.studentId) : null;
  const collectFeePlan = collectFeeStudent ? plans.find((p) => p.id === collectFeeStudent.membershipPlanId) : null;
  const collectFeeSeat = collectFeeStudent ? seats.find((s) => s.id === collectFeeStudent.seatId) : null;

  const receiptStudent = receiptFee ? students.find((s) => s.id === receiptFee.studentId) : null;
  const receiptSection = receiptStudent ? sections.find((s) => s.id === receiptStudent.sectionId) : null;
  const receiptSeat = receiptStudent ? seats.find((s) => s.id === receiptStudent.seatId) : null;

  if (loading) {
    return (
      <Layout title="Fee Management">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Fee Management">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Fee & Subscription Management</h1>
            <p className="text-gray-500 text-xs sm:text-sm mt-0.5">
              Automatic monthly fee tracking, renewals, discounts & instant WhatsApp PDF receipts
            </p>
          </div>

          <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Auto-Synced Monthly Dues</span>
          </div>
        </div>

        {/* 3 Overview Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl shadow-xs p-4.5 flex items-center gap-3.5 border border-slate-200/80">
            <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-700">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Total Lifetime Revenue</p>
              <p className="text-xl font-black text-slate-900">{formatCurrency(totalRevenue)}</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xs p-4.5 flex items-center gap-3.5 border border-slate-200/80">
            <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-700">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Collected ({selectedMonth || currentMonth})</p>
              <p className="text-xl font-black text-slate-900">{formatCurrency(monthCollected)}</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xs p-4.5 flex items-center gap-3.5 border border-slate-200/80">
            <div className="w-12 h-12 bg-rose-100 rounded-2xl flex items-center justify-center text-rose-700">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Pending Dues</p>
              <p className="text-xl font-black text-slate-900">{pendingCount} students</p>
            </div>
          </div>
        </div>

        <FeeTracker
          fees={fees}
          students={students}
          sections={sections}
          seats={seats}
          onCollect={setCollectFee}
          onViewReceipt={setReceiptFee}
          selectedMonth={selectedMonth}
          onMonthChange={setSelectedMonth}
        />
      </div>

      <CollectFeeModal
        isOpen={!!collectFee}
        onClose={() => setCollectFee(null)}
        onSubmit={handleCollectFee}
        student={collectFeeStudent}
        fee={collectFee}
        plan={collectFeePlan}
        plans={plans}
        seat={collectFeeSeat}
        addonPricing={addonPricing}
      />

      <FeeReceipt
        isOpen={!!receiptFee}
        onClose={() => setReceiptFee(null)}
        fee={receiptFee}
        student={receiptStudent}
        section={receiptSection}
        seat={receiptSeat}
      />
    </Layout>
  );
}
