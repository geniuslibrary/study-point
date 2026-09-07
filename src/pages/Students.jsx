import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import Button from '../components/common/Button';
import ConfirmDialog from '../components/common/ConfirmDialog';
import StudentList from '../components/students/StudentList';
import StudentForm from '../components/students/StudentForm';
import StudentProfile from '../components/students/StudentProfile';
import ExtendMembershipModal from '../components/students/ExtendMembershipModal';
import { Plus, Loader2 } from 'lucide-react';
import { COLLECTIONS, SEAT_STATUS, STUDENT_STATUS } from '../utils/constants';
import {
  calculateSeatAddonCharges,
  getStoredAddons,
  checkAndAutoReleaseExpiredMemberships,
  formatDate,
} from '../utils/helpers';
import { useAuth } from '../context/AuthContext';
import {
  fetchCollectionData,
  createDocument,
  updateDocument,
  removeDocument,
} from '../firebase/storageService';

export default function Students() {
  const navigate = useNavigate();
  const location = useLocation();
  const targetShift = location.state?.filterShift || '';
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

      // Auto-check and release physical seats of students whose validity expired (< today) without extension
      let currentStudents = stuDocs;
      let currentSeats = seatDocs;
      try {
        const released = await checkAndAutoReleaseExpiredMemberships({
          students: stuDocs,
          seats: seatDocs,
          updateDocument,
          COLLECTIONS,
          SEAT_STATUS,
        });
        if (released && released.length > 0) {
          console.log(`[Auto-Release] Freed ${released.length} expired seat(s):`, released);
          const [refreshedStudents, refreshedSeats] = await Promise.all([
            fetchCollectionData(COLLECTIONS.STUDENTS),
            fetchCollectionData(COLLECTIONS.SEATS),
          ]);
          currentStudents = refreshedStudents;
          currentSeats = refreshedSeats;
        }
      } catch (releaseErr) {
        console.warn('Auto release expired check failed gracefully:', releaseErr);
      }

      setStudents(currentStudents);
      setSections(secDocs);
      setSeats(currentSeats);
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
      status: formData.status || 'active',
      notes: formData.notes || '',
    };

    const docRecord = await createDocument(COLLECTIONS.STUDENTS, newStudentData);

    const { charges: addonCharges, total: addonTotal } = calculateSeatAddonCharges(
      formData.addons,
      addonPricing,
      duration
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
      await createDocument(
        COLLECTIONS.FEES,
        {
          studentId: docRecord.id,
          amount: Math.max(0, baseFee + addonTotal - discount),
          baseFee,
          discountAmount: discount,
          addonCharges,
          dueDate: membershipEnd.toISOString(),
          paidDate: null,
          status: 'pending',
          month: monthStr,
          paymentMode: '',
          notes: '',
          planId: plan?.id || '',
          planName: formData.planName || (plan?.name || 'Standard Plan'),
          planDuration: duration,
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
      status: formData.status || 'active',
      notes: formData.notes || '',
    };

    await updateDocument(COLLECTIONS.STUDENTS, editData.id, updatedData);

    if (updatedData.seatId && formData.addons) {
      await updateDocument(COLLECTIONS.SEATS, updatedData.seatId, {
        addons: formData.addons,
      });
    }

    const { charges: addonCharges, total: addonTotal } = calculateSeatAddonCharges(
      formData.addons,
      addonPricing,
      duration
    );

    // Also update any pending fee records for this student to reflect new discount / plan / facilities
    const pendingStudentFee = fees.find((f) => f.studentId === editData.id && f.status === 'pending');
    if (pendingStudentFee) {
      await updateDocument(COLLECTIONS.FEES, pendingStudentFee.id, {
        baseFee,
        discountAmount: discount,
        addonCharges,
        amount: Math.max(0, baseFee + addonTotal - discount),
        planId: plan?.id || pendingStudentFee.planId,
        planName: plan?.name || pendingStudentFee.planName,
        planDuration: duration,
        periodStart: joinD.toISOString(),
        periodEnd: membershipEnd.toISOString(),
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

    if (deleteTarget.seatId) {
      await updateSeatStatusAfterChange(deleteTarget.seatId, null, deleteTarget.id);
    }

    await removeDocument(COLLECTIONS.STUDENTS, deleteTarget.id);
    setDeleteTarget(null);
    await fetchData();
  };

  const handleExtendMembership = async ({
    studentId,
    extraDays,
    feeAmount,
    paymentMode,
    newExpiryDate,
    notes,
    sendWhatsApp,
  }) => {
    setExtendingLoading(true);
    try {
      const st = students.find((s) => s.id === studentId);
      if (!st) return;

      const updatedDurationDays = (Number(st.durationDays) || 0) + extraDays;

      // 1. Update student
      await updateDocument(COLLECTIONS.STUDENTS, studentId, {
        membershipEnd: newExpiryDate,
        status: 'active',
        durationDays: updatedDurationDays,
        durationLabel: `${updatedDurationDays} Days Plan`,
        isDayBased: true,
        lastExtendedAt: new Date().toISOString(),
        lastExtendedDays: extraDays,
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

      // 3. Create fee record if feeAmount > 0
      if (feeAmount > 0) {
        const todayStr = new Date().toISOString();
        const monthYear = new Date().toLocaleString('default', { month: 'short', year: 'numeric' });
        await createDocument(COLLECTIONS.FEES, {
          studentId: st.id,
          studentName: st.name,
          studentPhone: st.phone,
          planId: st.membershipPlanId || 'custom_days',
          planName: `Extension (+${extraDays} Days)`,
          amount: feeAmount,
          baseFee: feeAmount,
          paidAmount: feeAmount,
          discountAmount: 0,
          addonCharges: {},
          status: 'paid',
          paymentMode: paymentMode || 'cash',
          paymentDate: todayStr,
          periodStart: todayStr,
          periodEnd: newExpiryDate,
          billingMonth: monthYear,
          receiptNumber: `EXT-${Date.now().toString().slice(-6)}`,
          notes: notes || `Membership extended by ${extraDays} days`,
          collectedBy: 'Admin',
        });
      }

      // 4. WhatsApp Confirmation
      if (sendWhatsApp && st.phone) {
        const phoneClean = st.phone.replace(/[^0-9]/g, '');
        const phoneWithCountry = phoneClean.length === 10 ? `91${phoneClean}` : phoneClean;
        const newDateFormatted = formatDate(newExpiryDate);
        const msg = `🙏 नमस्ते ${st.name}!\n\n🎉 आपकी *Study Point Library* की सदस्यता सफलतापुर्वक *+${extraDays} दिन* आगे बढ़ा दी गई है।\n\n📅 *नई समाप्ति तिथि (New Expiry):* ${newDateFormatted}\n💰 *प्राप्त शुल्क:* ₹${feeAmount}\n💳 *माध्यम:* ${paymentMode.toUpperCase()}\n\nधन्यवाद! पढ़ाई जारी रखें और उज्ज्वल भविष्य बनाएं। ✨`;
        const waUrl = `https://api.whatsapp.com/send?phone=${phoneWithCountry}&text=${encodeURIComponent(msg)}`;
        window.open(waUrl, '_blank');
      }

      setExtendStudent(null);
      await fetchData();
    } catch (err) {
      console.error('Error extending student membership:', err);
      alert('Membership extend karne mein dikkat aayi. Kripya punah prayas karein.');
    } finally {
      setExtendingLoading(false);
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
          onEdit={(s) => {
            setEditData(s);
            setShowForm(true);
          }}
          onDelete={setDeleteTarget}
          onCollectFee={(student) => {
            navigate(`/fees?studentId=${student.id}`, { state: { collectStudentId: student.id } });
          }}
          onExtend={(student) => setExtendStudent(student)}
          onViewProfile={setProfileStudent}
          onToggleStatus={handleToggleStatus}
          canEdit={canEdit}
          canDelete={canDelete}
          canCollectFee={canCollectFee}
          initialFilterShift={targetShift}
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
      />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteStudent}
        title="Delete Student Permanently?"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? All records will be removed and their seat slot will be freed up.`}
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
    </Layout>
  );
}
