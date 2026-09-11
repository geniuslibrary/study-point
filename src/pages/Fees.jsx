import { useState, useEffect } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import FeeTracker from '../components/fees/FeeTracker';
import CollectFeeModal from '../components/fees/CollectFeeModal';
import FeeReceipt from '../components/fees/FeeReceipt';
import StudentLeftOverdueModal from '../components/fees/StudentLeftOverdueModal';
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
import { COLLECTIONS, SEAT_STATUS } from '../utils/constants';
import { formatCurrency, getMonthYear, calculateSeatAddonCharges, getStoredAddons, extractAllFeePayments } from '../utils/helpers';
import {
  fetchCollectionData,
  createDocument,
  updateDocument,
  removeDocument,
} from '../firebase/storageService';
import { seedOneYearDummyData } from '../utils/seedData';

export default function Fees() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const targetStudentId = location.state?.collectStudentId || searchParams.get('studentId');
  const targetStatusFilter = location.state?.statusFilter || searchParams.get('status') || 'all';

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
  const [leftConfirmTarget, setLeftConfirmTarget] = useState(null);
  const [markingLeftLoading, setMarkingLeftLoading] = useState(false);
  const [seedingLoading, setSeedingLoading] = useState(false);

  const handleLoadDummyData = async () => {
    if (!window.confirm('Kya aap Fees test karne ke liye Demo / Dummy data load karna chahte hain? Isse Paid, Ending Soon, Expired, aur Overdue sabhi tabs ka test data load ho jayega.')) {
      return;
    }
    setSeedingLoading(true);
    try {
      await seedOneYearDummyData();
      await fetchData();
      alert('Demo Data Successfully Load Ho Gaya! Ab aap Paid, Ending Soon, Expired, aur Overdue sabhi tabs test kar sakte hain.');
    } catch (err) {
      console.error('Error seeding dummy data from fees:', err);
      alert('Data load karne mein dikkat aayi: ' + (err?.message || err));
    } finally {
      setSeedingLoading(false);
    }
  };

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

        // Do not overwrite extension fees with admission monthly rates
        const isExtensionFee =
          Boolean(fee.isExtension) ||
          fee.planName?.toLowerCase().includes('extension') ||
          fee.receiptNumber?.startsWith('EXT-') ||
          fee.notes?.toLowerCase().includes('extended');

        if (isExtensionFee) {
          // If partial payment was made (paidAmount > 0), dueAmount is the balance.
          // If no payment was made yet (paidAmount === 0), it's a pending bill (dueAmount: 0).
          const isPartial = fee.status === 'partial' && Number(fee.paidAmount) > 0 && Number(fee.dueAmount) > 0;
          const effDue = isPartial ? Number(fee.dueAmount) : 0;
          return { ...fee, dueAmount: effDue };
        }

        const seat = allSeats.find((s) => s.id === student.seatId);
        const isDay = Boolean(
          student.isDayBased ||
          student.membershipPlanId === 'custom_days' ||
          fee.isDayBased ||
          fee.durationUnit === 'days' ||
          student.durationUnit === 'days'
        );

        const plan = allPlans.find((p) => p.id === (fee.planId || student.membershipPlanId));
        const durationDays = isDay
          ? (Number(student.customDays) || Number(student.durationDays) || Number(fee.durationDays) || Number(plan?.durationDays) || 10)
          : null;
        const duration = isDay ? durationDays : (Number(fee.planDuration) || Number(plan?.durationMonths) || 1);

        const correctBaseFee = isDay
          ? (Number(student.customFeeAmount) || Number(student.planPrice) || Number(plan?.price) || (fee.baseFee && fee.baseFee < 800 ? Number(fee.baseFee) : 400))
          : (plan ? Number(plan.price) : (Number(fee.baseFee) || 800));

        const baseFee = fee.status === 'pending' ? correctBaseFee : (Number(fee.baseFee) || correctBaseFee);
        const discount = fee.discountAmount !== undefined ? Number(fee.discountAmount) : (Number(student.discountAmount) || 0);

        const addonDurationFactor = isDay ? Math.max(1, Math.round(durationDays / 30)) : duration;
        const { charges: addonCharges, total: addonTotal } = calculateSeatAddonCharges(
          seat?.addons,
          activeAddonsList,
          addonDurationFactor
        );

        const newAmount = Math.max(0, baseFee + addonTotal - discount);

        // Check if addonCharges or baseFee or validity dates need updating for pending fees
        const currentAddonKeys = Object.keys(fee.addonCharges || {});
        const newAddonKeys = Object.keys(addonCharges);
        const needsAddonSync =
          currentAddonKeys.length !== newAddonKeys.length ||
          newAddonKeys.some((k) => fee.addonCharges?.[k] !== addonCharges[k]);

        if (fee.status === 'pending') {
          const newPeriodEnd = (isDay && student.membershipEnd) ? student.membershipEnd : fee.periodEnd;
          const newPeriodStart = (isDay && (student.membershipStart || student.joinDate)) ? (student.membershipStart || student.joinDate) : fee.periodStart;
          const newPlanName = isDay
            ? (student.planName || `${durationDays} Days Plan`)
            : (plan?.name || fee.planName || 'Standard Monthly Plan');
          const newPlanId = plan?.id || student.membershipPlanId || (isDay ? 'custom_days' : (fee.planId || ''));

          if (
            fee.baseFee !== baseFee ||
            fee.amount !== newAmount ||
            needsAddonSync ||
            fee.isDayBased !== isDay ||
            (newPeriodEnd && fee.periodEnd !== newPeriodEnd)
          ) {
            const updatedPayload = {
              baseFee,
              discountAmount: discount,
              addonCharges,
              amount: newAmount,
              isDayBased: isDay,
              durationUnit: isDay ? 'days' : 'months',
              durationDays: isDay ? durationDays : null,
              durationMonths: isDay ? null : duration,
              planDuration: duration,
              planName: newPlanName,
              planId: newPlanId,
              periodStart: newPeriodStart || fee.periodStart,
              periodEnd: newPeriodEnd || fee.periodEnd,
            };
            updateDocument(COLLECTIONS.FEES, fee.id, updatedPayload).catch(console.warn);
            return { ...fee, ...updatedPayload };
          }
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
          return false; // Student is still actively valid under their plan
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
      const isDay = Boolean(
        student.isDayBased ||
        student.membershipPlanId === 'custom_days' ||
        student.durationUnit === 'days'
      );
      const plan = allPlans.find((p) => p.id === student.membershipPlanId);
      const seat = allSeats.find((s) => s.id === student.seatId);
      const durationDays = isDay
        ? (Number(student.customDays) || Number(student.durationDays) || Number(plan?.durationDays) || 10)
        : null;
      const duration = isDay ? durationDays : (Number(plan?.durationMonths) || 1);
      const baseFee = isDay
        ? (Number(student.customFeeAmount) || Number(student.planPrice) || Number(plan?.price) || 400)
        : (plan ? Number(plan.price) : 800);
      const discount = Number(student.discountAmount) || 0;

      const addonDurationFactor = isDay ? Math.max(1, Math.round(durationDays / 30)) : duration;
      const { charges: addonCharges, total: addonTotal } = calculateSeatAddonCharges(
        seat?.addons,
        activeAddonsList,
        addonDurationFactor
      );

      // Calculate start date (continuation from previous membershipEnd or joinDate)
      let startDate = new Date();
      if (student.membershipEnd) {
        const mEnd = student.membershipEnd.toDate ? student.membershipEnd.toDate() : new Date(student.membershipEnd);
        if (!isNaN(mEnd.getTime())) {
          // If previous membership expired in the past, roll over start date to today
          startDate = mEnd < today ? new Date(today) : mEnd;
        }
      } else if (student.membershipStart) {
        const mStart = student.membershipStart.toDate ? student.membershipStart.toDate() : new Date(student.membershipStart);
        if (!isNaN(mStart.getTime())) startDate = mStart < today ? new Date(today) : mStart;
      } else if (student.joinDate) {
        const jDate = student.joinDate.toDate ? student.joinDate.toDate() : new Date(student.joinDate);
        if (!isNaN(jDate.getTime())) startDate = jDate < today ? new Date(today) : jDate;
      }

      let endDate;
      if (isDay) {
        endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + durationDays);
      } else {
        endDate = new Date(startDate.getFullYear(), startDate.getMonth() + duration, startDate.getDate());
      }

      const dueDate = new Date(endDate);

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
        planId: plan?.id || (isDay ? 'custom_days' : ''),
        planName: isDay ? (student.planName || `${durationDays} Days Plan`) : (plan?.name || 'Standard Monthly Plan'),
        planDuration: duration,
        durationUnit: isDay ? 'days' : 'months',
        durationDays: isDay ? durationDays : null,
        durationMonths: isDay ? null : duration,
        isDayBased: isDay,
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
        const studentUnpaidFees = fees.filter(
          (f) => f.studentId === targetStudentId && (f.status === 'partial' || f.status === 'pending' || Number(f.dueAmount) > 0)
        );
        const studentPendingFee = studentUnpaidFees.length > 0
          ? studentUnpaidFees.sort((a, b) => new Date(b.createdAt || b.paidDate || b.month || 0) - new Date(a.createdAt || a.paidDate || a.month || 0))[0]
          : null;

        if (studentPendingFee) {
          setCollectFee(studentPendingFee);
        } else {
          const isDay = Boolean(
            targetStudent.isDayBased ||
            targetStudent.membershipPlanId === 'custom_days' ||
            targetStudent.durationUnit === 'days'
          );
          const targetPlan = plans.find((p) => p.id === targetStudent.membershipPlanId);
          const durDays = isDay
            ? (Number(targetStudent.customDays) || Number(targetStudent.durationDays) || Number(targetPlan?.durationDays) || 10)
            : null;
          const dur = isDay ? durDays : (Number(targetPlan?.durationMonths) || 1);
          const base = isDay
            ? (Number(targetStudent.customFeeAmount) || Number(targetStudent.planPrice) || Number(targetPlan?.price) || 400)
            : (Number(targetPlan?.price) || 800);
          const disc = Number(targetStudent.discountAmount) || 0;
          const targetSeat = seats.find((s) => s.id === targetStudent.seatId);
          const durFactor = isDay ? Math.max(1, Math.round(durDays / 30)) : dur;
          const { charges, total } = calculateSeatAddonCharges(targetSeat?.addons, addonPricing, durFactor);

          // For renewal when student is already active and fully paid
          const hasActiveExpiry = targetStudent.membershipEnd && (!targetStudent.dueFeeAmount || Number(targetStudent.dueFeeAmount) <= 0);
          let periodStart = new Date().toISOString();
          if (hasActiveExpiry) {
            const prevEnd = targetStudent.membershipEnd.toDate ? targetStudent.membershipEnd.toDate() : new Date(targetStudent.membershipEnd);
            if (!isNaN(prevEnd.getTime()) && prevEnd > new Date()) {
              periodStart = prevEnd.toISOString();
            }
          } else if (targetStudent.membershipStart) {
            periodStart = targetStudent.membershipStart;
          } else if (targetStudent.joinDate) {
            periodStart = targetStudent.joinDate;
          }

          let periodEnd;
          const d = new Date(periodStart);
          if (isDay) d.setDate(d.getDate() + durDays);
          else d.setMonth(d.getMonth() + dur);
          periodEnd = d.toISOString();

          const tempFee = {
            id: `fee_${targetStudent.id}_${getMonthYear().replace('-', '_')}`,
            studentId: targetStudent.id,
            amount: Math.max(0, base + total - disc),
            baseFee: base,
            discountAmount: disc,
            addonCharges: charges,
            month: getMonthYear(),
            planId: targetPlan?.id || (isDay ? 'custom_days' : ''),
            planName: targetStudent.planName || targetPlan?.name || (isDay ? `${durDays} Days Plan` : 'Standard Monthly Plan'),
            planDuration: dur,
            isDayBased: isDay,
            durationDays: durDays,
            durationMonths: isDay ? null : dur,
            durationUnit: isDay ? 'days' : 'months',
            isCustomDays: targetStudent.membershipPlanId === 'custom_days' || targetStudent.isCustomDays,
            customDays: durDays,
            customFeeAmount: base,
            periodStart: periodStart,
            periodEnd: periodEnd,
          };
          setCollectFee(tempFee);
        }
      }
    }
  }, [targetStudentId, students, fees]);

  const handleCollectFee = async (paymentData) => {
    if (!collectFee) return;

    try {
      const receiptNum = `REC-${Date.now().toString().slice(-6)}`;
      const paymentEntry = {
        id: `pay_${Date.now()}`,
        amount: paymentData.paidNow,
        paidDate: new Date().toISOString(),
        paymentMode: paymentData.paymentMode || 'cash',
        splitDetails: paymentData.splitDetails || null,
        notes: paymentData.notes || '',
        receiptNumber: receiptNum,
      };

      const existingFee = fees.find((f) => f.id === collectFee.id);
      const studentObj = students.find((s) => s.id === collectFee.studentId);

      // Synthesize previous payment if payments array was missing but money was previously paid
      let previousPayments = [];
      if (Array.isArray(collectFee?.payments) && collectFee.payments.length > 0) {
        previousPayments = [...collectFee.payments];
      } else if (Number(collectFee?.paidAmount) > 0 || Number(collectFee?.paidNow) > 0) {
        const prevAmt = Number(collectFee.paidAmount) || Number(collectFee.paidNow);
        previousPayments = [{
          id: `pay_prev_${collectFee.id}`,
          amount: prevAmt,
          paidDate: collectFee.paidDate || collectFee.date || collectFee.createdAt || new Date().toISOString(),
          paymentMode: collectFee.paymentMode || 'cash',
          splitDetails: collectFee.splitDetails || null,
          notes: collectFee.notes || 'Initial Payment',
          receiptNumber: collectFee.receiptNumber || 'REC-INIT',
          collectedBy: 'Admin',
        }];
      }

      const updatedPayments = [...previousPayments, paymentEntry];

      const feeMonth =
        collectFee.month ||
        (paymentData.periodStart ? String(paymentData.periodStart).slice(0, 7) : '') ||
        (existingFee?.month || getMonthYear());

      const todayIso = new Date().toISOString();
      const todayDate = todayIso.split('T')[0];

      const feePayload = {
        studentId: collectFee.studentId,
        studentName: studentObj?.name || collectFee.studentName || '',
        studentPhone: studentObj?.phone || collectFee.studentPhone || '',
        seatId: studentObj?.seatId || collectFee.seatId || '',
        sectionId: studentObj?.sectionId || collectFee.sectionId || '',
        status: paymentData.status || (paymentData.dueAmount > 0 ? 'partial' : 'paid'),
        date: existingFee?.date || collectFee.date || todayDate,
        paidDate: todayIso,
        month: feeMonth,
        paymentMode: paymentData.paymentMode || 'cash',
        splitDetails: paymentData.splitDetails || null,
        notes: paymentData.notes || '',
        amount: paymentData.amount,
        paidAmount: paymentData.paidAmount,
        paidNow: paymentData.paidNow,
        dueAmount: paymentData.dueAmount || 0,
        payments: updatedPayments,
        baseFee: paymentData.baseFee,
        discountAmount: paymentData.discountAmount || 0,
        addonCharges: paymentData.addonCharges || {},
        includedCharges: paymentData.includedCharges || {},
        planFeatures: paymentData.planFeatures || [],
        planName: paymentData.planName,
        planDuration: paymentData.planDuration,
        durationUnit: paymentData.durationUnit || (paymentData.isDayBased ? 'days' : 'months'),
        durationDays: paymentData.durationDays || null,
        durationMonths: paymentData.durationMonths || null,
        isDayBased: !!paymentData.isDayBased,
        periodStart: paymentData.periodStart,
        periodEnd: paymentData.periodEnd,
        receiptNumber: receiptNum,
        collectedBy: 'Admin',
      };

      if (existingFee) {
        await updateDocument(COLLECTIONS.FEES, collectFee.id, feePayload);
      } else {
        await createDocument(COLLECTIONS.FEES, feePayload, collectFee.id);
      }

      // 2. Automatically Renew Student's Membership Validity Cycle
      if (collectFee.studentId && paymentData.periodEnd) {
        await updateDocument(COLLECTIONS.STUDENTS, collectFee.studentId, {
          membershipPlanId: paymentData.planId,
          membershipStart: paymentData.periodStart,
          membershipEnd: paymentData.periodEnd,
          hasPaidBefore: true,
          status: 'active',
          planPrice: paymentData.baseFee,
          discountAmount: paymentData.discountAmount || 0,
          planName: paymentData.planName,
          isDayBased: !!paymentData.isDayBased,
          durationDays: paymentData.durationDays || null,
          durationMonths: paymentData.durationMonths || null,
          dueFeeAmount: paymentData.dueAmount || 0,
        });
      }

      const recordedFee = { id: collectFee.id, ...feePayload };
      setCollectFee(null);
      await fetchData();

      // Show receipt modal so admin can view/print/WhatsApp bill
      setReceiptFee(recordedFee);
    } catch (err) {
      console.error('Error collecting fee in Fees page:', err);
      alert('Fee collect karne mein dikkat aayi: ' + (err?.message || err));
    }
  };

  const handleConfirmMarkLeft = async () => {
    if (!leftConfirmTarget?.student) return;
    setMarkingLeftLoading(true);
    try {
      const { student, fee } = leftConfirmTarget;

      // 1. Free physical seat if student has an assigned seat
      if (student.seatId) {
        const remainingStudents = students.filter(
          (s) => s.seatId === student.seatId && s.status === 'active' && s.id !== student.id
        );
        const hasFullDay = remainingStudents.some((s) => !s.shift || s.shift === 'full_day');
        const hasFirstHalf = remainingStudents.some((s) => s.shift === 'first_half');
        const hasSecondHalf = remainingStudents.some((s) => s.shift === 'second_half');

        let newStatus = SEAT_STATUS.AVAILABLE;
        if (hasFullDay || (hasFirstHalf && hasSecondHalf) || remainingStudents.length >= 2) {
          newStatus = SEAT_STATUS.OCCUPIED;
        } else if (remainingStudents.length > 0) {
          newStatus = SEAT_STATUS.PARTIALLY_OCCUPIED;
        }

        const primaryStudent = remainingStudents[0] || null;

        await updateDocument(COLLECTIONS.SEATS, student.seatId, {
          status: newStatus,
          studentId: primaryStudent ? primaryStudent.id : null,
        });
      }

      // 2. Mark student status as 'left'
      await updateDocument(COLLECTIONS.STUDENTS, student.id, {
        status: 'left',
        seatId: '',
        leftDate: new Date().toISOString(),
      });

      // 3. Mark fee notes if fee exists
      if (fee?.id) {
        await updateDocument(COLLECTIONS.FEES, fee.id, {
          notes: ((fee.notes || '') + ' | Student Left (Seat Freed)').trim(),
        });
      }

      setLeftConfirmTarget(null);
      await fetchData();
    } catch (err) {
      console.error('Error marking student left:', err);
      alert('Student ko left mark karne mein dikkat aayi. Kripya punah prayas karein.');
    } finally {
      setMarkingLeftLoading(false);
    }
  };

  const currentMonth = getMonthYear();
  const todayStr = new Date().toISOString().split('T')[0];

  // Daily & Monthly Operational Calculations
  const allFeePayments = extractAllFeePayments(fees, students);

  const todayPayments = allFeePayments.filter(
    (p) => p.paidDate && p.paidDate.startsWith(todayStr)
  );
  const todayCollected = todayPayments.reduce((s, p) => s + (Number(p.amount) || 0), 0);
  const todayCount = todayPayments.length;

  const targetMonth = selectedMonth || currentMonth;
  const monthPayments = allFeePayments.filter(
    (p) => (p.paidDate ? p.paidDate.startsWith(targetMonth) : p.month === targetMonth)
  );
  const monthCollected = monthPayments.reduce((s, p) => s + (Number(p.amount) || 0), 0);
  const monthPaidCount = monthPayments.length;

  const monthFees = fees.filter((f) => f.month === targetMonth);
  const monthPendingFees = monthFees.filter((f) => f.status === 'pending' || f.status === 'partial' || Number(f.dueAmount) > 0);
  const monthPendingAmount = monthPendingFees.reduce((s, f) => {
    if (f.dueAmount !== undefined && f.dueAmount !== null) {
      return s + (Number(f.dueAmount) || 0);
    }
    return s + (Number(f.amount) || 0);
  }, 0);
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

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleLoadDummyData}
              disabled={seedingLoading}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
              title="Test karne ke liye dummy data load karein"
            >
              {seedingLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
              ) : (
                <Sparkles className="w-3.5 h-3.5 text-white" />
              )}
              <span>{seedingLoading ? 'Loading Test Data...' : 'Load Dummy Data (Test)'}</span>
            </button>

            <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Auto-Synced Monthly Dues</span>
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
          onMarkLeft={(fee, student, seat) => setLeftConfirmTarget({ fee, student, seat })}
          selectedMonth={selectedMonth}
          onMonthChange={setSelectedMonth}
          initialStatusFilter={targetStatusFilter}
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

      <StudentLeftOverdueModal
        isOpen={!!leftConfirmTarget}
        onClose={() => setLeftConfirmTarget(null)}
        target={leftConfirmTarget}
        onConfirmLeft={handleConfirmMarkLeft}
        onRenew={() => {
          if (!leftConfirmTarget) return;
          const targetFee = leftConfirmTarget.fee;
          setLeftConfirmTarget(null);
          setCollectFee(targetFee);
        }}
        loading={markingLeftLoading}
      />
    </Layout>
  );
}
