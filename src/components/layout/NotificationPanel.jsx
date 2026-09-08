import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  Clock,
  AlertTriangle,
  MessageSquare,
  IndianRupee,
  Armchair,
  CheckCircle2,
  X,
  ExternalLink,
  ChevronRight,
  UserCheck,
  UserPlus,
  UserX,
} from 'lucide-react';
import { COLLECTIONS } from '../../utils/constants';
import { formatDate, formatCurrency, formatReminderTime } from '../../utils/helpers';
import { fetchCollectionData, updateDocument, getFirestoreDocRef } from '../../firebase/storageService';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { getActiveTemplates, renderTemplate } from '../../utils/templateHelpers';

export default function NotificationPanel({ isOpen, onClose }) {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [fees, setFees] = useState([]);
  const [sections, setSections] = useState([]);
  const [seats, setSeats] = useState([]);
  const [visitors, setVisitors] = useState([]);
  const [libraryName, setLibraryName] = useState('Study Point Library');
  const [loading, setLoading] = useState(true);
  const [filterTab, setFilterTab] = useState('all'); // 'all' | 'demos' | 'expiring' | 'fees'

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

  // 1. Calculate Students Expiring in <= 3 Days or Already Expired
  const expiringStudents = students
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

      return {
        ...s,
        expiryDate: endD,
        diffDays,
        seatNumber: seat ? seat.seatNumber : '—',
        sectionName: section ? section.name : '—',
      };
    })
    .filter((s) => s.diffDays <= 3) // <= 3 days advance alert!
    .sort((a, b) => a.diffDays - b.diffDays);

  // 2. Calculate Pending Fees for Current Month
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const currentMonthFees = fees.filter((f) => f.month === currentMonth);

  const pendingFeeStudents = students
    .filter((s) => s.status === 'active')
    .map((s) => {
      const feeRecord = currentMonthFees.find((f) => f.studentId === s.id);
      const isPaid = feeRecord && feeRecord.status === 'paid';
      const seat = seats.find((st) => st.id === s.seatId);
      return {
        student: s,
        feeRecord,
        isPaid,
        seatNumber: seat ? seat.seatNumber : '—',
      };
    })
    .filter((item) => !item.isPaid);

  // 3. Demo Alerts: (1) Last Day of Demo (Ending Today) and (2) Demo Expired
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

  const totalAlertsCount = expiringStudents.length + pendingFeeStudents.length + demoAlerts.length;

  const isDateToday = (dateStr) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    return !isNaN(d.getTime()) && d.toDateString() === new Date().toDateString();
  };

  const sentTodayCount = [
    ...students.filter(
      (s) =>
        isDateToday(s.lastReminderAt) ||
        isDateToday(s.lastExpiryReminderAt) ||
        (s.lastFeeReminderMonth === currentMonth && isDateToday(s.lastFeeReminderAt))
    ),
    ...visitors.filter((v) => isDateToday(v.lastReminderAt)),
  ].length;

  const handleWhatsAppReminder = async (student, type = 'expiry') => {
    const cleanPhone = (student.phone || '').replace(/\D/g, '');
    const phoneWithCountry = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const currentTemplates = getActiveTemplates();

    let message = '';
    if (type === 'expiry') {
      let statusPhrase = '';
      if (student.diffDays > 0) {
        statusPhrase = `${student.diffDays} दिन बाद (${formatDate(student.expiryDate)}) समाप्त होने वाला है`;
      } else if (student.diffDays < 0) {
        statusPhrase = `${Math.abs(student.diffDays)} दिन पहले (${formatDate(student.expiryDate)}) समाप्त हो चुका है`;
      } else {
        statusPhrase = `आज (${formatDate(student.expiryDate)}) समाप्त हो रहा है`;
      }

      message = renderTemplate(currentTemplates.expiryReminder?.template, {
        student_name: student.name || 'Student',
        library_name: libraryName,
        seat_number: student.seatNumber || '—',
        shift: student.shiftTiming || 'Shift',
        status_phrase: statusPhrase,
        expiry_date: formatDate(student.expiryDate),
      });
    } else {
      message = renderTemplate(currentTemplates.feeDueReminder?.template, {
        student_name: student.name || 'Student',
        library_name: libraryName,
        month: currentMonth,
        amount: student.pendingAmount || 0,
        seat_number: student.seatNumber || '—',
        phone: student.phone || '',
      });
    }

    const nowIso = new Date().toISOString();
    try {
      if (type === 'expiry') {
        await updateDocument(COLLECTIONS.STUDENTS, student.id, {
          lastExpiryReminderAt: nowIso,
          lastReminderAt: nowIso,
          lastReminderType: 'expiry',
        });
        setStudents((prev) =>
          prev.map((s) =>
            s.id === student.id
              ? { ...s, lastExpiryReminderAt: nowIso, lastReminderAt: nowIso, lastReminderType: 'expiry' }
              : s
          )
        );
      } else {
        await updateDocument(COLLECTIONS.STUDENTS, student.id, {
          lastFeeReminderAt: nowIso,
          lastFeeReminderMonth: currentMonth,
        });
        setStudents((prev) =>
          prev.map((s) =>
            s.id === student.id
              ? { ...s, lastFeeReminderAt: nowIso, lastFeeReminderMonth: currentMonth }
              : s
          )
        );
      }
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

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-50 bg-gray-900/30 backdrop-blur-2xs" onClick={onClose} />

      {/* Dropdown Container */}
      <div className="fixed top-16 right-3 sm:right-6 z-50 w-[94vw] sm:w-[460px] max-h-[85vh] bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
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

        {/* Tab Filters */}
        <div className="flex items-center border-b border-gray-100 bg-gray-50/80 px-3 py-2 gap-1.5 shrink-0 text-xs font-bold overflow-x-auto scrollbar-hide">
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

          <button
            onClick={() => setFilterTab('expiring')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 whitespace-nowrap ${
              filterTab === 'expiring'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'text-amber-800 hover:text-amber-900 bg-amber-50'
            }`}
          >
            <Clock className="w-3 h-3" />
            <span>3-Day Expiry ({expiringStudents.length})</span>
          </button>

          <button
            onClick={() => setFilterTab('fees')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 whitespace-nowrap ${
              filterTab === 'fees'
                ? 'bg-red-600 text-white shadow-xs'
                : 'text-red-700 hover:text-red-900 bg-red-50'
            }`}
          >
            <IndianRupee className="w-3 h-3" />
            <span>Pending Fees ({pendingFeeStudents.length})</span>
          </button>
        </div>

        {/* Notification List Scroll Area */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3 divide-y divide-gray-50">
          {loading ? (
            <div className="p-8 text-center text-gray-400 text-xs font-medium">
              Checking notifications & demo alerts...
            </div>
          ) : totalAlertsCount === 0 ? (
            <div className="p-8 text-center">
              <div className="w-12 h-12 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-2">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-gray-800">Everything is up to date!</p>
              <p className="text-xs text-gray-500 mt-0.5">
                No demo alerts, expiring memberships, or pending fees.
              </p>
            </div>
          ) : (
            <>
              {/* 1. DEMO ALERTS (LAST DAY & EXPIRED DEMOS) */}
              {(filterTab === 'all' || filterTab === 'demos') && demoAlerts.length > 0 && (
                <div className="space-y-2 pt-2 first:pt-0">
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
                                    ? 'bg-amber-500 text-white animate-pulse'
                                    : 'bg-rose-600 text-white'
                                }`}
                              >
                                {isToday ? '⏳ Last Day of Demo (Ending Today)' : `🔴 Demo Expired (${Math.abs(demo.diffDays)}d ago)`}
                              </span>
                            </div>

                            <p className="text-xs text-gray-600 mt-1 flex flex-wrap items-center gap-2">
                              <span>📍 {demo.sectionName} • <strong>Seat #{demo.seatNumber}</strong></span>
                              <span>•</span>
                              <span className="capitalize">⏰ {demo.shift?.replace('_', ' ') || 'Full Day'}</span>
                            </p>

                            <div className="flex flex-wrap items-center gap-2 mt-1">
                              <p className="text-[11px] text-gray-500">
                                Trial Date: <strong>{demo.endDateFormatted}</strong> • Phone: {demo.phone}
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

                        {/* Action Buttons */}
                        <div className="mt-2.5 pt-2 border-t border-gray-200/60 flex flex-wrap items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleDemoWhatsApp(demo)}
                            className={`px-2.5 py-1 text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 shadow-2xs cursor-pointer whitespace-nowrap ${
                              reminderInfo?.isToday
                                ? 'bg-emerald-700 hover:bg-emerald-800 ring-1 ring-emerald-400'
                                : 'bg-emerald-600 hover:bg-emerald-700'
                            }`}
                            title={reminderInfo?.isToday ? 'Follow-up already sent today. Click to resend' : 'Send WhatsApp Follow-up / Offer'}
                          >
                            <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                            <span>{reminderInfo?.isToday ? 'Resend' : 'WhatsApp'}</span>
                          </button>

                          <button
                            onClick={() => handleAdmitDemoStudent(demo)}
                            className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 shadow-2xs cursor-pointer whitespace-nowrap"
                            title="Admit as Regular Student"
                          >
                            <UserPlus className="w-3.5 h-3.5 shrink-0" />
                            <span>Admit Student</span>
                          </button>

                          <button
                            onClick={() => handleMarkDemoNotInterested(demo)}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-slate-200 hover:border-rose-300 rounded-lg text-xs font-bold transition-all shadow-2xs cursor-pointer whitespace-nowrap"
                            title="Mark Not Interested (Frees trial seat immediately)"
                          >
                            Not Interested
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              {/* 1. EXPIRING SUBSCRIPTIONS (3 DAYS ADVANCE ALERT) */}
              {(filterTab === 'all' || filterTab === 'expiring') && expiringStudents.length > 0 && (
                <div className="space-y-2 pt-2 first:pt-0">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-extrabold text-amber-900 uppercase tracking-wider flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                      Subscriptions Expiring Soon (3-Day Alert)
                    </span>
                    <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full">
                      {expiringStudents.length} Students
                    </span>
                  </div>

                  {expiringStudents.map((st) => {
                    const isOverdue = st.diffDays < -2;
                    const isExpiredGrace = st.diffDays >= -2 && st.diffDays < 0;
                    const isToday = st.diffDays === 0;
                    const isEndingSoon = st.diffDays > 0 && st.diffDays <= 3;
                    const reminderInfo = formatReminderTime(
                      st.lastExpiryReminderAt || (st.lastReminderType === 'expiry' ? st.lastReminderAt : null)
                    );

                    return (
                      <div
                        key={st.id}
                        className={`p-3 rounded-xl border transition-all ${
                          isOverdue
                            ? 'bg-red-50/60 border-red-200'
                            : isExpiredGrace
                            ? 'bg-amber-50/70 border-amber-200'
                            : isToday
                            ? 'bg-rose-50/60 border-rose-200'
                            : 'bg-emerald-50/50 border-emerald-200'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-gray-900 text-sm leading-tight">
                                {st.name}
                              </p>
                              <span
                                className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md ${
                                  isOverdue
                                    ? 'bg-red-600 text-white'
                                    : isExpiredGrace
                                    ? 'bg-amber-600 text-white'
                                    : isToday
                                    ? 'bg-rose-600 text-white animate-pulse'
                                    : 'bg-amber-500 text-white'
                                }`}
                              >
                                {isOverdue
                                  ? `Overdue (${Math.abs(st.diffDays)}d ago)`
                                  : isExpiredGrace
                                  ? `Expired (${Math.abs(st.diffDays)}d Grace)`
                                  : isToday
                                  ? 'Expires TODAY!'
                                  : `Expires in ${st.diffDays} day${st.diffDays > 1 ? 's' : ''}`}
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

                        {/* Action Buttons */}
                        <div className="mt-2.5 pt-2 border-t border-gray-200/60 flex flex-wrap items-center justify-end gap-2">
                          <button
                            onClick={() => handleWhatsAppReminder(st, 'expiry')}
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
                            onClick={() => {
                              onClose();
                              navigate('/fees', {
                                state: {
                                  statusFilter: isOverdue ? 'overdue' : isExpiredGrace ? 'pending' : 'ending_soon',
                                  collectStudentId: st.id,
                                },
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

              {/* 2. PENDING FEE ALERTS */}
              {(filterTab === 'all' || filterTab === 'fees') && pendingFeeStudents.length > 0 && (
                <div className="space-y-2 pt-3 first:pt-0">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-extrabold text-red-900 uppercase tracking-wider flex items-center gap-1">
                      <IndianRupee className="w-3.5 h-3.5 text-red-600" />
                      Pending Monthly Fee Dues ({currentMonth})
                    </span>
                    <span className="text-[10px] bg-red-100 text-red-800 font-bold px-2 py-0.5 rounded-full">
                      {pendingFeeStudents.length} Due
                    </span>
                  </div>

                  {pendingFeeStudents.map(({ student, seatNumber }) => {
                    const reminderInfo = formatReminderTime(
                      student.lastFeeReminderMonth === currentMonth ? student.lastFeeReminderAt : null
                    );

                    return (
                      <div
                        key={student.id}
                        className="p-3 bg-red-50/40 rounded-xl border border-red-200 flex flex-wrap sm:flex-nowrap items-center justify-between gap-2"
                      >
                        <div className="min-w-0">
                          <p className="font-bold text-gray-900 text-xs truncate">{student.name}</p>
                          <p className="text-[11px] text-gray-500">
                            Seat #{seatNumber} • {student.phone}
                          </p>
                          <div className="mt-1">
                            {reminderInfo ? (
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-md inline-flex items-center gap-1 ${
                                  reminderInfo.isToday
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                    : 'bg-slate-100 text-slate-700'
                                }`}
                              >
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>{reminderInfo.text}</span>
                              </span>
                            ) : (
                              <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md inline-flex items-center gap-1">
                                ⏳ Not sent yet
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
                          <button
                            onClick={() => handleWhatsAppReminder(student, 'fee')}
                            className={`px-2.5 py-1 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1 shadow-2xs cursor-pointer ${
                              reminderInfo?.isToday
                                ? 'bg-emerald-700 hover:bg-emerald-800 ring-1 ring-emerald-400'
                                : 'bg-green-600 hover:bg-green-700'
                            }`}
                            title={reminderInfo?.isToday ? 'Fee reminder already sent today. Click to resend' : 'Send WhatsApp Fee Reminder'}
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>{reminderInfo?.isToday ? 'Resend Reminder' : 'WhatsApp Reminder'}</span>
                          </button>

                          <button
                            onClick={() => {
                              onClose();
                              navigate('/fees');
                            }}
                            className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                          >
                            Collect
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
          <span>🔔 Real-time 3-day notification system</span>
          <button
            onClick={() => {
              onClose();
              navigate('/students');
            }}
            className="text-indigo-600 font-bold hover:underline flex items-center gap-1"
          >
            <span>All Students</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </>
  );
}
