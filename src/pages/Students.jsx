import { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import Button from '../components/common/Button';
import ConfirmDialog from '../components/common/ConfirmDialog';
import StudentList from '../components/students/StudentList';
import StudentForm from '../components/students/StudentForm';
import StudentProfile from '../components/students/StudentProfile';
import { Plus, Loader2 } from 'lucide-react';
import { COLLECTIONS, SEAT_STATUS, STUDENT_STATUS } from '../utils/constants';
import { useAuth } from '../context/AuthContext';
import {
  fetchCollectionData,
  createDocument,
  updateDocument,
  removeDocument,
} from '../firebase/storageService';

export default function Students() {
  const { hasPermission } = useAuth();
  const [students, setStudents] = useState([]);
  const [sections, setSections] = useState([]);
  const [seats, setSeats] = useState([]);
  const [plans, setPlans] = useState([]);
  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editData, setEditData] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [profileStudent, setProfileStudent] = useState(null);
  const [statusTarget, setStatusTarget] = useState(null);

  const canCreate = hasPermission('students', 'create');
  const canEdit = hasPermission('students', 'edit');
  const canDelete = hasPermission('students', 'delete');
  const canCollectFee = hasPermission('fees', 'create');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [stuDocs, secDocs, seatDocs, planDocs, feeDocs] = await Promise.all([
        fetchCollectionData(COLLECTIONS.STUDENTS),
        fetchCollectionData(COLLECTIONS.SECTIONS),
        fetchCollectionData(COLLECTIONS.SEATS),
        fetchCollectionData(COLLECTIONS.MEMBERSHIP_PLANS),
        fetchCollectionData(COLLECTIONS.FEES),
      ]);
      setStudents(stuDocs);
      setSections(secDocs);
      setSeats(seatDocs);
      setPlans(planDocs);
      setFees(feeDocs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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
    const duration = plan?.durationMonths || 1;
    const membershipEnd = new Date(joinD.getFullYear(), joinD.getMonth() + duration, joinD.getDate());

    const newStudentData = {
      name: formData.name,
      phone: formData.phone,
      email: formData.email || '',
      sectionId: formData.sectionId || '',
      seatId: formData.status === 'left' ? '' : (formData.seatId || ''),
      shift: formData.shift || 'full_day',
      shiftTiming: formData.shiftTiming || 'Full Day',
      customStartTime: formData.customStartTime || '',
      customEndTime: formData.customEndTime || '',
      membershipPlanId: formData.membershipPlanId || '',
      joinDate: joinD.toISOString(),
      membershipStart: joinD.toISOString(),
      membershipEnd: membershipEnd.toISOString(),
      status: formData.status || 'active',
    };

    const docRecord = await createDocument(COLLECTIONS.STUDENTS, newStudentData);

    if (newStudentData.seatId) {
      await updateSeatStatusAfterChange(newStudentData.seatId, { id: docRecord.id, ...newStudentData });
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
    const duration = plan?.durationMonths || 1;
    const membershipEnd = new Date(joinD.getFullYear(), joinD.getMonth() + duration, joinD.getDate());

    const updatedData = {
      name: formData.name,
      phone: formData.phone,
      email: formData.email || '',
      sectionId: formData.status === 'left' ? '' : (formData.sectionId || ''),
      seatId: formData.status === 'left' ? '' : (formData.seatId || ''),
      shift: formData.shift || 'full_day',
      shiftTiming: formData.shiftTiming || 'Full Day',
      customStartTime: formData.customStartTime || '',
      customEndTime: formData.customEndTime || '',
      membershipPlanId: formData.membershipPlanId || '',
      joinDate: joinD.toISOString(),
      membershipStart: joinD.toISOString(),
      membershipEnd: membershipEnd.toISOString(),
      status: formData.status || 'active',
    };

    await updateDocument(COLLECTIONS.STUDENTS, editData.id, updatedData);

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

  const getStudentDetails = (student) => {
    const section = sections.find((s) => s.id === student.sectionId);
    const seat = seats.find((s) => s.id === student.seatId);
    const plan = plans.find((p) => p.id === student.membershipPlanId);
    const studentFees = fees.filter((f) => f.studentId === student.id);
    return { section, seat, plan, fees: studentFees };
  };

  if (loading) {
    return (
      <Layout title="Students">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      </Layout>
    );
  }

  const profileDetails = profileStudent ? getStudentDetails(profileStudent) : {};

  return (
    <Layout title="Students">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Students Management</h1>
            <p className="text-gray-500 text-xs sm:text-sm mt-0.5">
              {students.filter((s) => s.status === 'active').length} active admissions • Joining Date billing cycles & Seat shifts
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
          onEdit={(s) => {
            setEditData(s);
            setShowForm(true);
          }}
          onDelete={setDeleteTarget}
          onCollectFee={() => (window.location.href = '/fees')}
          onViewProfile={setProfileStudent}
          onToggleStatus={handleToggleStatus}
          canEdit={canEdit}
          canDelete={canDelete}
          canCollectFee={canCollectFee}
        />
      </div>

      <StudentForm
        isOpen={showForm}
        onClose={() => {
          setShowForm(false);
          setEditData(null);
        }}
        onSubmit={editData ? handleEditStudent : handleAddStudent}
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
        canDelete={canDelete}
        canEdit={canEdit}
      />
    </Layout>
  );
}
