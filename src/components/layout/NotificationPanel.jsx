import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  Clock,
  AlertTriangle,
  MessageSquare,
  IndianRupee,
  CheckCircle2,
  X,
  ChevronRight,
  UserCheck,
  UserX,
  AlertCircle,
} from 'lucide-react';
import { COLLECTIONS, SEAT_STATUS } from '../../utils/constants';
import { formatDate, formatReminderTime } from '../../utils/helpers';
import { fetchCollectionData, updateDocument, getFirestoreDocRef } from '../../firebase/storageService';
import { getDoc } from 'firebase/firestore';
import { getActiveTemplates, renderTemplate } from '../../utils/templateHelpers';
import StudentLeftOverdueModal from '../fees/StudentLeftOverdueModal';

export default function NotificationPanel({ isOpen, onClose }) {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [fees, setFees] = useState([]);
  const [sections, setSections] = useState([]);
  const [seats, setSeats] = useState([]);
  const [visitors, setVisitors] = useState([]);
  const [libraryName, setLibraryName] = useState('Study Point Library');
  const [loading, setLoading] = useState(true);
  const [filterTab, setFilterTab] = useState('all'); // 'all' | 'ending_soon' | 'expired' | 'overdue' | 'demos'

  // Modal state for Overdue Left Action
  const [leftConfirmTarget, setLeftConfirmTarget] = useState(null);
  const [markingLeftLoading, setMarkingLeftLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    // Load cached library name immediately
    const savedSettings = localStorage.getItem('studypoint_settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        if (parsed.studyPointName) setLibraryName(parsed.studyPointName);
      } catch (e) {}
    }

    const loadData = async () => {
      setLoading(true);
      try {
        const [stuDocs, feeDocs, secDocs, seatDocs, visitorDocs] = await Promise.all([
          fetchCollectionData(COLLECTIONS.STUDENTS),
          fetchCollectionData(COLLECTIONS.FEES),
          fetchCollectionData(COLLECTIONS.SECTIONS),
          fetchCollectionData(COLLECTIONS.SEATS),
          fetchCollectionData(COLLECTIONS.VISITORS),
        ]);
        setStudents(stuDocs || []);
        setFees(feeDocs || []);
        setSections(secDocs || []);
        setSeats(seatDocs || []);
        setVisitors(visitorDocs || []);

        try {
          const settingsSnap = await getDoc(getFirestoreDocRef(COLLECTIONS.SETTINGS, 'ownerProfile'));
          if (settingsSnap.exists() && settingsSnap.data().studyPointName) {
            setLibraryName(settingsSnap.data().studyPointName);
          }
        } catch (err) {}
      } catch (e) {
        console.error('Error fetching notification data', e);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [isOpen]);

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  // Group active students with membershipEnd
  const activeExpiringList = students
    .filter((s) => s.status === 'active' && s.membershipEnd)
    .map((s) => {
      const endD = s.membershipEnd?.toDate
        ? s.membershipEnd.toDate()
        : new Date(s.membershipEnd);
      endD.setHours(0, 0, 0, 0);

      const diffTime = endD.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      const seat = seats.find((st) => st.id === s.seatId);
      const section = sections.find((sec) => sec.id === s.sectionId);
      const fee =
        fees.find((f) => f.studentId === s.id && f.status === 'pending') ||
        fees.find((f) => f.studentId === s.id);

      return {
        ...s,
        expiryDate: endD,
        diffDays,
        seatNumber: seat ? seat.seatNumber : '—',
        sectionName: section ? section.name : '—',
        seat,
        fee,
      };
    });

  // 1. Ending Soon (0 to 3 Days Remaining)
  const endingSoonStudents = activeExpiringList
    .filter((s) => s.diffDays >= 0 && s.diffDays <= 3)
    .sort((a, b) => a.diffDays - b.diffDays);

  // 2. Expired (1 to 2 Days Expired - Grace Period)
  const expiredStudents = activeExpiringList
    .filter((s) => s.diffDays < 0 && s.diffDays >= -2)
    .sort((a, b) => a.diffDays - b.diffDays);

  // 3. Overdue (>2 Days Expired - Critical Action)
  const overdueStudents = activeExpiringList
    .filter((s) => s.diffDays < -2)
    .sort((a, b) => a.diffDays - b.diffDays);

  // 4. Demo Alerts (Last Day of Demo + Demo Expired)
  const demoAlerts = visitors
    .filter((v) => {
      if (v.status === 'converted' || v.status === 'not_interested' || v.purpose === 'inquiry') {
        return false;
      }
      return true;
    })
    .map((v) => {
      const endD = new Date(v.endDate || v.startDate || now);
      endD.setHours(0, 0, 0, 0);
      const diffTime = endD.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      const seat = seats.find((st) => st.id === v.seatId);
      const section = sections.find((sec) => sec.id === v.sectionId);

      return {
        ...v,
        diffDays,
        endDateFormatted: formatDate(endD),
        seatNumber: seat ? seat.seatNumber : '—',
        sectionName: section ? section.name : '—',
        isToday: diffDays === 0,
        isExpired: diffDays < 0,
      };
    })
    .filter((v) => v.isToday || v.isExpired)
    .sort((a, b) => a.diffDays - b.diffDays);

  const totalAlertsCount =
    endingSoonStudents.length +
    expiredStudents.length +
    overdueStudents.length +
    demoAlerts.length;

  const isDateToday = (dateStr) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    return !isNaN(d.getTime()) && d.toDateString() === new Date().toDateString();
  };

  const sentTodayCount = [
    ...students.filter(
      (s) =>
        isDateToday(s.lastReminderAt) ||
        isDateToday(s.lastExpiryReminderAt)
    ),
    ...visitors.filter((v) => isDateToday(v.lastReminderAt)),
  ].length;

  const handleWhatsAppReminder = async (student, type = 'ending_soon') => {
    const cleanPhone = (student.phone || '').replace(/\D/g, '');
    const phoneWithCountry = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const currentTemplates = getActiveTemplates();

    let message = '';
    const expiryFormatted = formatDate(student.expiryDate);
    const absDays = Math.abs(student.diffDays);

    if (type === 'ending_soon') {
      const statusPhrase =
        student.diffDays === 0
          ? 'आज समाप्त हो रही है'
          : student.diffDays === 1
          ? 'कल समाप्त होने वाली है (1 दिन शेष)'
          : `${student.diffDays} दिन बाद (${expiryFormatted}) समाप्त होने वाली है`;

      const tpl = currentTemplates.endingSoonReminder?.template || currentTemplates.expiryReminder?.template;
      message = renderTemplate(tpl, {
        student_name: student.name || 'Student',
        library_name: libraryName,
        seat_number: student.seatNumber || '—',
        shift: student.shiftTiming || 'Shift',
        status_phrase: statusPhrase,
        expiry_date: expiryFormatted,
        days_left: student.diffDays,
        phone: student.phone || '',
      });
    } else if (type === 'expired') {
      const statusPhrase = `${absDays} दिन पहले (${expiryFormatted}) समाप्त हो चुकी है`;
      const tpl = currentTemplates.expiredReminder?.template || currentTemplates.expiryReminder?.template;
      message = renderTemplate(tpl, {
        student_name: student.name || 'Student',
        library_name: libraryName,
        seat_number: student.seatNumber || '—',
        shift: student.shiftTiming || 'Shift',
        status_phrase: statusPhrase,
        expiry_date: expiryFormatted,
        days_left: absDays,
        phone: student.phone || '',
      });
    } else if (type === 'overdue') {
      const statusPhrase = `${absDays} दिन पहले (${expiryFormatted}) समाप्त हो चुकी है (Critical Overdue)`;
      const tpl = currentTemplates.overdueReminder?.template || currentTemplates.expiryReminder?.template;
      message = renderTemplate(tpl, {
        student_name: student.name || 'Student',
        library_name: libraryName,
        seat_number: student.seatNumber || '—',
        shift: student.shiftTiming || 'Shift',
        status_phrase: statusPhrase,
        expiry_date: expiryFormatted,
        days_left: absDays,
        phone: student.phone || '',
      });
    }

    const nowIso = new Date().toISOString();
    try {
      await updateDocument(COLLECTIONS.STUDENTS, student.id, {
        lastExpiryReminderAt: nowIso,
        lastReminderAt: nowIso,
        lastReminderType: type,
      });
      setStudents((prev) =>
        prev.map((s) =>
          s.id === student.id
            ? { ...s, lastExpiryReminderAt: nowIso, lastReminderAt: nowIso, lastReminderType: type }
            : s
        )
      );
    } catch (err) {
      console.error('Error saving reminder timestamp:', err);
    }

    const waUrl = `https://api.whatsapp.com/send?phone=${phoneWithCountry}&text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  const handleDemoWhatsApp = async (demo) => {
    const cleanPhone = (demo.phone || '').replace(/\D/g, '');
    const phoneWithCountry = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const currentTemplates = getActiveTemplates();

    let message = '';
    if (demo.isToday) {
      message = renderTemplate(currentTemplates.demoEndingToday?.template, {
        student_name: demo.name || 'Student',
        library_name: libraryName,
        seat_number: demo.seatNumber || '—',
        shift: demo.shift || 'Shift',
        phone: demo.phone || '',
      });
    } else {
      message = renderTemplate(currentTemplates.demoExpired?.template, {
        student_name: demo.name || 'Student',
        library_name: libraryName,
        seat_number: demo.seatNumber || '—',
        shift: demo.shift || 'Shift',
        phone: demo.phone || '',
      });
    }

    const nowIso = new Date().toISOString();
    try {
      await updateDocument(COLLECTIONS.VISITORS, demo.id, {
        lastReminderAt: nowIso,
      });
      setVisitors((prev) =>
        prev.map((v) => (v.id === demo.id ? { ...v, lastReminderAt: nowIso } : v))
      );
    } catch (err) {
      console.error('Error saving demo reminder timestamp:', err);
    }

    const waUrl = `https://api.whatsapp.com/send?phone=${phoneWithCountry}&text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  const handleAdmitDemoStudent = (demo) => {
    onClose();
    navigate('/students', {
      state: {
        convertVisitor: {
          visitorId: demo.id,
          name: demo.name || '',
          phone: demo.phone || '',
          sectionId: demo.sectionId || '',
          seatId: demo.seatId || '',
          shift: demo.shift || 'full_day',
          notes: demo.notes ? `Converted from Demo. Notes: ${demo.notes}` : 'Converted from Demo',
        },
      },
    });
  };

  const handleMarkDemoNotInterested = async (demo) => {
    if (!window.confirm(`Mark "${demo.name}" as Not Interested? Their trial seat will be freed up.`)) return;
    try {
      await updateDocument(COLLECTIONS.VISITORS, demo.id, {
        status: 'not_interested',
        seatId: '',
        notInterestedAt: new Date().toISOString(),
      });
      setVisitors((prev) =>
        prev.map((v) => (v.id === demo.id ? { ...v, status: 'not_interested', seatId: '' } : v))
      );
    } catch (err) {
      console.error('Error marking demo not interested:', err);
    }
  };

  // Confirm Left Action directly from Notification Center
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

      // Update local state to immediately vanish from list
      setStudents((prev) => prev.filter((s) => s.id !== student.id));
      setLeftConfirmTarget(null);
    } catch (err) {
      console.error('Error marking student left from notifications:', err);
      alert('Error marking student as left. Please try again.');
    } finally {
      setMarkingLeftLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-50 bg-gray-900/30 backdrop-blur-2xs" onClick={onClose} />

      {/* Dropdown Container */}
      <div className="fixed top-16 right-3 sm:right-6 z-50 w-[94vw] sm:w-[480px] max-h-[85vh] bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
              <Bell className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-sm leading-tight">Notification Center</h3>
              <p className="text-[11px] text-indigo-100 font-medium">
                {totalAlertsCount} actionable alerts {sentTodayCount > 0 ? `• ✅ ${sentTodayCount} reminded today` : '• 0 sent today'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Filters matching Fees Module */}
        <div className="flex items-center border-b border-gray-100 bg-gray-50/90 px-3 py-2 gap-1.5 shrink-0 text-xs font-bold overflow-x-auto scrollbar-hide">
          <button
            onClick={() => setFilterTab('all')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              filterTab === 'all'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            All ({totalAlertsCount})
          </button>

          <button
            onClick={() => setFilterTab('ending_soon')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 whitespace-nowrap ${
              filterTab === 'ending_soon'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'text-amber-800 hover:text-amber-900 bg-amber-50'
            }`}
          >
            <Clock className="w-3 h-3" />
            <span>Ending Soon ({endingSoonStudents.length})</span>
          </button>

          <button
            onClick={() => setFilterTab('expired')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 whitespace-nowrap ${
              filterTab === 'expired'
                ? 'bg-orange-500 text-white shadow-xs'
                : 'text-orange-800 hover:text-orange-900 bg-orange-50'
            }`}
          >
            <AlertTriangle className="w-3 h-3" />
            <span>Expired ({expiredStudents.length})</span>
          </button>

          <button
            onClick={() => setFilterTab('overdue')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 whitespace-nowrap ${
              filterTab === 'overdue'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-rose-700 hover:text-rose-900 bg-rose-50'
            }`}
          >
            <AlertCircle className="w-3 h-3" />
            <span>Overdue ({overdueStudents.length})</span>
          </button>

          <button
            onClick={() => setFilterTab('demos')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 whitespace-nowrap ${
              filterTab === 'demos'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-indigo-700 hover:text-indigo-900 bg-indigo-50'
            }`}
          >
            <UserCheck className="w-3 h-3" />
            <span>Demo Alerts ({demoAlerts.length})</span>
          </button>
        </div>

        {/* Notification List Scroll Area */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4 divide-y divide-gray-50">
          {loading ? (
            <div className="p-8 text-center text-gray-400 text-xs font-medium">
              Checking real-time notifications...
            </div>
          ) : totalAlertsCount === 0 ? (
            <div className="p-8 text-center">
              <div className="w-12 h-12 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-2">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-gray-800">Everything is up to date!</p>
              <p className="text-xs text-gray-500 mt-0.5">
                No ending memberships, expired grace periods, overdue dues, or demo alerts.
              </p>
            </div>
          ) : (
            <>
              {/* 1. OVERDUE (>2 DAYS) - CRITICAL ALERTS */}
              {(filterTab === 'all' || filterTab === 'overdue') && overdueStudents.length > 0 && (
                <div className="space-y-2 pt-2 first:pt-0">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-extrabold text-rose-900 uppercase tracking-wider flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                      Critical Overdue Alerts ({overdueStudents.length})
                    </span>
                    <span className="text-[10px] bg-rose-100 text-rose-800 font-bold px-2 py-0.5 rounded-full">
                      {'>'}2 Days Overdue
                    </span>
                  </div>

                  {overdueStudents.map((st) => {
                    const absDays = Math.abs(st.diffDays);
                    const reminderInfo = formatReminderTime(st.lastExpiryReminderAt || st.lastReminderAt);

                    return (
                      <div
                        key={st.id}
                        className="p-3 rounded-xl border bg-rose-50/60 border-rose-200 transition-all space-y-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-bold text-gray-900 text-sm leading-tight">
                                {st.name}
                              </p>
                              <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-rose-600 text-white">
                                🚨 Overdue ({absDays}d ago)
                              </span>
                            </div>

                            <p className="text-xs text-gray-600 mt-1 flex flex-wrap items-center gap-2">
                              <span>📍 {st.sectionName} • <strong>Seat #{st.seatNumber}</strong></span>
                              <span>•</span>
                              <span>⏰ {st.shiftTiming || 'Full Day'}</span>
                            </p>

                            <div className="flex flex-wrap items-center gap-2 mt-1">
                              <p className="text-[11px] text-gray-500">
                                Expired On: <strong>{formatDate(st.expiryDate)}</strong> • Phone: {st.phone}
                              </p>
                              {reminderInfo ? (
                                <span
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 ${
                                    reminderInfo.isToday
                                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                      : 'bg-slate-100 text-slate-700'
                                  }`}
                                >
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  <span>{reminderInfo.text}</span>
                                </span>
                              ) : (
                                <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                                  ⏳ Not sent yet
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Overdue Action Buttons: Left, WhatsApp & Collect */}
                        <div className="pt-2 border-t border-rose-200/60 flex flex-wrap items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setLeftConfirmTarget({ student: st, fee: st.fee, seat: st.seat })}
                            className="px-2.5 py-1 bg-white hover:bg-rose-100 text-rose-700 border border-rose-300 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 shadow-2xs cursor-pointer whitespace-nowrap"
                            title="Confirm Student Left and free seat"
                          >
                            <UserX className="w-3.5 h-3.5 text-rose-600" />
                            <span>Left (Free Seat)</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleWhatsAppReminder(st, 'overdue')}
                            className={`px-2.5 py-1 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1 shadow-2xs cursor-pointer whitespace-nowrap ${
                              reminderInfo?.isToday
                                ? 'bg-emerald-700 hover:bg-emerald-800 ring-1 ring-emerald-400'
                                : 'bg-green-600 hover:bg-green-700'
                            }`}
                            title={reminderInfo?.isToday ? 'Reminder already sent today. Click to resend' : 'Send WhatsApp Overdue Warning'}
                          >
                            <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                            <span>{reminderInfo?.isToday ? 'Resend' : 'WhatsApp'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              onClose();
                              navigate('/fees', {
                                state: { statusFilter: 'overdue', collectStudentId: st.id },
                              });
                            }}
                            className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1 shadow-2xs cursor-pointer whitespace-nowrap"
                          >
                            <IndianRupee className="w-3.5 h-3.5 shrink-0" />
                            <span>Collect / Renew</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* 2. EXPIRED (1-2 DAYS GRACE) */}
              {(filterTab === 'all' || filterTab === 'expired') && expiredStudents.length > 0 && (
                <div className="space-y-2 pt-3 first:pt-0">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-extrabold text-orange-900 uppercase tracking-wider flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-orange-600" />
                      Membership Expired (1-2d Grace) ({expiredStudents.length})
                    </span>
                    <span className="text-[10px] bg-orange-100 text-orange-800 font-bold px-2 py-0.5 rounded-full">
                      Grace Period
                    </span>
                  </div>

                  {expiredStudents.map((st) => {
                    const absDays = Math.abs(st.diffDays);
                    const reminderInfo = formatReminderTime(st.lastExpiryReminderAt || st.lastReminderAt);

                    return (
                      <div
                        key={st.id}
                        className="p-3 rounded-xl border bg-orange-50/60 border-orange-200 transition-all space-y-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-bold text-gray-900 text-sm leading-tight">
                                {st.name}
                              </p>
                              <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-orange-600 text-white">
                                ⚠️ Expired ({absDays}d Grace)
                              </span>
                            </div>

                            <p className="text-xs text-gray-600 mt-1 flex flex-wrap items-center gap-2">
                              <span>📍 {st.sectionName} • <strong>Seat #{st.seatNumber}</strong></span>
                              <span>•</span>
                              <span>⏰ {st.shiftTiming || 'Full Day'}</span>
                            </p>

                            <div className="flex flex-wrap items-center gap-2 mt-1">
                              <p className="text-[11px] text-gray-500">
                                Expired: <strong>{formatDate(st.expiryDate)}</strong> • Phone: {st.phone}
                              </p>
                              {reminderInfo ? (
                                <span
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 ${
                                    reminderInfo.isToday
                                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                      : 'bg-slate-100 text-slate-700'
                                  }`}
                                >
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  <span>{reminderInfo.text}</span>
                                </span>
                              ) : (
                                <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                                  ⏳ Not sent yet
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons: WhatsApp & Collect */}
                        <div className="pt-2 border-t border-orange-200/60 flex flex-wrap items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleWhatsAppReminder(st, 'expired')}
                            className={`px-2.5 py-1 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1 shadow-2xs cursor-pointer whitespace-nowrap ${
                              reminderInfo?.isToday
                                ? 'bg-emerald-700 hover:bg-emerald-800 ring-1 ring-emerald-400'
                                : 'bg-green-600 hover:bg-green-700'
                            }`}
                            title={reminderInfo?.isToday ? 'Reminder already sent today. Click to resend' : 'Send pre-filled WhatsApp grace reminder'}
                          >
                            <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                            <span>{reminderInfo?.isToday ? 'Resend' : 'WhatsApp'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              onClose();
                              navigate('/fees', {
                                state: { statusFilter: 'expired', collectStudentId: st.id },
                              });
                            }}
                            className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1 shadow-2xs cursor-pointer whitespace-nowrap"
                          >
                            <IndianRupee className="w-3.5 h-3.5 shrink-0" />
                            <span>Collect Fee</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* 3. ENDING SOON (0-3 DAYS REMAINING) */}
              {(filterTab === 'all' || filterTab === 'ending_soon') && endingSoonStudents.length > 0 && (
                <div className="space-y-2 pt-3 first:pt-0">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-extrabold text-amber-900 uppercase tracking-wider flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                      Ending Soon (0-3 Days Left) ({endingSoonStudents.length})
                    </span>
                    <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full">
                      Advance Alert
                    </span>
                  </div>

                  {endingSoonStudents.map((st) => {
                    const isToday = st.diffDays === 0;
                    const reminderInfo = formatReminderTime(st.lastExpiryReminderAt || st.lastReminderAt);

                    return (
                      <div
                        key={st.id}
                        className={`p-3 rounded-xl border transition-all space-y-2 ${
                          isToday ? 'bg-rose-50/60 border-rose-200' : 'bg-amber-50/60 border-amber-200'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-bold text-gray-900 text-sm leading-tight">
                                {st.name}
                              </p>
                              <span
                                className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                                  isToday
                                    ? 'bg-rose-600 text-white animate-pulse'
                                    : 'bg-amber-500 text-white'
                                }`}
                              >
                                {isToday
                                  ? '⏳ Ends TODAY!'
                                  : st.diffDays === 1
                                  ? '⏳ 1 Day Left'
                                  : `⏳ ${st.diffDays} Days Left`}
                              </span>
                            </div>

                            <p className="text-xs text-gray-600 mt-1 flex flex-wrap items-center gap-2">
                              <span>📍 {st.sectionName} • <strong>Seat #{st.seatNumber}</strong></span>
                              <span>•</span>
                              <span>⏰ {st.shiftTiming || 'Full Day'}</span>
                            </p>

                            <div className="flex flex-wrap items-center gap-2 mt-1">
                              <p className="text-[11px] text-gray-500">
                                Valid Till: <strong>{formatDate(st.expiryDate)}</strong> • Phone: {st.phone}
                              </p>
                              {reminderInfo ? (
                                <span
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 ${
                                    reminderInfo.isToday
                                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                      : 'bg-slate-100 text-slate-700'
                                  }`}
                                >
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  <span>{reminderInfo.text}</span>
                                </span>
                              ) : (
                                <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                                  ⏳ Not sent yet
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons: WhatsApp & Collect */}
                        <div className="pt-2 border-t border-amber-200/60 flex flex-wrap items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleWhatsAppReminder(st, 'ending_soon')}
                            className={`px-2.5 py-1 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1 shadow-2xs cursor-pointer whitespace-nowrap ${
                              reminderInfo?.isToday
                                ? 'bg-emerald-700 hover:bg-emerald-800 ring-1 ring-emerald-400'
                                : 'bg-green-600 hover:bg-green-700'
                            }`}
                            title={reminderInfo?.isToday ? 'Reminder already sent today. Click to resend' : 'Send pre-filled WhatsApp renewal reminder'}
                          >
                            <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                            <span>{reminderInfo?.isToday ? 'Resend' : 'WhatsApp'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              onClose();
                              navigate('/fees', {
                                state: { statusFilter: 'ending_soon', collectStudentId: st.id },
                              });
                            }}
                            className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1 shadow-2xs cursor-pointer whitespace-nowrap"
                          >
                            <IndianRupee className="w-3.5 h-3.5 shrink-0" />
                            <span>Collect Fee</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* 4. DEMO ALERTS (LAST DAY & EXPIRED DEMOS) */}
              {(filterTab === 'all' || filterTab === 'demos') && demoAlerts.length > 0 && (
                <div className="space-y-2 pt-3 first:pt-0">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-extrabold text-indigo-900 uppercase tracking-wider flex items-center gap-1">
                      <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
                      Free Demo Trial Alerts ({demoAlerts.length})
                    </span>
                    <span className="text-[10px] bg-indigo-100 text-indigo-800 font-bold px-2 py-0.5 rounded-full">
                      Action Required
                    </span>
                  </div>

                  {demoAlerts.map((demo) => {
                    const isToday = demo.isToday;
                    const reminderInfo = formatReminderTime(demo.lastReminderAt);

                    return (
                      <div
                        key={demo.id}
                        className={`p-3 rounded-xl border transition-all ${
                          isToday
                            ? 'bg-amber-50/70 border-amber-200'
                            : 'bg-rose-50/70 border-rose-200'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-gray-900 text-sm leading-tight truncate">
                                {demo.name}
                              </p>
                              <span
                                className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md ${
                                  isToday
                                    ? 'bg-amber-500 text-white'
                                    : 'bg-rose-600 text-white'
                                }`}
                              >
                                {isToday ? '⏳ Last Day of Demo (Ending Today)' : '❌ Demo Expired'}
                              </span>
                            </div>

                            <p className="text-xs text-gray-600 mt-1">
                              📍 {demo.sectionName} • Seat #{demo.seatNumber} • ⏰ {demo.shift || 'Full Day'}
                            </p>

                            <div className="flex items-center gap-2 mt-1">
                              <p className="text-[11px] text-gray-500">
                                Trial Date: <strong>{demo.endDateFormatted}</strong> • Phone: {demo.phone}
                              </p>
                              {reminderInfo ? (
                                <span
                                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-1 ${
                                    reminderInfo.isToday
                                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                      : 'bg-slate-100 text-slate-700'
                                  }`}
                                >
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  <span>{reminderInfo.text}</span>
                                </span>
                              ) : (
                                <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-md">
                                  ⏳ Not sent yet
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons for Demo: WhatsApp, Admit, Not Interested */}
                        <div className="mt-2.5 pt-2 border-t border-gray-200/60 flex items-center justify-end gap-2 flex-wrap">
                          <button
                            type="button"
                            onClick={() => handleDemoWhatsApp(demo)}
                            className={`px-2.5 py-1 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1 shadow-2xs cursor-pointer ${
                              reminderInfo?.isToday
                                ? 'bg-emerald-700 hover:bg-emerald-800 ring-1 ring-emerald-400'
                                : 'bg-green-600 hover:bg-green-700'
                            }`}
                            title={reminderInfo?.isToday ? 'Follow-up already sent today. Click to resend' : 'Send WhatsApp Follow-up / Offer'}
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>{reminderInfo?.isToday ? 'Resend' : 'WhatsApp'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleAdmitDemoStudent(demo)}
                            className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1 shadow-2xs cursor-pointer"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>Admit Student</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleMarkDemoNotInterested(demo)}
                            className="px-2 py-1 bg-white hover:bg-gray-100 text-gray-600 border border-gray-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                          >
                            Not Interested
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500 shrink-0">
          <span>🔔 Real-time Ending Soon (0-3d), Expired (1-2d) & Overdue ({'>'}2d) Alerts</span>
          <button
            onClick={() => {
              onClose();
              navigate('/fees');
            }}
            className="text-indigo-600 font-bold hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>All Fees & Subscriptions</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Student Left Confirmation Modal for Overdue Alerts */}
      <StudentLeftOverdueModal
        isOpen={Boolean(leftConfirmTarget)}
        onClose={() => setLeftConfirmTarget(null)}
        target={leftConfirmTarget}
        loading={markingLeftLoading}
        onConfirmLeft={handleConfirmMarkLeft}
        onRenew={() => {
          const st = leftConfirmTarget?.student;
          setLeftConfirmTarget(null);
          onClose();
          navigate('/fees', {
            state: { statusFilter: 'overdue', collectStudentId: st?.id },
          });
        }}
      />
    </>
  );
}
