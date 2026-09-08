import { useState, useEffect, useRef } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import CameraCaptureModal from '../common/CameraCaptureModal';
import { Sun, Sunrise, Sunset, Clock, Armchair, AlertCircle, Calendar, UserX, CheckCircle, Tag, IndianRupee, Lock, Camera, Upload, X, Trash2, User, Image, Check, Sparkles, Mail, CreditCard } from 'lucide-react';
import { formatDate, formatCurrency, getStoredShifts, calculateSeatAddonCharges, getStoredAddons, compressImageFile, calculateMembershipEndDate } from '../../utils/helpers';

export default function StudentForm({
  isOpen,
  onClose,
  onSubmit,
  editData = null,
  sections = [],
  seats = [],
  plans = [],
  students = [],
  addonPricing = [],
}) {
  const getTodayInput = () => new Date().toISOString().split('T')[0];
  const shiftsList = getStoredShifts();

  const configuredAddons = Array.isArray(addonPricing) && addonPricing.length > 0
    ? addonPricing
    : getStoredAddons();
  const [selectedAddons, setSelectedAddons] = useState({});

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    aadharCard: '',
    photo: '',
    sectionId: '',
    seatId: '',
    membershipPlanId: '',
    customDays: '10',
    customFeeAmount: '',
    isCustomDays: false,
    discountAmount: '',
    shift: 'full_day',
    joinDate: getTodayInput(),
    status: 'active',
    customStartTime: '06:00 AM',
    customEndTime: '02:00 PM',
    notes: '',
  });

  const [loading, setLoading] = useState(false);
  const [seatOptions, setSeatOptions] = useState([]);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const galleryInputRef = useRef(null);

  useEffect(() => {
    if (editData) {
      const jDate = editData.joinDate
        ? (editData.joinDate.toDate ? editData.joinDate.toDate() : new Date(editData.joinDate))
            .toISOString()
            .split('T')[0]
        : getTodayInput();

      const assignedSeat = seats.find((s) => s.id === editData.seatId);
      setSelectedAddons(editData.addons || assignedSeat?.addons || {});

      const isCustom = Boolean(editData.isCustomDays || editData.membershipPlanId === 'custom_days');

      setFormData({
        name: editData.name || '',
        phone: editData.phone || '',
        email: editData.email || '',
        aadharCard: editData.aadharCard || editData.aadhar || editData.aadhaar || '',
        photo: editData.photo || '',
        sectionId: editData.sectionId || '',
        seatId: editData.seatId || '',
        membershipPlanId: isCustom ? 'custom_days' : (editData.membershipPlanId || ''),
        customDays: editData.customDays !== undefined && editData.customDays !== null ? String(editData.customDays) : '10',
        customFeeAmount: editData.customFeeAmount !== undefined && editData.customFeeAmount !== null ? String(editData.customFeeAmount) : '',
        isCustomDays: isCustom,
        discountAmount: editData.discountAmount !== undefined && editData.discountAmount !== null && editData.discountAmount !== 0 ? String(editData.discountAmount) : '',
        shift: editData.shift || 'full_day',
        joinDate: jDate,
        status: editData.status || 'active',
        customStartTime: editData.customStartTime || '06:00 AM',
        customEndTime: editData.customEndTime || '02:00 PM',
        notes: editData.notes || '',
      });
    } else {
      setSelectedAddons({});
      setFormData({
        name: '',
        phone: '',
        email: '',
        aadharCard: '',
        photo: '',
        sectionId: sections[0]?.id || '',
        seatId: '',
        membershipPlanId: plans[0]?.id || '',
        customDays: '10',
        customFeeAmount: '',
        isCustomDays: false,
        discountAmount: '',
        shift: 'full_day',
        joinDate: getTodayInput(),
        status: 'active',
        customStartTime: '06:00 AM',
        customEndTime: '02:00 PM',
        notes: '',
      });
    }
  }, [editData, isOpen, sections, plans]);

  const selectedPlan = plans.find((p) => p.id === formData.membershipPlanId);
  const planFeatures = selectedPlan?.features || [];

  const isAddonCoveredByPlan = (addonName) => {
    if (!planFeatures || planFeatures.length === 0 || !addonName) return false;
    const aName = addonName.toLowerCase().trim();
    return planFeatures.some((perk) => String(perk).toLowerCase().trim() === aName);
  };

  // Automatically check any facilities that come included free with the selected membership plan
  useEffect(() => {
    if (configuredAddons.length > 0) {
      setSelectedAddons((prev) => {
        const next = {};
        configuredAddons.forEach((addon) => {
          const nameLower = addon.name?.toLowerCase();
          if (isAddonCoveredByPlan(addon.name)) {
            // Auto-check only this facility because it is covered free in this plan
            if (addon.id) next[addon.id] = true;
            if (addon.name) next[addon.name] = true;
            next[addon.name.toLowerCase()] = true;
          } else if (
            prev[addon.id] ||
            (nameLower && prev[nameLower]) ||
            (addon.name && prev[addon.name])
          ) {
            // Keep if user was editing an existing student with this addon
            if (editData?.addons?.[addon.id] || editData?.addons?.[addon.name] || editData?.addons?.[nameLower]) {
              if (addon.id) next[addon.id] = true;
              if (addon.name) next[addon.name] = true;
              next[addon.name.toLowerCase()] = true;
            }
          }
        });
        return next;
      });
    }
  }, [formData.membershipPlanId, plans, configuredAddons]);

  // Calculate Subscription Period & Total Price from Join Date, Plan & Selected Addons
  const getBillingCycleInfo = () => {
    const isCustom = formData.membershipPlanId === 'custom_days' || formData.isCustomDays;

    const isDayBased = isCustom || selectedPlan?.durationUnit === 'days' || (selectedPlan?.durationDays && !selectedPlan?.durationMonths);
    const durationDays = isCustom ? (Number(formData.customDays) || 10) : (Number(selectedPlan?.durationDays) || 7);
    const durationMonths = isDayBased ? 0 : (Number(selectedPlan?.durationMonths) || 1);

    const planPrice = isCustom ? (Number(formData.customFeeAmount) || 0) : (Number(selectedPlan?.price) || 0);
    const discount = formData.discountAmount === '' ? 0 : Number(formData.discountAmount) || 0;

    const addonDurationFactor = isDayBased ? Math.max(1, Math.round(durationDays / 30)) : durationMonths;
    const { charges: addonCharges, total: addonTotal } = calculateSeatAddonCharges(
      selectedAddons,
      configuredAddons,
      addonDurationFactor,
      planFeatures
    );
    const finalPrice = Math.max(0, planPrice + addonTotal - discount);

    let start = new Date();
    try {
      const [y, m, d] = formData.joinDate.split('-').map(Number);
      start = new Date(y, m - 1, d);
    } catch (_) {
      start = new Date();
    }

    const end = calculateMembershipEndDate(start, selectedPlan, isCustom ? durationDays : null);

    const durationLabel = isDayBased
      ? `${durationDays} Days (दिन)`
      : `${durationMonths} Month${durationMonths > 1 ? 's' : ''} (महीने)`;

    const planName = isCustom
      ? `${durationDays} Days Custom Plan`
      : (selectedPlan?.name || `${durationMonths} Month Plan`);

    return {
      startDate: start,
      endDate: end,
      isDayBased,
      durationDays: isDayBased ? durationDays : null,
      durationMonths: isDayBased ? null : durationMonths,
      durationLabel,
      planName,
      planPrice,
      discount,
      addonCharges,
      addonTotal,
      finalPrice,
    };
  };

  const cycleInfo = getBillingCycleInfo();

  // Compute available seats based on selected Section and Shift
  useEffect(() => {
    if (!formData.sectionId) {
      setSeatOptions([]);
      return;
    }

    const sectionSeats = seats
      .filter((s) => s.sectionId === formData.sectionId)
      .sort((a, b) => (Number(a.seatNumber) || 0) - (Number(b.seatNumber) || 0));

    const activeStudents = students.filter(
      (s) =>
        s.status === 'active' &&
        s.sectionId === formData.sectionId &&
        s.seatId &&
        s.id !== editData?.id
    );

    const evaluatedSeats = sectionSeats.map((seat) => {
      const seatStudents = activeStudents.filter((s) => s.seatId === seat.id);

      const hasFullDay = seatStudents.some((s) => !s.shift || s.shift === 'full_day');
      const hasFirstHalf = seatStudents.some((s) => s.shift === 'first_half');
      const hasSecondHalf = seatStudents.some((s) => s.shift === 'second_half');

      let isAvailable = false;
      let statusHint = '';

      if (hasFullDay) {
        const fullDayStudent = seatStudents.find((s) => !s.shift || s.shift === 'full_day');
        isAvailable = false;
        statusHint = `Full Day Booked (${fullDayStudent?.name || 'Occupied'})`;
      } else if (formData.shift === 'full_day') {
        if (seatStudents.length === 0) {
          isAvailable = true;
          statusHint = 'Fully Available (All Shifts)';
        } else {
          isAvailable = false;
          const occupants = seatStudents
            .map((s) => `${s.shift === 'first_half' ? '1st Half' : '2nd Half'}: ${s.name}`)
            .join(', ');
          statusHint = `Not available for Full Day (Occupied by ${occupants})`;
        }
      } else if (formData.shift === 'first_half') {
        if (!hasFirstHalf) {
          isAvailable = true;
          if (hasSecondHalf) {
            const eveningStudent = seatStudents.find((s) => s.shift === 'second_half');
            statusHint = `Available (2nd Half occupied by ${eveningStudent?.name || 'Student'})`;
          } else {
            statusHint = 'Available (Empty Seat)';
          }
        } else {
          const morningStudent = seatStudents.find((s) => s.shift === 'first_half');
          isAvailable = false;
          statusHint = `1st Half already booked (${morningStudent?.name || 'Occupied'})`;
        }
      } else if (formData.shift === 'second_half') {
        if (!hasSecondHalf) {
          isAvailable = true;
          if (hasFirstHalf) {
            const morningStudent = seatStudents.find((s) => s.shift === 'first_half');
            statusHint = `Available (1st Half occupied by ${morningStudent?.name || 'Student'})`;
          } else {
            statusHint = 'Available (Empty Seat)';
          }
        } else {
          const eveningStudent = seatStudents.find((s) => s.shift === 'second_half');
          isAvailable = false;
          statusHint = `2nd Half already booked (${eveningStudent?.name || 'Occupied'})`;
        }
      } else {
        if (!hasFullDay && seatStudents.length < 2) {
          isAvailable = true;
          statusHint = seatStudents.length === 0 ? 'Empty Seat' : `Shared with ${seatStudents[0]?.name}`;
        } else {
          isAvailable = false;
          statusHint = 'Seat Fully Occupied';
        }
      }

      if (editData && editData.seatId === seat.id) {
        isAvailable = true;
        statusHint = 'Current Assigned Seat';
      }

      return {
        ...seat,
        isAvailable,
        statusHint,
        seatStudents,
      };
    });

    setSeatOptions(evaluatedSeats);
  }, [formData.sectionId, formData.shift, seats, students, editData]);

  const getShiftTimingString = () => {
    if (formData.shift === 'custom') {
      return `${formData.customStartTime} - ${formData.customEndTime} (Custom)`;
    }
    const currentShift = shiftsList.find((s) => s.id === formData.shift);
    return currentShift?.timing || 'Full Day';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim()) return;

    setLoading(true);
    try {
      const cycleInfo = getBillingCycleInfo();
      const payload = {
        ...formData,
        addons: selectedAddons,
        discountAmount: formData.discountAmount === '' ? 0 : Number(formData.discountAmount) || 0,
        seatId: formData.status === 'left' ? null : formData.seatId,
        shiftTiming: getShiftTimingString(),
        joinDate: cycleInfo.startDate.toISOString(),
        membershipStart: cycleInfo.startDate.toISOString(),
        membershipEnd: cycleInfo.endDate.toISOString(),
        isDayBased: cycleInfo.isDayBased,
        durationDays: cycleInfo.durationDays,
        durationMonths: cycleInfo.durationMonths,
        durationLabel: cycleInfo.durationLabel,
        planName: cycleInfo.planName,
        planPrice: cycleInfo.planPrice,
        finalPrice: cycleInfo.finalPrice,
        planFeatures: selectedPlan?.features || [],
        includedBenefits: selectedPlan?.features || [],
      };
      await onSubmit(payload);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getShiftIcon = (shiftId) => {
    switch (shiftId) {
      case 'full_day':
        return <Sun className="w-4 h-4 text-indigo-600" />;
      case 'first_half':
        return <Sunrise className="w-4 h-4 text-amber-600" />;
      case 'second_half':
        return <Sunset className="w-4 h-4 text-purple-600" />;
      default:
        return <Clock className="w-4 h-4 text-teal-600" />;
    }
  };

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsCompressing(true);
    try {
      const compressed = await compressImageFile(file, 480, 0.86);
      setFormData((prev) => ({ ...prev, photo: compressed }));
    } catch (err) {
      console.error('Error processing student photo:', err);
      alert('फोटो लोड नहीं हो सकी। कृपया दोबारा प्रयास करें।');
    } finally {
      setIsCompressing(false);
      try { e.target.value = ''; } catch (_) {}
    }
  };

  const handleRemovePhoto = () => {
    setFormData((prev) => ({ ...prev, photo: '' }));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editData ? 'Edit Student Admission & Shift' : 'Add New Student Admission'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Student Photo Upload & Capture Card with 2 Clear Options */}
        <div className="p-3.5 sm:p-4 bg-gradient-to-r from-slate-50 to-indigo-50/30 rounded-2xl border border-indigo-100/80 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3.5 sm:gap-4">
            {/* Avatar Preview Box */}
            <div className="relative group w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden bg-white border-2 border-slate-200 flex items-center justify-center shrink-0 shadow-sm ring-2 ring-indigo-500/10">
              {formData.photo ? (
                <>
                  <img
                    src={formData.photo}
                    alt="Student"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-1 right-1 bg-emerald-500 text-white rounded-full p-0.5 shadow-xs">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center text-slate-400">
                  <User className="w-9 h-9 stroke-[1.5]" />
                  <span className="text-[10px] font-bold text-slate-400 mt-0.5">No Photo</span>
                </div>
              )}

              {/* Compression loading indicator */}
              {isCompressing && (
                <div className="absolute inset-0 bg-slate-900/75 rounded-2xl flex flex-col items-center justify-center text-white z-10 backdrop-blur-2xs">
                  <div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                  <span className="text-[9px] font-bold mt-1">Compressing</span>
                </div>
              )}
            </div>

            {/* Photo Action Controls */}
            <div className="flex-1 min-w-0 space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Student Photo (विद्यार्थी फोटो)
                </span>
                {formData.photo ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full">
                    <Check className="w-3 h-3 stroke-[2.5]" /> HD Compressed (~40KB)
                  </span>
                ) : (
                  <span className="text-[11px] font-medium text-slate-400">
                    (Auto-compressed & Sharp)
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                2 आसान विकल्प: फोन/कंप्यूटर गैलरी से चुनें या सीधे लाइव कैमरे से फोटो खींचें।
              </p>

              {/* 2 Main Action Buttons: Gallery & Direct Camera */}
              <div className="pt-1 flex flex-wrap items-center gap-2">
                {/* Option 1: Choose from Gallery (Native Label Trigger) */}
                <label
                  htmlFor="student-gallery-file-input"
                  className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100/80 border border-slate-300 hover:border-slate-400 text-slate-700 rounded-xl text-xs font-bold shadow-2xs transition active:scale-95 select-none"
                >
                  <Image className="w-3.5 h-3.5 text-indigo-600" />
                  <span>{formData.photo ? '📁 गैलरी से बदलें' : '📁 Gallery (गैलरी से चुनें)'}</span>
                </label>

                {/* Option 2: Live Direct Camera */}
                <button
                  type="button"
                  onClick={() => setIsCameraModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-2xs shadow-indigo-600/20 transition cursor-pointer active:scale-95"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>{formData.photo ? '📸 कैमरे से नई लें' : '📸 Camera (कैमरा से लें)'}</span>
                </button>

                {/* Remove Button if photo is set */}
                {formData.photo && (
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 rounded-xl font-bold cursor-pointer transition ml-auto sm:ml-0"
                  >
                    <Trash2 className="w-3 h-3" /> हटाएं
                  </button>
                )}
              </div>

              {/* Native file input for Gallery option */}
              <input
                id="student-gallery-file-input"
                ref={galleryInputRef}
                type="file"
                accept="image/*"
                onClick={(e) => { e.target.value = ''; }}
                onChange={handlePhotoChange}
                className="sr-only"
              />
            </div>
          </div>
        </div>

        {/* Basic Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Student Full Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm"
              placeholder="e.g. Rahul Kumar"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Contact Phone * (10 Digits)
            </label>
            <input
              type="tel"
              required
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm"
              placeholder="e.g. 9876543210"
            />
          </div>
        </div>

        {/* Optional Info: Aadhaar Card & Email */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                <span>Aadhaar Card (आधार कार्ड)</span>
              </label>
              <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                Optional (वैकल्पिक)
              </span>
            </div>
            <input
              type="text"
              maxLength="12"
              value={formData.aadharCard}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 12);
                setFormData({ ...formData, aadharCard: val });
              }}
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm tracking-wider"
              placeholder="12-digit Aadhaar Number (वैकल्पिक)"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>Email Address (ईमेल)</span>
              </label>
              <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                Optional (वैकल्पिक)
              </span>
            </div>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm"
              placeholder="e.g. student@gmail.com (वैकल्पिक)"
            />
          </div>
        </div>

        {/* Joining Date & Student Status Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 bg-indigo-50/50 p-3.5 rounded-2xl border border-indigo-100/80">
          <div>
            <label className="block text-xs font-bold text-indigo-950 uppercase tracking-wider mb-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-indigo-600" />
              <span>Joining Date * (एडमिशन / फीस शुरू दिनांक)</span>
            </label>
            <input
              type="date"
              required
              value={formData.joinDate}
              onChange={(e) => setFormData({ ...formData, joinDate: e.target.value })}
              className="w-full px-3.5 py-2 border border-indigo-200 rounded-xl text-sm bg-white font-bold text-indigo-900 focus:ring-2 focus:ring-indigo-500"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              इस तारीख से छात्र का महीना और सब्सक्रिप्शन साइकिल शुरू होगा।
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Student Status (छात्र स्थिति)
            </label>
            <div className="grid grid-cols-2 gap-2 mt-1">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, status: 'active' })}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  formData.status === 'active'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Active (जारी)</span>
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, status: 'left', seatId: '' })}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  formData.status === 'left'
                    ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <UserX className="w-3.5 h-3.5" />
                <span>Left (छोड़ दिया)</span>
              </button>
            </div>
            {formData.status === 'left' && (
              <p className="text-[11px] text-rose-600 font-bold mt-1">
                Seat automatically free ho jayegi aur active list se hat jayega.
              </p>
            )}
          </div>
        </div>

        {/* Dynamic Shift Selection (Editable Timings from Settings) */}
        {formData.status === 'active' && (
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Seat Shift / Timing (शिफ्ट चुनें) *
              </label>
              <span className="text-[11px] text-indigo-600 font-semibold">Configured in Settings</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {shiftsList.map((shift) => {
                const isSelected = formData.shift === shift.id;
                return (
                  <label
                    key={shift.id}
                    className={`flex items-start gap-3 p-2.5 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-indigo-600 bg-white shadow-xs ring-2 ring-indigo-500/20'
                        : 'border-slate-200 bg-white/70 hover:bg-white hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="shift"
                      value={shift.id}
                      checked={isSelected}
                      onChange={() => setFormData({ ...formData, shift: shift.id, seatId: '' })}
                      className="mt-1 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 font-bold text-xs sm:text-sm text-slate-900">
                        {getShiftIcon(shift.id)}
                        <span>{shift.label}</span>
                      </div>
                      <p className="text-xs text-indigo-700 font-bold mt-0.5">{shift.timing}</p>
                    </div>
                  </label>
                );
              })}
            </div>

            {/* Custom Timing Pickers (if custom shift is selected) */}
            {formData.shift === 'custom' && (
              <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-[10px] font-bold text-teal-900 uppercase mb-1">Custom Start Time</label>
                  <input
                    type="text"
                    value={formData.customStartTime}
                    onChange={(e) => setFormData({ ...formData, customStartTime: e.target.value })}
                    placeholder="e.g. 06:00 AM"
                    className="w-full px-2.5 py-1.5 bg-white border border-teal-300 rounded-lg font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-teal-900 uppercase mb-1">Custom End Time</label>
                  <input
                    type="text"
                    value={formData.customEndTime}
                    onChange={(e) => setFormData({ ...formData, customEndTime: e.target.value })}
                    placeholder="e.g. 01:00 PM"
                    className="w-full px-2.5 py-1.5 bg-white border border-teal-300 rounded-lg font-semibold"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Section & Seat Assignment */}
        {formData.status === 'active' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Section *
              </label>
              <select
                value={formData.sectionId}
                onChange={(e) => setFormData({ ...formData, sectionId: e.target.value, seatId: '' })}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm font-semibold bg-white"
                required
              >
                <option value="">Select section</option>
                {sections.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.totalSeats} seats)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Seat Selection *
              </label>
              <select
                value={formData.seatId}
                onChange={(e) => {
                  const newSeatId = e.target.value;
                  setFormData({ ...formData, seatId: newSeatId });
                  if (newSeatId) {
                    const targetSeat = seats.find((s) => s.id === newSeatId);
                    if (targetSeat?.addons && Object.keys(targetSeat.addons).length > 0) {
                      setSelectedAddons(targetSeat.addons);
                    }
                  }
                }}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm font-semibold bg-white"
                disabled={!formData.sectionId}
              >
                <option value="">Select available seat</option>
                {seatOptions
                  .filter((s) => s.isAvailable)
                  .sort((a, b) => (Number(a.seatNumber) || 0) - (Number(b.seatNumber) || 0))
                  .map((s) => (
                    <option key={s.id} value={s.id}>
                      Seat #{s.seatNumber} — {s.statusHint}
                    </option>
                  ))}
              </select>
            </div>
          </div>
        )}

        {/* Seat Hardware Facilities (Addon Options) */}
        {formData.status === 'active' && configuredAddons.length > 0 && (
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between flex-wrap gap-1">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-indigo-600" />
                <span>Seat Hardware Facilities (ऐड-ऑन सुविधाएं):</span>
              </label>
              <span className="text-[10px] text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
                {configuredAddons.length} Configured in Settings
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {configuredAddons.map((item) => {
                const nameLower = item.name?.toLowerCase();
                const isCovered = isAddonCoveredByPlan(item.name);
                const isChecked = isCovered || Boolean(
                  selectedAddons[item.id] ||
                  (nameLower && selectedAddons[nameLower]) ||
                  (item.name && selectedAddons[item.name])
                );
                return (
                  <label
                    key={item.id || item.name}
                    className={`flex items-center justify-between gap-2 p-2.5 rounded-xl border text-xs font-bold cursor-pointer transition-all ${
                      isChecked
                        ? isCovered
                          ? 'border-emerald-500 bg-emerald-50/90 text-emerald-900 shadow-2xs ring-1 ring-emerald-400/50'
                          : 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-2xs'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        disabled={isCovered}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setSelectedAddons((prev) => {
                            const updated = { ...prev };
                            if (item.id) updated[item.id] = checked;
                            if (nameLower) updated[nameLower] = checked;
                            if (item.name) updated[item.name] = checked;
                            return updated;
                          });
                        }}
                        className="rounded text-indigo-600 focus:ring-indigo-500 shrink-0 cursor-pointer"
                      />
                      <span className="text-xs font-bold text-slate-800 break-words leading-tight">{item.name}</span>
                    </div>
                    {isCovered ? (
                      <span className="text-[10px] font-black text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300 shrink-0 flex items-center gap-1">
                        <Check className="w-3 h-3 text-emerald-600 stroke-[3]" /> Free
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-indigo-900 shrink-0 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                        ₹{item.monthlyCharge}/month
                      </span>
                    )}
                  </label>
                );
              })}
            </div>
          </div>
        )}

        {/* Membership Plan & Special Discount */}
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Membership Plan (सब्सक्रिप्शन प्लान) *
              </label>
              <select
                value={formData.membershipPlanId}
                onChange={(e) => {
                  const val = e.target.value;
                  setFormData({
                    ...formData,
                    membershipPlanId: val,
                    isCustomDays: val === 'custom_days',
                  });
                }}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm bg-white font-semibold focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select membership plan</option>
                <optgroup label="✨ Available Plans">
                  {plans
                    .filter((p) => p.isActive !== false)
                    .map((p) => {
                      const isDay = p.durationUnit === 'days' || (p.durationDays && !p.durationMonths);
                      return (
                        <option key={p.id} value={p.id}>
                          {p.name} — ₹{p.price}
                        </option>
                      );
                    })}
                </optgroup>
                <optgroup label="🎯 Custom Days (परीक्षा व अन्य)">
                  <option value="custom_days">
                    🗓️ Custom Days (कस्टम दिन - जैसे 10 दिन, 15 दिन)
                  </option>
                </optgroup>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-emerald-600" />
                <span>Discount (छूट ₹)</span>
              </label>
              <input
                type="number"
                min="0"
                value={formData.discountAmount}
                onChange={(e) => setFormData({ ...formData, discountAmount: e.target.value })}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm bg-white font-bold text-emerald-700 focus:ring-2 focus:ring-emerald-500"
                placeholder="e.g. 100"
              />
            </div>
          </div>

          {/* Plan Included Benefits Pill Banner */}
          {selectedPlan?.features && selectedPlan.features.length > 0 && (
            <div className="bg-emerald-50/90 border border-emerald-200 rounded-2xl p-3 animate-in fade-in">
              <div className="flex items-center gap-1.5 text-xs font-black text-emerald-900 mb-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>Plan Included Benefits (इस प्लान में फ्री शामिल सुविधाएं):</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {selectedPlan.features.map((perk, i) => (
                  <span
                    key={i}
                    className="text-[11px] font-bold bg-white text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-xl shadow-2xs flex items-center gap-1"
                  >
                    <Check className="w-3 h-3 text-emerald-600 stroke-[3]" />
                    <span>{perk}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Custom Days Input Block */}
          {formData.membershipPlanId === 'custom_days' && (
            <div className="p-3 bg-indigo-50/80 border border-indigo-200 rounded-xl grid grid-cols-1 sm:grid-cols-2 gap-3 animate-in fade-in duration-150">
              <div>
                <label className="block text-[11px] font-bold text-indigo-950 uppercase mb-1">
                  Days Duration (कितने दिन पढ़ना है) *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={formData.customDays}
                  onChange={(e) => setFormData({ ...formData, customDays: e.target.value })}
                  placeholder="e.g. 10"
                  className="w-full px-3 py-2 bg-white border border-indigo-300 rounded-lg font-bold text-sm text-indigo-900 focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-indigo-950 uppercase mb-1">
                  Total Plan Fee (कुल फीस ₹) *
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={formData.customFeeAmount}
                  onChange={(e) => setFormData({ ...formData, customFeeAmount: e.target.value })}
                  placeholder="e.g. 400"
                  className="w-full px-3 py-2 bg-white border border-indigo-300 rounded-lg font-bold text-sm text-indigo-900 focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* Dynamic Billing Cycle & Price Preview Card */}
        <div className="p-3.5 bg-emerald-50/70 rounded-2xl border border-emerald-200 text-xs text-emerald-950 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="font-bold block">
              📅 Validity ({cycleInfo.durationLabel}):
            </span>
            <span className="font-black bg-emerald-100 text-emerald-900 px-2.5 py-0.5 rounded-md text-xs">
              Expires On: {formatDate(cycleInfo.endDate)}
            </span>
          </div>

          <p className="text-[11px] text-emerald-800">
            <strong>{formatDate(cycleInfo.startDate)}</strong> से <strong>{formatDate(cycleInfo.endDate)}</strong> तक ({cycleInfo.durationLabel}) valid रहेगा।
          </p>

          <div className="pt-1 border-t border-emerald-200/60 flex items-center justify-between text-xs">
            <span>
              Plan Rate: <strong>₹{cycleInfo.planPrice}</strong>
              {cycleInfo.addonTotal > 0 && (
                <span className="text-indigo-700 font-bold ml-1.5">
                  (+₹{cycleInfo.addonTotal} {Object.keys(cycleInfo.addonCharges || {}).join(', ')} Addon)
                </span>
              )}
              {cycleInfo.discount > 0 && <span className="text-emerald-700 font-bold ml-1.5">(-₹{cycleInfo.discount} Discount)</span>}
            </span>
            <span className="font-black text-sm text-emerald-900">
              Payable: {formatCurrency(cycleInfo.finalPrice)}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
          <Button variant="secondary" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            {editData ? 'Update Student' : 'Save & Book Seat'}
          </Button>
        </div>
      </form>

      {/* Direct Live Camera Modal */}
      <CameraCaptureModal
        isOpen={isCameraModalOpen}
        onClose={() => setIsCameraModalOpen(false)}
        onCapture={(photoDataUrl) => {
          setFormData((prev) => ({ ...prev, photo: photoDataUrl }));
        }}
      />
    </Modal>
  );
}
