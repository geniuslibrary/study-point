import { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import SectionList from '../components/sections/SectionList';
import SectionForm from '../components/sections/SectionForm';
import { Plus, Loader2, UserX, UserPlus, Trash2, PlusCircle } from 'lucide-react';
import { COLLECTIONS, SEAT_STATUS } from '../utils/constants';
import {
  fetchCollectionData,
  createDocument,
  updateDocument,
  removeDocument,
} from '../firebase/storageService';

export default function Sections() {
  const [sections, setSections] = useState([]);
  const [seats, setSeats] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editData, setEditData] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteSeatTarget, setDeleteSeatTarget] = useState(null);

  // Seat management modal states
  const [selectedSeat, setSelectedSeat] = useState(null);
  const [seatModalOpen, setSeatModalOpen] = useState(false);
  const [seatAddons, setSeatAddons] = useState({ locker: false, wifi: false, light: false });

  // Quick assign states in seat modal
  const [quickAssignShift, setQuickAssignShift] = useState('first_half');
  const [quickAssignStudentId, setQuickAssignStudentId] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [secDocs, seatDocs, stuDocs] = await Promise.all([
        fetchCollectionData(COLLECTIONS.SECTIONS),
        fetchCollectionData(COLLECTIONS.SEATS),
        fetchCollectionData(COLLECTIONS.STUDENTS),
      ]);

      setSections(secDocs);
      setStudents(stuDocs);

      // Enrich seats with assigned active students
      const enrichedSeats = seatDocs.map((seat) => {
        const assignedStudents = stuDocs.filter(
          (s) => s.seatId === seat.id && s.status === 'active'
        );
        return {
          ...seat,
          assignedStudents,
        };
      });

      setSeats(enrichedSeats);
    } catch (err) {
      console.error('Error fetching section data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 1. Add New Section with initial seats
  const handleAddSection = async (formData) => {
    const totalSeatsNum = Number(formData.totalSeats) || 1;
    const secDoc = await createDocument(COLLECTIONS.SECTIONS, {
      name: formData.name,
      totalSeats: totalSeatsNum,
      description: formData.description || '',
    });

    const seatPromises = [];
    for (let i = 1; i <= totalSeatsNum; i++) {
      seatPromises.push(
        createDocument(
          COLLECTIONS.SEATS,
          {
            sectionId: secDoc.id,
            seatNumber: i,
            status: SEAT_STATUS.AVAILABLE,
            studentId: null,
            addons: { locker: false, wifi: false, light: false },
          },
          `${secDoc.id}_seat_${i}`
        )
      );
    }
    await Promise.all(seatPromises);
    await fetchData();
  };

  // 2. Edit/Update Section and dynamically add/remove physical seats
  const handleEditSection = async (formData) => {
    if (!editData) return;

    const newTotalSeats = Number(formData.totalSeats) || 1;
    const currentSectionSeats = seats.filter((s) => s.sectionId === editData.id);
    const currentSeatCount = currentSectionSeats.length;

    // Update section metadata
    await updateDocument(COLLECTIONS.SECTIONS, editData.id, {
      name: formData.name,
      description: formData.description || '',
      totalSeats: newTotalSeats,
    });

    // If new total seats is greater, add new seats!
    if (newTotalSeats > currentSeatCount) {
      const maxExistingNumber = currentSectionSeats.reduce(
        (max, s) => Math.max(max, Number(s.seatNumber) || 0),
        0
      );

      const seatsToCreate = newTotalSeats - currentSeatCount;
      const seatPromises = [];
      for (let i = 1; i <= seatsToCreate; i++) {
        const nextNum = maxExistingNumber + i;
        seatPromises.push(
          createDocument(
            COLLECTIONS.SEATS,
            {
              sectionId: editData.id,
              seatNumber: nextNum,
              status: SEAT_STATUS.AVAILABLE,
              studentId: null,
              addons: { locker: false, wifi: false, light: false },
            },
            `${editData.id}_seat_${nextNum}`
          )
        );
      }
      await Promise.all(seatPromises);
    }
    // If new total seats is smaller, delete unassigned excess seats from end
    else if (newTotalSeats < currentSeatCount) {
      const diff = currentSeatCount - newTotalSeats;
      const unassignedSeats = currentSectionSeats
        .filter((s) => !s.assignedStudents || s.assignedStudents.length === 0)
        .sort((a, b) => (Number(b.seatNumber) || 0) - (Number(a.seatNumber) || 0));

      const seatsToDelete = unassignedSeats.slice(0, diff);
      await Promise.all(seatsToDelete.map((s) => removeDocument(COLLECTIONS.SEATS, s.id)));
    }

    setEditData(null);
    await fetchData();
  };

  // 3. Quick Add a Single Seat to a Section
  const handleAddSingleSeat = async (sectionId) => {
    const section = sections.find((s) => s.id === sectionId);
    if (!section) return;

    const sectionSeats = seats.filter((s) => s.sectionId === sectionId);
    const maxSeatNum = sectionSeats.reduce(
      (max, s) => Math.max(max, Number(s.seatNumber) || 0),
      0
    );
    const nextSeatNum = maxSeatNum + 1;

    // Create the new physical seat
    await createDocument(
      COLLECTIONS.SEATS,
      {
        sectionId: sectionId,
        seatNumber: nextSeatNum,
        status: SEAT_STATUS.AVAILABLE,
        studentId: null,
        addons: { locker: false, wifi: false, light: false },
      },
      `${sectionId}_seat_${nextSeatNum}`
    );

    // Update section totalSeats count
    await updateDocument(COLLECTIONS.SECTIONS, sectionId, {
      totalSeats: sectionSeats.length + 1,
    });

    await fetchData();
  };

  // 4. Delete an Individual Empty Seat
  const handleDeleteSingleSeat = async () => {
    if (!deleteSeatTarget) return;

    // Remove seat document
    await removeDocument(COLLECTIONS.SEATS, deleteSeatTarget.id);

    // Update section totalSeats
    const section = sections.find((s) => s.id === deleteSeatTarget.sectionId);
    if (section) {
      const remainingSectionSeats = seats.filter(
        (s) => s.sectionId === section.id && s.id !== deleteSeatTarget.id
      );
      await updateDocument(COLLECTIONS.SECTIONS, section.id, {
        totalSeats: remainingSectionSeats.length,
      });
    }

    setDeleteSeatTarget(null);
    setSeatModalOpen(false);
    await fetchData();
  };

  // 5. Delete Entire Section
  const handleDeleteSection = async () => {
    if (!deleteTarget) return;
    const sectionSeats = seats.filter((s) => s.sectionId === deleteTarget.id);
    await Promise.all(sectionSeats.map((s) => removeDocument(COLLECTIONS.SEATS, s.id)));
    await removeDocument(COLLECTIONS.SECTIONS, deleteTarget.id);
    setDeleteTarget(null);
    await fetchData();
  };

  // 6. Handle Seat Click Modal
  const handleSeatClick = (seat) => {
    setSelectedSeat(seat);
    setSeatAddons(seat.addons || { locker: false, wifi: false, light: false });
    setQuickAssignStudentId('');
    setQuickAssignShift('first_half');
    setSeatModalOpen(true);
  };

  const handleUpdateAddons = async () => {
    if (!selectedSeat) return;
    await updateDocument(COLLECTIONS.SEATS, selectedSeat.id, {
      addons: seatAddons,
    });
    setSeatModalOpen(false);
    await fetchData();
  };

  const handleUnassignStudent = async (studentId) => {
    await updateDocument(COLLECTIONS.STUDENTS, studentId, {
      seatId: null,
    });

    const remainingStudents = (selectedSeat?.assignedStudents || []).filter((s) => s.id !== studentId);
    let newStatus = SEAT_STATUS.AVAILABLE;
    if (remainingStudents.length > 0) {
      newStatus = SEAT_STATUS.PARTIALLY_OCCUPIED;
    }

    await updateDocument(COLLECTIONS.SEATS, selectedSeat.id, {
      status: newStatus,
      studentId: remainingStudents[0]?.id || null,
    });

    await fetchData();
    setSelectedSeat((prev) => ({
      ...prev,
      assignedStudents: remainingStudents,
    }));
  };

  const handleQuickAssign = async () => {
    if (!selectedSeat || !quickAssignStudentId) return;

    let shiftTiming = 'Full Day (6:00 AM - 11:00 PM)';
    if (quickAssignShift === 'first_half') shiftTiming = '6:00 AM - 2:00 PM (1st Half)';
    if (quickAssignShift === 'second_half') shiftTiming = '2:00 PM - 11:00 PM (2nd Half)';

    await updateDocument(COLLECTIONS.STUDENTS, quickAssignStudentId, {
      seatId: selectedSeat.id,
      sectionId: selectedSeat.sectionId,
      shift: quickAssignShift,
      shiftTiming,
    });

    const newlyAssigned = students.find((s) => s.id === quickAssignStudentId);
    const updatedStudentsList = [
      ...(selectedSeat.assignedStudents || []),
      { ...newlyAssigned, shift: quickAssignShift, shiftTiming },
    ];

    const hasFullDay = updatedStudentsList.some((s) => s.shift === 'full_day');
    const hasFirstHalf = updatedStudentsList.some((s) => s.shift === 'first_half');
    const hasSecondHalf = updatedStudentsList.some((s) => s.shift === 'second_half');

    let newStatus = SEAT_STATUS.AVAILABLE;
    if (hasFullDay || (hasFirstHalf && hasSecondHalf) || updatedStudentsList.length >= 2) {
      newStatus = SEAT_STATUS.OCCUPIED;
    } else if (updatedStudentsList.length > 0) {
      newStatus = SEAT_STATUS.PARTIALLY_OCCUPIED;
    }

    await updateDocument(COLLECTIONS.SEATS, selectedSeat.id, {
      status: newStatus,
      studentId: updatedStudentsList[0]?.id || null,
    });

    setQuickAssignStudentId('');
    await fetchData();
    setSeatModalOpen(false);
  };

  const unassignedStudents = students.filter((s) => s.status === 'active' && !s.seatId);

  const editSectionSeatsCount = editData
    ? seats.filter((s) => s.sectionId === editData.id).length
    : 0;

  if (loading) {
    return (
      <Layout title="Sections">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Sections & Seats">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Sections & Seats Layout</h1>
            <p className="text-gray-500 mt-1">
              {sections.length} Sections • {seats.length} Total Physical Seats • Full & Half Day Shift Management
            </p>
          </div>
          <Button
            icon={<Plus className="w-4 h-4" />}
            onClick={() => {
              setEditData(null);
              setShowForm(true);
            }}
          >
            Add New Section
          </Button>
        </div>

        <SectionList
          sections={sections}
          seats={seats}
          onEdit={(s) => {
            setEditData(s);
            setShowForm(true);
          }}
          onDelete={setDeleteTarget}
          onSeatClick={handleSeatClick}
          onAddSeat={handleAddSingleSeat}
        />
      </div>

      {/* Add / Edit Section Form Modal */}
      <SectionForm
        isOpen={showForm}
        onClose={() => {
          setShowForm(false);
          setEditData(null);
        }}
        onSubmit={editData ? handleEditSection : handleAddSection}
        editData={editData}
        existingSeatsCount={editSectionSeatsCount}
      />

      {/* Delete Entire Section Dialog */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteSection}
        title="Delete Section"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? All ${seats.filter((s) => s.sectionId === deleteTarget?.id).length} seats in this section will also be deleted.`}
        confirmText="Delete Section"
        variant="danger"
      />

      {/* Delete Individual Seat Dialog */}
      <ConfirmDialog
        isOpen={!!deleteSeatTarget}
        onClose={() => setDeleteSeatTarget(null)}
        onConfirm={handleDeleteSingleSeat}
        title="Delete Seat"
        message={`Are you sure you want to remove Seat #${deleteSeatTarget?.seatNumber}?`}
        confirmText="Delete Seat"
        variant="danger"
      />

      {/* Manage Individual Seat Modal */}
      <Modal
        isOpen={seatModalOpen}
        onClose={() => setSeatModalOpen(false)}
        title={`Seat #${selectedSeat?.seatNumber} Management`}
        size="lg"
      >
        <div className="space-y-5">
          {/* Current Occupants List */}
          <div>
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2.5">
              Current Assigned Students (Shifts)
            </h4>

            {selectedSeat?.assignedStudents && selectedSeat.assignedStudents.length > 0 ? (
              <div className="space-y-2">
                {selectedSeat.assignedStudents.map((st) => (
                  <div
                    key={st.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center font-bold text-indigo-600 text-xs">
                        {st.name?.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{st.name}</p>
                        <p className="text-xs text-gray-500">{st.shiftTiming || st.shift || 'Full Day'}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleUnassignStudent(st.id)}
                      className="px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                      title="Unassign this student from seat"
                    >
                      <UserX className="w-3.5 h-3.5" /> Remove
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 bg-green-50 rounded-xl border border-green-200 text-center text-xs text-green-800 font-medium">
                This seat is completely free for all shifts.
              </div>
            )}
          </div>

          {/* Quick Assign Student for this Seat */}
          {(!selectedSeat?.assignedStudents ||
            (!selectedSeat.assignedStudents.some((s) => s.shift === 'full_day') &&
              selectedSeat.assignedStudents.length < 2)) && (
            <div className="p-4 bg-indigo-50/60 rounded-xl border border-indigo-100 space-y-3">
              <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
                <UserPlus className="w-3.5 h-3.5 text-indigo-600" />
                Quick Assign Student to this Seat
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Select Student</label>
                  <select
                    value={quickAssignStudentId}
                    onChange={(e) => setQuickAssignStudentId(e.target.value)}
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg bg-white"
                  >
                    <option value="">Choose unassigned student...</option>
                    {unassignedStudents.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.phone})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Shift / Time Slot</label>
                  <select
                    value={quickAssignShift}
                    onChange={(e) => setQuickAssignShift(e.target.value)}
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg bg-white"
                  >
                    {(!selectedSeat?.assignedStudents || selectedSeat.assignedStudents.length === 0) && (
                      <option value="full_day">☀️ Full Day (6 AM - 11 PM)</option>
                    )}
                    {!selectedSeat?.assignedStudents?.some((s) => s.shift === 'first_half') && (
                      <option value="first_half">🌅 1st Half / Morning (6 AM - 2 PM)</option>
                    )}
                    {!selectedSeat?.assignedStudents?.some((s) => s.shift === 'second_half') && (
                      <option value="second_half">🌆 2nd Half / Evening (2 PM - 11 PM)</option>
                    )}
                  </select>
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  size="sm"
                  onClick={handleQuickAssign}
                  disabled={!quickAssignStudentId}
                >
                  Assign to Shift
                </Button>
              </div>
            </div>
          )}

          {/* Seat Facilities & Addons */}
          <div className="border-t pt-4">
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              Seat Facilities & Add-ons (Locker / WiFi / Light)
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {['locker', 'wifi', 'light'].map((addon) => (
                <label
                  key={addon}
                  className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer text-xs font-medium transition-all ${
                    seatAddons[addon]
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-900'
                      : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={seatAddons[addon]}
                    onChange={(e) => setSeatAddons({ ...seatAddons, [addon]: e.target.checked })}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="capitalize">{addon === 'light' ? 'Desk Light' : addon}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Modal Footer with Delete Seat Action */}
          <div className="flex items-center justify-between pt-3 border-t">
            {(!selectedSeat?.assignedStudents || selectedSeat.assignedStudents.length === 0) ? (
              <button
                onClick={() => setDeleteSeatTarget(selectedSeat)}
                className="text-xs text-red-600 hover:text-red-800 font-bold flex items-center gap-1 p-1 rounded hover:bg-red-50 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete This Seat</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setSeatModalOpen(false)}>
                Close
              </Button>
              <Button onClick={handleUpdateAddons}>Save Facilities</Button>
            </div>
          </div>
        </div>
      </Modal>
    </Layout>
  );
}
