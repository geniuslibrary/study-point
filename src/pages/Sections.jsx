import { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import SectionList from '../components/sections/SectionList';
import SectionForm from '../components/sections/SectionForm';
import { Plus, Loader2, UserX, UserPlus, Trash2, PlusCircle, Sparkles } from 'lucide-react';
import { COLLECTIONS, SEAT_STATUS } from '../utils/constants';
import { getStoredAddons, calculateSeatAddonCharges } from '../utils/helpers';
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
  const [plans, setPlans] = useState([]);
  const [addonPricing, setAddonPricing] = useState([]);
  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editData, setEditData] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteSeatTarget, setDeleteSeatTarget] = useState(null);

  // Seat management modal states
  const [selectedSeat, setSelectedSeat] = useState(null);
  const [seatModalOpen, setSeatModalOpen] = useState(false);
  const [seatAddons, setSeatAddons] = useState({});

  // Quick assign states in seat modal
  const [quickAssignShift, setQuickAssignShift] = useState('first_half');
  const [quickAssignStudentId, setQuickAssignStudentId] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [secDocs, seatDocs, stuDocs, planDocs, addonDocs, feeDocs] = await Promise.all([
        fetchCollectionData(COLLECTIONS.SECTIONS),
        fetchCollectionData(COLLECTIONS.SEATS),
        fetchCollectionData(COLLECTIONS.STUDENTS),
        fetchCollectionData(COLLECTIONS.MEMBERSHIP_PLANS),
        fetchCollectionData(COLLECTIONS.ADDON_PRICING),
        fetchCollectionData(COLLECTIONS.FEES),
      ]);

      setSections(secDocs);
      setStudents(stuDocs);
      setPlans(planDocs);
      setFees(feeDocs);
      const activeAddons = addonDocs.length > 0 ? addonDocs : getStoredAddons();
      setAddonPricing(activeAddons);

      // Deduplicate seats by sectionId and seatNumber to ensure strictly 1 physical record per seat number
      const uniqueSeatsMap = new Map();
      const duplicateIdsToDelete = [];

      seatDocs.forEach((seat) => {
        const key = `${seat.sectionId}_${Number(seat.seatNumber) || seat.seatNumber}`;
        if (!uniqueSeatsMap.has(key)) {
          uniqueSeatsMap.set(key, seat);
        } else {
          const existing = uniqueSeatsMap.get(key);
          const hasStudent = stuDocs.some((s) => s.seatId === seat.id && s.status === 'active');
          const existingHasStudent = stuDocs.some((s) => s.seatId === existing.id && s.status === 'active');

          if (hasStudent && !existingHasStudent) {
            duplicateIdsToDelete.push(existing.id);
            uniqueSeatsMap.set(key, seat);
          } else {
            duplicateIdsToDelete.push(seat.id);
          }
        }
      });

      // Automatically clean up duplicate ghost seats in background if found
      if (duplicateIdsToDelete.length > 0) {
        Promise.all(duplicateIdsToDelete.map((id) => removeDocument(COLLECTIONS.SEATS, id))).catch(console.warn);
      }

      const deduplicatedSeats = Array.from(uniqueSeatsMap.values());

      // Enrich seats with assigned active students
      const enrichedSeats = deduplicatedSeats.map((seat) => {
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

    // Update section totalSeats
    await updateDocument(COLLECTIONS.SECTIONS, sectionId, {
      totalSeats: nextSeatNum,
    });

    await fetchData();
  };

  // 4. Delete an Entire Section (and all its physical seats)
  const handleDeleteSection = async () => {
    if (!deleteTarget) return;

    const sectionSeats = seats.filter((s) => s.sectionId === deleteTarget.id);
    const deleteSeatPromises = sectionSeats.map((s) => removeDocument(COLLECTIONS.SEATS, s.id));
    await Promise.all(deleteSeatPromises);

    // Clear seatId on assigned students
    const sectionStudents = students.filter((s) => s.sectionId === deleteTarget.id);
    const updateStudentPromises = sectionStudents.map((s) =>
      updateDocument(COLLECTIONS.STUDENTS, s.id, { seatId: null, sectionId: null })
    );
    await Promise.all(updateStudentPromises);

    await removeDocument(COLLECTIONS.SECTIONS, deleteTarget.id);
    setDeleteTarget(null);
    await fetchData();
  };

  // 5. Delete an Individual Seat
  const handleDeleteIndividualSeat = async () => {
    if (!deleteSeatTarget) return;

    // If seat has students, unassign them first
    if (deleteSeatTarget.assignedStudents?.length > 0) {
      const unassignPromises = deleteSeatTarget.assignedStudents.map((st) =>
        updateDocument(COLLECTIONS.STUDENTS, st.id, { seatId: null })
      );
      await Promise.all(unassignPromises);
    }

    await removeDocument(COLLECTIONS.SEATS, deleteSeatTarget.id);
    setDeleteSeatTarget(null);
    setSeatModalOpen(false);
    await fetchData();
  };

  // 6. Handle Seat Click & Open Details / Quick-Assignment Modal
  const handleSeatClick = (seat) => {
    setSelectedSeat(seat);
    setSeatAddons(seat.addons || {});
    setQuickAssignStudentId('');
    setSeatModalOpen(true);
  };

  // 7. Save Seat Add-ons (Locker, WiFi, Light, etc.) & Auto-update Active Students' Dues
  const handleSaveSeatAddons = async () => {
    if (!selectedSeat) return;

    try {
      await updateDocument(COLLECTIONS.SEATS, selectedSeat.id, {
        addons: seatAddons,
      });

      // Update occupying active students' pending fee records to include newly selected facility charges
      const seatStudents = students.filter(
        (s) => s.seatId === selectedSeat.id && s.status === 'active'
      );

      for (const student of seatStudents) {
        const plan = plans.find((p) => p.id === student.membershipPlanId);
        const duration = Number(plan?.durationMonths) || 1;
        const baseFee = Number(plan?.price) || 800;
        const discount = Number(student.discountAmount) || 0;

        const { charges: addonCharges, total: addonTotal } = calculateSeatAddonCharges(
          seatAddons,
          addonPricing,
          duration
        );

        const studentPendingFees = fees.filter(
          (f) => f.studentId === student.id && f.status === 'pending'
        );

        for (const fee of studentPendingFees) {
          await updateDocument(COLLECTIONS.FEES, fee.id, {
            addonCharges,
            amount: Math.max(0, baseFee + addonTotal - discount),
          });
        }
      }

      setSeats((prev) =>
        prev.map((s) => (s.id === selectedSeat.id ? { ...s, addons: seatAddons } : s))
      );
      setSeatModalOpen(false);
      await fetchData();
    } catch (e) {
      console.error('Error saving seat addons:', e);
    }
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
            <p className="text-gray-500 mt-1 text-xs sm:text-sm">
              {sections.length} Sections • <strong>{seats.length} Total Physical Seats</strong> • Full & Half Day Shift Management
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
        onConfirm={handleDeleteIndividualSeat}
        title={`Delete Seat #${deleteSeatTarget?.seatNumber}?`}
        message={`Are you sure you want to delete physical Seat #${deleteSeatTarget?.seatNumber}? Any student assigned to this seat will become unassigned.`}
        confirmText="Yes, Delete Seat"
        variant="danger"
      />

      {/* Manage Seat Pod Modal */}
      {selectedSeat && (
        <Modal
          isOpen={seatModalOpen}
          onClose={() => setSeatModalOpen(false)}
          title={`Manage Physical Seat #${selectedSeat.seatNumber}`}
        >
          <div className="space-y-4">
            {/* Occupancy Status Box */}
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Current Status</span>
                <span
                  className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full ${
                    selectedSeat.assignedStudents?.length === 0
                      ? 'bg-emerald-100 text-emerald-800'
                      : selectedSeat.assignedStudents?.length >= 2 ||
                        selectedSeat.assignedStudents?.some((s) => s.shift === 'full_day')
                      ? 'bg-indigo-100 text-indigo-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {selectedSeat.assignedStudents?.length === 0
                    ? '🟢 Available (Empty)'
                    : selectedSeat.assignedStudents?.length >= 2 ||
                      selectedSeat.assignedStudents?.some((s) => s.shift === 'full_day')
                    ? '🔴 Fully Occupied'
                    : '🟡 Partially Occupied'}
                </span>
              </div>

              {/* Assigned Students */}
              <div className="mt-3 space-y-2">
                <h5 className="text-xs font-bold text-slate-700">Allocated Students:</h5>
                {selectedSeat.assignedStudents?.length > 0 ? (
                  selectedSeat.assignedStudents.map((st) => (
                    <div
                      key={st.id}
                      className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-slate-200 text-xs"
                    >
                      <div>
                        <p className="font-bold text-slate-900">{st.name}</p>
                        <p className="text-[11px] text-slate-500">{st.shiftTiming || st.shift}</p>
                      </div>
                      <button
                        onClick={() => handleUnassignStudent(st.id)}
                        className="px-2 py-1 text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                        title="Remove student from this seat"
                      >
                        <UserX className="w-3.5 h-3.5" />
                        <span>Remove</span>
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 italic">No students assigned to this seat yet.</p>
                )}
              </div>
            </div>

            {/* Quick Assign Student (if seat is not full) */}
            {(!selectedSeat.assignedStudents?.some((s) => s.shift === 'full_day') &&
              (selectedSeat.assignedStudents?.length || 0) < 2) && (
              <div className="bg-indigo-50/70 p-3.5 rounded-2xl border border-indigo-100 space-y-3">
                <h5 className="text-xs font-bold text-indigo-950 flex items-center gap-1">
                  <UserPlus className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Quick Assign Student to this Seat:</span>
                </h5>

                <div className="space-y-2">
                  <select
                    value={quickAssignStudentId}
                    onChange={(e) => setQuickAssignStudentId(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-indigo-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Select unassigned student...</option>
                    {unassignedStudents.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.phone})
                      </option>
                    ))}
                  </select>

                  <div className="flex gap-2">
                    <select
                      value={quickAssignShift}
                      onChange={(e) => setQuickAssignShift(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-indigo-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="first_half">1st Half (6:00 AM - 2:00 PM)</option>
                      <option value="second_half">2nd Half (2:00 PM - 11:00 PM)</option>
                      <option value="full_day">Full Day (6:00 AM - 11:00 PM)</option>
                    </select>

                    <button
                      onClick={handleQuickAssign}
                      disabled={!quickAssignStudentId}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer"
                    >
                      Assign
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Seat Facilities & Add-ons (Dynamic from Settings) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Seat Hardware Facilities:
                </h5>
                <span className="text-[10px] text-indigo-600 font-semibold">Configured in Settings</span>
              </div>

              {addonPricing.length === 0 ? (
                <div className="p-3 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center text-xs text-slate-400">
                  No add-on facilities configured in Settings. (Go to Settings &gt; Seat Add-on Pricing)
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {addonPricing.map((item) => {
                    const nameLower = item.name?.toLowerCase();
                    const isChecked = Boolean(
                      seatAddons[item.id] ||
                      (nameLower && seatAddons[nameLower]) ||
                      (item.name && seatAddons[item.name])
                    );
                    return (
                      <label
                        key={item.id || item.name}
                        className={`flex items-center justify-between gap-2 p-2.5 rounded-xl border text-xs font-bold cursor-pointer transition-all ${
                          isChecked
                            ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-2xs'
                            : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              const updated = { ...seatAddons };
                              if (item.id) updated[item.id] = checked;
                              if (nameLower) updated[nameLower] = checked;
                              if (item.name) updated[item.name] = checked;
                              setSeatAddons(updated);
                            }}
                            className="rounded text-indigo-600 focus:ring-indigo-500 shrink-0"
                          />
                          <span className="truncate">{item.name}</span>
                        </div>
                        <span className="text-[10px] font-black opacity-80 shrink-0 bg-white/80 px-1.5 py-0.5 rounded border border-slate-200/60">
                          ₹{item.monthlyCharge}/mo
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeleteSeatTarget(selectedSeat)}
                className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Delete this individual seat"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                <span>Delete Seat</span>
              </button>

              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => setSeatModalOpen(false)}>
                  Close
                </Button>
                <Button variant="primary" onClick={handleSaveSeatAddons}>
                  Save Facilities
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </Layout>
  );
}
