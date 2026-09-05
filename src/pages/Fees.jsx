import { useState, useEffect } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
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
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const targetStudentId = location.state?.collectStudentId || searchParams.get('studentId');

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
  const autoSyncMonthlyDues = async (currentFees, activeStudents, allPlans, allSeats, allAddons) => {
    const currentMonth = getMonthYear();
    const activeAddonsList = allAddons && allAddons.length > 0 ? allAddons : getStoredAddons();
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // 1. Sync existing pending fees to make sure seat addons (like Locker) and durations are accurately reflected
    const updatedCurrentFeesRaw = await Promise.all(
      currentFees.map(async (fee) => {
        const student = activeStudents.find((s) => s.id === fee.studentId);
        if (!student) {
          if (fee.status === 'pending') {
            try { await removeDocument(COLLECTIONS.FEES, fee.id); } catch (e) {}
            return null;
          }
          return fee;
        }

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

        if (needsAddonSync && fee.status !== 'paid') {
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

    const updatedCurrentFees = updatedCurrentFeesRaw.filter(Boolean);

    // 2. Create missing dues ONLY for active students whose membership has truly expired
    const missingStudents = activeStudents.filter((student) => {
      const studentFees = updatedCurrentFees.filter((f) => f.studentId === student.id);

      // Check if student already has a pending fee bill
      const hasPendingFee = studentFees.some((f) => f.status === 'pending');
      if (hasPendingFee) return false;

      // Check if student has an active paid fee covering current date or future
      const hasActivePaidMembership = studentFees.some((f) => {
        if (f.status !== 'paid') return false;
        if (f.periodEnd) {
          const pEnd = f.periodEnd.toDate ? f.periodEnd.toDate() : new Date(f.periodEnd);
          return pEnd >= today;
        }
        return false;
      });
      if (hasActivePaidMembership) return false;

      // Check student.membershipEnd directly
      if (student.membershipEnd) {
        const mEnd = student.membershipEnd.toDate ? student.membershipEnd.toDate() : new Date(student.membershipEnd);
        mEnd.setHours(0, 0, 0, 0);
        if (mEnd >= today) {
          return false; // Student is still actively valid under their multi-month plan
        }
      }

      // Check if student already has a fee for currentMonth
      const hasCurrentMonthFee = studentFees.some((f) => f.month === currentMonth);
      if (hasCurrentMonthFee) return false;

      return true;
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

      // Calculate start date (continuation from previous membershipEnd or joinDate)
      let startDate = new Date();
      if (student.membershipEnd) {
        const mEnd = student.membershipEnd.toDate ? student.membershipEnd.toDate() : new Date(student.membershipEnd);
        if (!isNaN(mEnd.getTime())) startDate = mEnd;
      } else if (student.joinDate) {
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

  // Pre-select and open Collect Fee modal when routed from Students Directory
  useEffect(() => {
    if (targetStudentId && students.length > 0 && fees.length > 0) {
      const targetStudent = students.find((s) => s.id === targetStudentId);
      if (targetStudent) {
        const studentPendingFee = fees.find((f) => f.studentId === targetStudentId && f.status === 'pending');
        if (studentPendingFee) {
          setCollectFee(studentPendingFee);
        } else {
          const targetPlan = plans.find((p) => p.id === targetStudent.membershipPlanId) || plans[0] || { price: 800, durationMonths: 1 };
          const dur = Number(targetPlan?.durationMonths) || 1;
          const base = Number(targetPlan?.price) || 800;
          const disc = Number(targetStudent.discountAmount) || 0;
          const targetSeat = seats.find((s) => s.id === targetStudent.seatId);
          const { charges, total } = calculateSeatAddonCharges(targetSeat?.addons, addonPricing, dur);

          const tempFee = {
            id: `fee_${targetStudent.id}_${getMonthYear().replace('-', '_')}`,
            studentId: targetStudent.id,
            amount: Math.max(0, base + total - disc),
            baseFee: base,
            discountAmount: disc,
            addonCharges: charges,
            month: getMonthYear(),
            planId: targetPlan?.id || '',
            planName: targetPlan?.name || 'Standard Monthly Plan',
            planDuration: dur,
            periodStart: targetStudent.membershipEnd || targetStudent.joinDate || new Date().toISOString(),
          };
          setCollectFee(tempFee);
        }
      }
    }
  }, [targetStudentId, students, fees]);

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
  const todayStr = new Date().toISOString().split('T')[0];

  // Daily & Monthly Operational Calculations
  const todayPaidFees = fees.filter(
    (f) => f.status === 'paid' && f.paidDate && f.paidDate.startsWith(todayStr)
  );
  const todayCollected = todayPaidFees.reduce((s, f) => s + (Number(f.amount) || 0), 0);
  const todayCount = todayPaidFees.length;

  const monthFees = fees.filter((f) => f.month === (selectedMonth || currentMonth));
  const monthPaidFees = monthFees.filter((f) => f.status === 'paid');
  const monthCollected = monthPaidFees.reduce((s, f) => s + (Number(f.amount) || 0), 0);
  const monthPaidCount = monthPaidFees.length;

  const monthPendingFees = monthFees.filter((f) => f.status !== 'paid');
  const monthPendingAmount = monthPendingFees.reduce((s, f) => s + (Number(f.amount) || 0), 0);
  const monthPendingCount = monthPendingFees.length;

  const totalActiveStudents = students.filter((s) => s.status === 'active').length;
  const collectionPercentage =
    monthFees.length > 0 ? Math.round((monthPaidCount / monthFees.length) * 100) : 0;

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
              Daily collections, monthly dues tracking, discounts & instant WhatsApp PDF receipts
            </p>
          </div>

          <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Auto-Synced Monthly Dues</span>
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
