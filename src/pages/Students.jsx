import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import Button from '../components/common/Button';
import ConfirmDialog from '../components/common/ConfirmDialog';
import StudentList from '../components/students/StudentList';
import StudentForm from '../components/students/StudentForm';
import StudentProfile from '../components/students/StudentProfile';
import ExtendMembershipModal from '../components/students/ExtendMembershipModal';
import CollectFeeModal from '../components/fees/CollectFeeModal';
import FeeReceipt from '../components/fees/FeeReceipt';
import { Plus, Loader2 } from 'lucide-react';
import { COLLECTIONS, SEAT_STATUS, STUDENT_STATUS } from '../utils/constants';
import {
  calculateSeatAddonCharges,
  getStoredAddons,
  formatDate,
  getMonthYear,
  checkDuplicatePhoneNumber,
} from '../utils/helpers';
import {
  getActiveTemplates,
  renderTemplate,
  DEFAULT_WHATSAPP_TEMPLATES,
} from '../utils/templateHelpers';
import { useAuth } from '../context/AuthContext';
import {
  fetchCollectionData,
  createDocument,
  updateDocument,
  removeDocument,
  getTenantItem,
} from '../firebase/storageService';

export default function Students() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const targetShift = location.state?.filterShift || queryParams.get('shift') || '';
  const targetExpiry = location.state?.filterExpiry || queryParams.get('expiry') || '';
  const { hasPermission } = useAuth();
  const [students, setStudents] = useState([]);
  const [sections, setSections] = useState([]);
  const [seats, setSeats] = useState([]);
  const [plans, setPlans] = useState([]);
  const [fees, setFees] = useState([]);
  const [addonPricing, setAddonPricing] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editData, setEditData] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [profileStudent, setProfileStudent] = useState(null);
  const [statusTarget, setStatusTarget] = useState(null);
  const [extendStudent, setExtendStudent] = useState(null);
  const [extendingLoading, setExtendingLoading] = useState(false);
  const [extensionReceiptFee, setExtensionReceiptFee] = useState(null);
  const [collectFeeRecord, setCollectFeeRecord] = useState(null);
  const [collectFeeStudent, setCollectFeeStudent] = useState(null);

  const canCreate = hasPermission('students', 'create');
  const canEdit = hasPermission('students', 'edit');
  const canDelete = hasPermission('students', 'delete');
  const canCollectFee = hasPermission('fees', 'create');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [stuDocs, secDocs, seatDocs, planDocs, feeDocs, addonDocs] = await Promise.all([
        fetchCollectionData(COLLECTIONS.STUDENTS),
        fetchCollectionData(COLLECTIONS.SECTIONS),
        fetchCollectionData(COLLECTIONS.SEATS),
        fetchCollectionData(COLLECTIONS.MEMBERSHIP_PLANS),
        fetchCollectionData(COLLECTIONS.FEES),
        fetchCollectionData(COLLECTIONS.ADDON_PRICING),
      ]);

      setStudents((stuDocs || []).filter((s) => !s.isDeleted));
      setSections(secDocs);
      setSeats(seatDocs);
      setPlans(planDocs);
      setFees(feeDocs);
      setAddonPricing(addonDocs && addonDocs.length > 0 ? addonDocs : getStoredAddons());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const [convertingVisitorId, setConvertingVisitorId] = useState(null);

  // Auto-open Add Student modal if redirected from Visit & Demo conversion
  useEffect(() => {
    if (location.state?.convertVisitor) {
      const v = location.state.convertVisitor;
      setConvertingVisitorId(v.visitorId || null);
      setEditData({
        name: v.name || '',
        phone: v.phone || '',
        sectionId: v.sectionId || '',
        seatId: v.seatId || '',
        shift: v.shift || 'full_day',
        notes: v.notes || '',
      });
      setShowForm(true);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const updateSeatStatusAfterChange = async (seatId, extraStudentData = null, removeStudentId = null) => {
    if (!seatId) return;

    let seatStudents = students.filter(
      (s) => s.seatId === seatId && s.status === 'active' && s.id !== removeStudentId
    );

    if (extraStudentData && extraStudentData.status === 'active') {
      const existingIdx = seatStudents.findIndex((s) => s.id === extraStudentData.id);
      if (existingIdx >= 0) {
        seatStudents[existingIdx] = extraStudentData;
      } else {
        seatStudents.push(extraStudentData);
      }
    }

    const hasFullDay = seatStudents.some((s) => !s.shift || s.shift === 'full_day');
    const hasFirstHalf = seatStudents.some((s) => s.shift === 'first_half');
    const hasSecondHalf = seatStudents.some((s) => s.shift === 'second_half');

    let newStatus = SEAT_STATUS.AVAILABLE;
    if (hasFullDay || (hasFirstHalf && hasSecondHalf) || seatStudents.length >= 2) {
      newStatus = SEAT_STATUS.OCCUPIED;
    } else if (seatStudents.length > 0) {
      newStatus = SEAT_STATUS.PARTIALLY_OCCUPIED;
    }

    const primaryStudent = seatStudents[0] || null;

    try {
      await updateDocument(COLLECTIONS.SEATS, seatId, {
        status: newStatus,
        studentId: primaryStudent ? primaryStudent.id : null,
      });
    } catch (e) {
      console.error('Failed to update seat status', e);
    }
  };

  const handleAddStudent = async (formData) => {
    // Prevent duplicate phone number across students (student to student only)
    const phoneDup = await checkDuplicatePhoneNumber({ phone: formData.phone, scope: 'student' });
    if (phoneDup) {
      alert(`⚠️ मोबाइल नंबर अमान्य:\n\n${phoneDup.message}`);
      return;
    }

    const plan = plans.find((p) => p.id === formData.membershipPlanId);
    const joinD = formData.joinDate ? new Date(formData.joinDate) : new Date();
    const membershipEnd = formData.membershipEnd
      ? new Date(formData.membershipEnd)
      : new Date(joinD.getFullYear(), joinD.getMonth() + (plan?.durationMonths || 1), joinD.getDate());
    const discount = formData.discountAmount === '' ? 0 : Number(formData.discountAmount) || 0;
    const baseFee = formData.planPrice !== undefined && formData.planPrice !== null ? Number(formData.planPrice) : (Number(plan?.price) || 800);
    const duration = plan?.durationMonths || 1;

    const newStudentData = {
      name: formData.name,
      phone: formData.phone,
      email: formData.email || '',
      photo: formData.photo || '',
      sectionId: formData.sectionId || '',
      seatId: formData.status === 'left' ? '' : (formData.seatId || ''),
      addons: formData.addons || {},
      shift: formData.shift || 'full_day',
      shiftTiming: formData.shiftTiming || 'Full Day',
      customStartTime: formData.customStartTime || '',
      customEndTime: formData.customEndTime || '',
      membershipPlanId: formData.membershipPlanId || '',
      isDayBased: !!formData.isDayBased,
      customDays: formData.customDays || null,
      customFeeAmount: formData.customFeeAmount || null,
      durationDays: formData.durationDays || null,
      durationMonths: formData.durationMonths || null,
      durationLabel: formData.durationLabel || null,
      planName: formData.planName || (plan?.name || 'Standard Plan'),
      discountAmount: discount,
      joinDate: joinD.toISOString(),
      membershipStart: joinD.toISOString(),
      membershipEnd: membershipEnd.toISOString(),
      planFeatures: formData.planFeatures || plan?.features || [],
      includedBenefits: formData.includedBenefits || plan?.features || [],
      status: formData.status || 'active',
      notes: formData.notes || '',
    };

    const docRecord = await createDocument(COLLECTIONS.STUDENTS, newStudentData);

    const planFeatures = formData.planFeatures || plan?.features || [];
    const { charges: addonCharges, total: addonTotal, includedCharges } = calculateSeatAddonCharges(
      formData.addons,
      addonPricing,
      duration,
      planFeatures
    );

    // If seat is allocated, also sync the selected hardware facilities onto the physical seat document
    if (newStudentData.seatId && formData.addons) {
      await updateDocument(COLLECTIONS.SEATS, newStudentData.seatId, {
        addons: formData.addons,
      });
    }

    // Auto-create initial fee record with discount & seat facilities (e.g. Locker) for this student
    if (newStudentData.status === 'active') {
      const monthStr = `${joinD.getFullYear()}-${String(joinD.getMonth() + 1).padStart(2, '0')}`;
      const feeDocId = `fee_${docRecord.id}_${monthStr.replace('-', '_')}`;
      const isDay = Boolean(newStudentData.isDayBased);
      const feeDurationDays = isDay ? (Number(newStudentData.durationDays) || Number(newStudentData.customDays) || 10) : null;
      await createDocument(
        COLLECTIONS.FEES,
        {
          studentId: docRecord.id,
          amount: Math.max(0, baseFee + addonTotal - discount),
          baseFee,
          discountAmount: discount,
          addonCharges,
          includedCharges: includedCharges || {},
          planFeatures,
          includedBenefits: planFeatures,
          dueDate: membershipEnd.toISOString(),
          paidDate: null,
          status: 'pending',
          month: monthStr,
          paymentMode: '',
          notes: '',
          planId: plan?.id || formData.membershipPlanId || (isDay ? 'custom_days' : ''),
          planName: formData.planName || (plan?.name || (isDay ? `${feeDurationDays} Days Plan` : 'Standard Plan')),
          planDuration: isDay ? feeDurationDays : duration,
          durationUnit: isDay ? 'days' : 'months',
          durationDays: isDay ? feeDurationDays : null,
          durationMonths: isDay ? null : duration,
          isDayBased: isDay,
          periodStart: joinD.toISOString(),
          periodEnd: membershipEnd.toISOString(),
        },
        feeDocId
      );
    }

    if (newStudentData.seatId) {
      await updateSeatStatusAfterChange(newStudentData.seatId, { id: docRecord.id, ...newStudentData });
    }

    // If converted from Visitor/Demo, mark visitor record as converted in database
    if (convertingVisitorId) {
      try {
        await updateDocument(COLLECTIONS.VISITORS, convertingVisitorId, {
          status: 'converted',
          convertedAt: new Date().toISOString(),
          studentId: docRecord.id,
        });
      } catch (err) {
        console.warn('Error marking visitor converted:', err);
      }
      setConvertingVisitorId(null);
    }

    await fetchData();
  };

  const handleEditStudent = async (formData) => {
    if (!editData) return;

    // Prevent duplicate phone number across students (student to student only)
    const phoneDup = await checkDuplicatePhoneNumber({ phone: formData.phone, excludeId: editData.id, scope: 'student' });
    if (phoneDup) {
      alert(`⚠️ मोबाइल नंबर अमान्य:\n\n${phoneDup.message}`);
      return;
    }

    // If seat changed or student marked as left, release old seat
    if (editData.seatId && (editData.seatId !== formData.seatId || formData.status === 'left')) {
      await updateSeatStatusAfterChange(editData.seatId, null, editData.id);
    }

    const joinD = formData.joinDate ? new Date(formData.joinDate) : new Date();
    const plan = plans.find((p) => p.id === formData.membershipPlanId);
    const membershipEnd = formData.membershipEnd
      ? new Date(formData.membershipEnd)
      : new Date(joinD.getFullYear(), joinD.getMonth() + (plan?.durationMonths || 1), joinD.getDate());
    const discount = formData.discountAmount === '' ? 0 : Number(formData.discountAmount) || 0;
    const baseFee = formData.planPrice !== undefined && formData.planPrice !== null ? Number(formData.planPrice) : (Number(plan?.price) || 800);
    const duration = plan?.durationMonths || 1;

    const updatedData = {
      name: formData.name,
      phone: formData.phone,
      email: formData.email || '',
      photo: formData.photo !== undefined ? formData.photo : (editData.photo || ''),
      sectionId: formData.status === 'left' ? '' : (formData.sectionId || ''),
      seatId: formData.status === 'left' ? '' : (formData.seatId || ''),
      addons: formData.addons || {},
      shift: formData.shift || 'full_day',
      shiftTiming: formData.shiftTiming || 'Full Day',
      customStartTime: formData.customStartTime || '',
      customEndTime: formData.customEndTime || '',
      membershipPlanId: formData.membershipPlanId || '',
      isDayBased: !!formData.isDayBased,
      customDays: formData.customDays || null,
      customFeeAmount: formData.customFeeAmount || null,
      durationDays: formData.durationDays || null,
      durationMonths: formData.durationMonths || null,
      durationLabel: formData.durationLabel || null,
      planName: formData.planName || (plan?.name || 'Standard Plan'),
      discountAmount: discount,
      joinDate: joinD.toISOString(),
      membershipStart: joinD.toISOString(),
      membershipEnd: membershipEnd.toISOString(),
      planFeatures: formData.planFeatures || plan?.features || [],
      includedBenefits: formData.includedBenefits || plan?.features || [],
      status: formData.status || 'active',
      notes: formData.notes || '',
    };

    await updateDocument(COLLECTIONS.STUDENTS, editData.id, updatedData);

    if (updatedData.seatId && formData.addons) {
      await updateDocument(COLLECTIONS.SEATS, updatedData.seatId, {
        addons: formData.addons,
      });
    }

    const editPlanFeatures = formData.planFeatures || plan?.features || [];
    const { charges: addonCharges, total: addonTotal, includedCharges } = calculateSeatAddonCharges(
      formData.addons,
      addonPricing,
      duration,
      editPlanFeatures
    );

    // Also update any pending fee records for this student to reflect new discount / plan / facilities
    const pendingStudentFee = fees.find((f) => f.studentId === editData.id && f.status === 'pending');
    if (pendingStudentFee) {
      const isDay = Boolean(updatedData.isDayBased);
      const feeDurationDays = isDay ? (Number(updatedData.durationDays) || Number(updatedData.customDays) || 10) : null;
      await updateDocument(COLLECTIONS.FEES, pendingStudentFee.id, {
        baseFee,
        discountAmount: discount,
        addonCharges,
        amount: Math.max(0, baseFee + addonTotal - discount),
        planId: plan?.id || formData.membershipPlanId || (isDay ? 'custom_days' : pendingStudentFee.planId),
        planName: formData.planName || plan?.name || pendingStudentFee.planName,
        planDuration: isDay ? feeDurationDays : duration,
        durationUnit: isDay ? 'days' : 'months',
        durationDays: isDay ? feeDurationDays : null,
        durationMonths: isDay ? null : duration,
        isDayBased: isDay,
        periodStart: joinD.toISOString(),
        periodEnd: membershipEnd.toISOString(),
        dueDate: membershipEnd.toISOString(),
      });
    }

    if (updatedData.seatId && updatedData.status === 'active') {
      await updateSeatStatusAfterChange(updatedData.seatId, { id: editData.id, ...updatedData });
    }

    setEditData(null);
    await fetchData();
  };

  const handleToggleStatus = async (student) => {
    const isCurrentlyActive = student.status === 'active';
    const newStatus = isCurrentlyActive ? 'left' : 'active';

    if (isCurrentlyActive && student.seatId) {
      // Free seat
      await updateSeatStatusAfterChange(student.seatId, null, student.id);
    }

    await updateDocument(COLLECTIONS.STUDENTS, student.id, {
      status: newStatus,
      seatId: newStatus === 'left' ? '' : student.seatId,
      leftDate: newStatus === 'left' ? new Date().toISOString() : null,
    });

    await fetchData();
  };

  const handleDeleteStudent = async () => {
    if (!deleteTarget) return;

    try {
      // 1. Free allocated seat if any
      if (deleteTarget.seatId) {
        await updateSeatStatusAfterChange(deleteTarget.seatId, null, deleteTarget.id);
      }

      // 2. Soft-delete: Mark isDeleted: true instead of removing document
      await updateDocument(COLLECTIONS.STUDENTS, deleteTarget.id, {
        isDeleted: true,
        status: 'inactive',
        seatId: '',
        deletedAt: new Date().toISOString(),
      });

      // 3. Optimistic local update
      setStudents((prev) => prev.filter((s) => s.id !== deleteTarget.id));
      setDeleteTarget(null);
      await fetchData();
    } catch (err) {
      console.error('Error soft-deleting student:', err);
    }
  };

  const handleExtendMembership = async ({
    studentId,
    extraDays,
    totalFee,
    feeAmount,
    paidNow,
    dueAmount,
    paymentType,
    paymentMode,
    splitDetails,
    newExpiryDate,
    notes,
    paymentRemarks,
    sendWhatsApp,
  }) => {
    setExtendingLoading(true);
    try {
      const st = students.find((s) => s.id === studentId);
      if (!st) return;

      const updatedDurationDays = (Number(st.durationDays) || 0) + extraDays;

      const finalTotalFee = Number(totalFee !== undefined ? totalFee : feeAmount) || 0;
      const finalPaidNow = Number(paidNow !== undefined ? paidNow : finalTotalFee) || 0;
      const finalDueAmount = Number(dueAmount !== undefined ? dueAmount : Math.max(0, finalTotalFee - finalPaidNow)) || 0;
      const existingDue = Number(st.dueFeeAmount) || 0;
      const updatedDueFeeAmount = existingDue + finalDueAmount;

      // 1. Update student
      await updateDocument(COLLECTIONS.STUDENTS, studentId, {
        membershipEnd: newExpiryDate,
        status: 'active',
        durationDays: updatedDurationDays,
        durationLabel: `${updatedDurationDays} Days Plan`,
        isDayBased: true,
        lastExtendedAt: new Date().toISOString(),
        lastExtendedDays: extraDays,
        dueFeeAmount: updatedDueFeeAmount,
      });

      // 2. If student has an assigned seat and was marked expired, reactivate seat occupancy
      if (st.seatId) {
        await updateSeatStatusAfterChange(st.seatId, {
          id: st.id,
          ...st,
          status: 'active',
          membershipEnd: newExpiryDate,
        });
      }

      // 3. Create fee record if total fee > 0
      let createdFeeDoc = null;

      if (finalTotalFee > 0) {
        const isFullyPaid = finalDueAmount <= 0;
        const feeStatus = isFullyPaid ? 'paid' : (finalPaidNow > 0 ? 'partial' : 'pending');
        const todayStr = new Date().toISOString();
        const todayDateOnly = todayStr.split('T')[0];
        const monthCode = todayDateOnly.slice(0, 7);
        const currentEnd = st.membershipEnd ? (st.membershipEnd.toDate ? st.membershipEnd.toDate() : new Date(st.membershipEnd)) : null;
        const now = new Date();
        const periodStart = (currentEnd && currentEnd > now) ? currentEnd.toISOString() : todayStr;
        const receiptNum = `EXT-${Date.now().toString().slice(-6)}`;

        const payments = finalPaidNow > 0 ? [{
          id: `pay_${Date.now()}`,
          amount: finalPaidNow,
          paidDate: todayStr,
          paymentMode: paymentMode || 'cash',
          splitDetails: splitDetails || null,
          notes: paymentRemarks || notes || '',
          receiptNumber: receiptNum,
          collectedBy: 'Admin',
        }] : [];

        const feePayload = {
          studentId: st.id,
          studentName: st.name,
          studentPhone: st.phone,
          sectionId: st.sectionId || '',
          seatId: st.seatId || '',
          planId: st.membershipPlanId || 'custom_days',
          planName: `Extension (+${extraDays} Days)`,
          amount: finalTotalFee,
          baseFee: finalTotalFee,
          paidAmount: finalPaidNow,
          paidNow: finalPaidNow,
          dueAmount: finalDueAmount,
          discountAmount: 0,
          addonCharges: {},
          status: feeStatus,
          paymentMode: finalPaidNow > 0 ? (paymentMode || 'cash') : 'due',
          splitDetails: finalPaidNow > 0 ? (splitDetails || null) : null,
          payments,
          paidDate: finalPaidNow > 0 ? todayStr : null,
          date: todayDateOnly,
          periodStart: periodStart,
          periodEnd: newExpiryDate,
          month: monthCode,
          isDayBased: true,
          durationDays: extraDays,
          durationUnit: 'days',
          planDuration: extraDays,
          receiptNumber: receiptNum,
          notes: notes || `Membership extended by ${extraDays} days`,
          paymentRemarks: paymentRemarks || '',
          collectedBy: 'Admin',
        };
        const docRecord = await createDocument(COLLECTIONS.FEES, feePayload);
        createdFeeDoc = { id: docRecord.id, ...feePayload };
      }

      // 4. WhatsApp Confirmation (if requested from extend modal)
      if (sendWhatsApp && st.phone) {
        const phoneClean = st.phone.replace(/[^0-9]/g, '');
        const phoneWithCountry = phoneClean.length === 10 ? `91${phoneClean}` : phoneClean;
        const newDateFormatted = formatDate(newExpiryDate);
        const currentTemplates = getActiveTemplates();
        const tpl =
          currentTemplates?.membershipExtended?.template ||
          DEFAULT_WHATSAPP_TEMPLATES.membershipExtended?.template;
        const assignedSeat = seats.find((s) => s.id === st.seatId);
        const feeDisplayStr = finalDueAmount > 0
          ? (finalPaidNow > 0 ? `₹${finalPaidNow} (Paid) • Due: ₹${finalDueAmount}` : `₹0 (Paid) • Due: ₹${finalDueAmount} (Unpaid)`)
          : String(finalPaidNow || finalTotalFee);
        const modeDisplayStr = finalPaidNow <= 0
          ? 'PAY LATER / DUE'
          : paymentMode === 'split' && splitDetails
            ? `SPLIT (Cash: ₹${splitDetails.cash || 0} + UPI: ₹${splitDetails.upi || 0})`
            : (paymentMode || 'cash').toUpperCase();

        const msg = renderTemplate(tpl, {
          student_name: st.name,
          library_name: getTenantItem('library_name', 'Study Point Library'),
          extra_days: extraDays,
          new_expiry_date: newDateFormatted,
          seat_number: assignedSeat?.seatNumber || '—',
          shift: st.shift || 'Full Day',
          fee_amount: feeDisplayStr,
          payment_mode: modeDisplayStr,
          phone: st.phone,
        });
        const waUrl = `https://api.whatsapp.com/send?phone=${phoneWithCountry}&text=${encodeURIComponent(msg)}`;
        window.open(waUrl, '_blank');
      }

      setExtendStudent(null);
      await fetchData();

      // 5. Automatically open receipt modal so user can view/print/download the extension bill
      if (createdFeeDoc) {
        setExtensionReceiptFee(createdFeeDoc);
      }
    } catch (err) {
      console.error('Error extending student membership:', err);
      alert('Membership extend karne mein dikkat aayi. Kripya punah prayas karein.');
    } finally {
      setExtendingLoading(false);
    }
  };

  const handleOpenCollectFee = (student) => {
    if (!student) return;
    // Find any existing active fee with pending dues (partial or pending)
    const studentUnpaidFees = fees.filter(
      (f) => f.studentId === student.id && (f.status === 'partial' || f.status === 'pending' || Number(f.dueAmount) > 0)
    );
    const studentPendingFee = studentUnpaidFees.length > 0
      ? studentUnpaidFees.sort((a, b) => new Date(b.createdAt || b.paidDate || b.month || 0) - new Date(a.createdAt || a.paidDate || a.month || 0))[0]
      : null;

    if (studentPendingFee) {
      setCollectFeeRecord(studentPendingFee);
      setCollectFeeStudent(student);
    } else {
      const isDay = Boolean(
        student.isDayBased ||
        student.membershipPlanId === 'custom_days' ||
        student.durationUnit === 'days'
      );
      const targetPlan = plans.find((p) => p.id === student.membershipPlanId);
      const durDays = isDay
        ? (Number(student.customDays) || Number(student.durationDays) || Number(targetPlan?.durationDays) || 10)
        : null;
      const dur = isDay ? durDays : (Number(targetPlan?.durationMonths) || 1);
      const base = isDay
        ? (Number(student.customFeeAmount) || Number(student.planPrice) || Number(targetPlan?.price) || 400)
        : (Number(targetPlan?.price) || 800);
      const disc = Number(student.discountAmount) || 0;
      const targetSeat = seats.find((s) => s.id === student.seatId);
      const durFactor = isDay ? Math.max(1, Math.round(durDays / 30)) : dur;
      const { charges, total } = calculateSeatAddonCharges(targetSeat?.addons, addonPricing, durFactor);

      // For renewal when student is already active and fully paid
      const hasActiveExpiry = student.membershipEnd && (!student.dueFeeAmount || Number(student.dueFeeAmount) <= 0);
      let periodStart = new Date().toISOString();
      if (hasActiveExpiry) {
        const prevEnd = student.membershipEnd.toDate ? student.membershipEnd.toDate() : new Date(student.membershipEnd);
        if (!isNaN(prevEnd.getTime()) && prevEnd > new Date()) {
          periodStart = prevEnd.toISOString();
        }
      } else if (student.membershipStart) {
        periodStart = student.membershipStart;
      } else if (student.joinDate) {
        periodStart = student.joinDate;
      }

      let periodEnd;
      const d = new Date(periodStart);
      if (isDay) d.setDate(d.getDate() + durDays);
      else d.setMonth(d.getMonth() + dur);
      periodEnd = d.toISOString();

      const currentMonth = getMonthYear();
      const tempFee = {
        id: `fee_${student.id}_${currentMonth.replace('-', '_')}`,
        studentId: student.id,
        amount: Math.max(0, base + total - disc),
        baseFee: base,
        discountAmount: disc,
        addonCharges: charges,
        month: currentMonth,
        planId: targetPlan?.id || (isDay ? 'custom_days' : ''),
        planName: student.planName || targetPlan?.name || (isDay ? `${durDays} Days Plan` : 'Standard Monthly Plan'),
        planDuration: dur,
        isDayBased: isDay,
        durationDays: durDays,
        durationMonths: isDay ? null : dur,
        durationUnit: isDay ? 'days' : 'months',
        isCustomDays: student.membershipPlanId === 'custom_days' || student.isCustomDays,
        customDays: durDays,
        customFeeAmount: base,
        periodStart: periodStart,
        periodEnd: periodEnd,
        status: 'pending',
      };
      setCollectFeeRecord(tempFee);
      setCollectFeeStudent(student);
    }
  };

  const handleCollectFee = async (paymentData) => {
    if (!collectFeeRecord || !collectFeeStudent) return;

    try {
      const feeId = collectFeeRecord.id;
      const existingFee = fees.find((f) => f.id === feeId);

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

      // Synthesize previous payment if payments array was missing but money was previously paid
      let previousPayments = [];
      if (Array.isArray(existingFee?.payments) && existingFee.payments.length > 0) {
        previousPayments = [...existingFee.payments];
      } else if (Number(existingFee?.paidAmount) > 0 || Number(existingFee?.paidNow) > 0) {
        const prevAmt = Number(existingFee.paidAmount) || Number(existingFee.paidNow);
        previousPayments = [{
          id: `pay_prev_${existingFee.id}`,
          amount: prevAmt,
          paidDate: existingFee.paidDate || existingFee.date || existingFee.createdAt || new Date().toISOString(),
          paymentMode: existingFee.paymentMode || 'cash',
          splitDetails: existingFee.splitDetails || null,
          notes: existingFee.notes || 'Initial Payment',
          receiptNumber: existingFee.receiptNumber || 'REC-INIT',
          collectedBy: 'Admin',
        }];
      }

      const updatedPayments = [...previousPayments, paymentEntry];

      const feeMonth =
        collectFeeRecord.month ||
        (paymentData.periodStart ? String(paymentData.periodStart).slice(0, 7) : '') ||
        (existingFee?.month || getMonthYear());

      const todayIso = new Date().toISOString();
      const todayDate = todayIso.split('T')[0];

      const updatedFeePayload = {
        studentId: collectFeeStudent.id,
        studentName: collectFeeStudent.name || '',
        studentPhone: collectFeeStudent.phone || '',
        seatId: collectFeeStudent.seatId || '',
        sectionId: collectFeeStudent.sectionId || '',
        status: paymentData.status || (paymentData.dueAmount > 0 ? 'partial' : 'paid'),
        date: existingFee?.date || todayDate,
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
        await updateDocument(COLLECTIONS.FEES, feeId, updatedFeePayload);
      } else {
        await createDocument(COLLECTIONS.FEES, updatedFeePayload, feeId);
      }

      if (paymentData.periodEnd) {
        await updateDocument(COLLECTIONS.STUDENTS, collectFeeStudent.id, {
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

      const recordedFee = { id: feeId, ...updatedFeePayload };
      setCollectFeeStudent(null);
      setCollectFeeRecord(null);

      await fetchData();

      // Show receipt modal so admin can view/print/WhatsApp bill
      setExtensionReceiptFee(recordedFee);
    } catch (err) {
      console.error('Error collecting fee in Students:', err);
      alert('Fee collect karne mein dikkat aayi: ' + (err?.message || err));
    }
  };

  const getStudentProfileDetails = (student) => {
    if (!student) return {};
    const section = sections.find((s) => s.id === student.sectionId);
    const seat = seats.find((s) => s.id === student.seatId);
    const studentFees = fees.filter((f) => f.studentId === student.id);
    const plan = plans.find((p) => p.id === student.membershipPlanId);

    return { section, seat, fees: studentFees, plan };
  };

  const profileDetails = getStudentProfileDetails(profileStudent);
  const extendStudentDetails = getStudentProfileDetails(extendStudent);

  if (loading) {
    return (
      <Layout title="Students">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Students Directory">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Student Directory</h1>
            <p className="text-gray-500 text-sm mt-0.5">
              Manage student admissions, shift timings, assigned seats & member profiles
            </p>
          </div>
          {canCreate && (
            <Button
              icon={<Plus className="w-4 h-4" />}
              onClick={() => {
                setEditData(null);
                setShowForm(true);
              }}
            >
              Add Student
            </Button>
          )}
        </div>

        <StudentList
          students={students}
          sections={sections}
          seats={seats}
          plans={plans}
          fees={fees}
          onEdit={(s) => {
            setEditData(s);
            setShowForm(true);
          }}
          onDelete={setDeleteTarget}
          onCollectFee={handleOpenCollectFee}
          onExtend={(student) => setExtendStudent(student)}
          onViewProfile={setProfileStudent}
          onToggleStatus={(student) => setStatusTarget(student)}
          canEdit={canEdit}
          canDelete={canDelete}
          canCollectFee={canCollectFee}
          initialFilterShift={targetShift}
          initialFilterExpiry={targetExpiry}
        />
      </div>

      <StudentForm
        isOpen={showForm}
        onClose={() => {
          setShowForm(false);
          setEditData(null);
          setConvertingVisitorId(null);
        }}
        onSubmit={editData && editData.id ? handleEditStudent : handleAddStudent}
        editData={editData}
        sections={sections}
        seats={seats}
        plans={plans}
        students={students}
        addonPricing={addonPricing}
      />

      <ConfirmDialog
        isOpen={!!statusTarget}
        onClose={() => setStatusTarget(null)}
        onConfirm={async () => {
          if (!statusTarget) return;
          const target = statusTarget;
          setStatusTarget(null);
          await handleToggleStatus(target);
        }}
        title={statusTarget?.status === 'active' ? 'Student ko Left mark karein aur Seat free karein?' : 'Student ko Active karein?'}
        message={
          statusTarget?.status === 'active'
            ? `Kya aap sach me "${statusTarget?.name}" ko LEFT mark karke unki Seat free (vacant) karna chahte hain?`
            : `Kya aap "${statusTarget?.name}" ko dobara ACTIVE status me lana chahte hain?`
        }
        confirmText={statusTarget?.status === 'active' ? 'Yes, Mark Left & Free Seat' : 'Yes, Make Active'}
        variant={statusTarget?.status === 'active' ? 'danger' : 'primary'}
      />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteStudent}
        title="Delete Student?"
        message={`Are you sure you want to remove "${deleteTarget?.name}"? Their seat will be freed up and they will be marked inactive.`}
        confirmText="Delete Student"
        variant="danger"
      />

      <StudentProfile
        isOpen={!!profileStudent}
        onClose={() => setProfileStudent(null)}
        student={profileStudent}
        section={profileDetails.section}
        seat={profileDetails.seat}
        fees={profileDetails.fees || []}
        plan={profileDetails.plan}
        onDeleteStudent={setDeleteTarget}
        onEditStudent={(s) => {
          setEditData(s);
          setShowForm(true);
        }}
        onExtendStudent={(s) => setExtendStudent(s)}
        canDelete={canDelete}
        canEdit={canEdit}
      />

      <ExtendMembershipModal
        isOpen={!!extendStudent}
        onClose={() => setExtendStudent(null)}
        student={extendStudent}
        seat={extendStudentDetails.seat}
        plan={extendStudentDetails.plan}
        onExtend={handleExtendMembership}
        loading={extendingLoading}
      />

      <CollectFeeModal
        isOpen={!!collectFeeRecord}
        onClose={() => {
          setCollectFeeRecord(null);
          setCollectFeeStudent(null);
        }}
        onSubmit={handleCollectFee}
        student={collectFeeStudent}
        fee={collectFeeRecord}
        plan={collectFeeStudent ? plans.find((p) => p.id === (collectFeeRecord?.planId || collectFeeStudent.membershipPlanId)) : null}
        plans={plans}
        seat={collectFeeStudent ? seats.find((s) => s.id === collectFeeStudent.seatId) : null}
        addonPricing={addonPricing}
      />

      {extensionReceiptFee && (
        <FeeReceipt
          isOpen={!!extensionReceiptFee}
          onClose={() => setExtensionReceiptFee(null)}
          fee={extensionReceiptFee}
          student={students.find((s) => s.id === extensionReceiptFee.studentId)}
          seat={seats.find((s) => s.id === extensionReceiptFee.seatId)}
          section={sections.find((sec) => sec.id === extensionReceiptFee.sectionId)}
        />
      )}
    </Layout>
  );
}
