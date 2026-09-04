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
} from 'lucide-react';
import { COLLECTIONS } from '../../utils/constants';
import { formatDate, formatCurrency } from '../../utils/helpers';
import { fetchCollectionData } from '../../firebase/storageService';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';

export default function NotificationPanel({ isOpen, onClose }) {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [fees, setFees] = useState([]);
  const [sections, setSections] = useState([]);
  const [seats, setSeats] = useState([]);
  const [libraryName, setLibraryName] = useState('Study Point Library');
  const [loading, setLoading] = useState(true);
  const [filterTab, setFilterTab] = useState('all'); // 'all' | 'expiring' | 'fees'

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
        const [stuDocs, feeDocs, secDocs, seatDocs] = await Promise.all([
          fetchCollectionData(COLLECTIONS.STUDENTS),
          fetchCollectionData(COLLECTIONS.FEES),
          fetchCollectionData(COLLECTIONS.SECTIONS),
          fetchCollectionData(COLLECTIONS.SEATS),
        ]);
        setStudents(stuDocs);
        setFees(feeDocs);
        setSections(secDocs);
        setSeats(seatDocs);

        try {
          const settingsSnap = await getDoc(doc(db, COLLECTIONS.SETTINGS, 'ownerProfile'));
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

  const totalAlertsCount = expiringStudents.length + pendingFeeStudents.length;

  const handleWhatsAppReminder = (student, type = 'expiry') => {
    const cleanPhone = (student.phone || '').replace(/\D/g, '');
    const phoneWithCountry = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

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

      message = `नमस्ते ${student.name} जी,\n${libraryName} की तरफ से यह रिमाइंडर है कि आपकी Seat #${student.seatNumber} (${student.shiftTiming || 'Shift'}) का Subscription ${statusPhrase}।\nकृपया अपनी सीट जारी रखने के लिए समय पर फीस जमा करें। धन्यवाद! 🙏`;
    } else {
      message = `नमस्ते ${student.name} जी,\n${libraryName} में आपके चालू माह (${currentMonth}) की फीस बकाया है। कृपया समय पर फीस जमा करवाएं। धन्यवाद! 🙏`;
    }

    const waUrl = `https://api.whatsapp.com/send?phone=${phoneWithCountry}&text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
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
                {totalAlertsCount} actionable reminders & warnings
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
        <div className="flex items-center border-b border-gray-100 bg-gray-50/80 px-3 py-2 gap-1.5 shrink-0 text-xs font-bold">
          <button
            onClick={() => setFilterTab('all')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              filterTab === 'all'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            All ({totalAlertsCount})
          </button>

          <button
            onClick={() => setFilterTab('expiring')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
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
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
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
              Checking expiring subscriptions...
            </div>
          ) : totalAlertsCount === 0 ? (
            <div className="p-8 text-center">
              <div className="w-12 h-12 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-2">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-gray-800">Everything is up to date!</p>
              <p className="text-xs text-gray-500 mt-0.5">
                No memberships expiring in next 3 days & no overdue fees.
              </p>
            </div>
          ) : (
            <>
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
                    const isOverdue = st.diffDays < 0;
                    const isToday = st.diffDays === 0;

                    return (
                      <div
                        key={st.id}
                        className={`p-3 rounded-xl border transition-all ${
                          isOverdue
                            ? 'bg-red-50/60 border-red-200'
                            : isToday
                            ? 'bg-rose-50/60 border-rose-200'
                            : 'bg-amber-50/60 border-amber-200'
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
                                    : isToday
                                    ? 'bg-rose-600 text-white animate-pulse'
                                    : 'bg-amber-500 text-white'
                                }`}
                              >
                                {isOverdue
                                  ? `Expired ${Math.abs(st.diffDays)}d ago`
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

                            <p className="text-[11px] text-gray-500 mt-0.5">
                              Valid Till: <strong>{formatDate(st.expiryDate)}</strong> • Phone: {st.phone}
                            </p>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="mt-2.5 pt-2 border-t border-gray-200/60 flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleWhatsAppReminder(st, 'expiry')}
                            className="px-2.5 py-1 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1 shadow-2xs cursor-pointer"
                            title="Send pre-filled WhatsApp renewal reminder"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>WhatsApp Reminder</span>
                          </button>

                          <button
                            onClick={() => {
                              onClose();
                              navigate('/fees');
                            }}
                            className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1 shadow-2xs cursor-pointer"
                          >
                            <IndianRupee className="w-3.5 h-3.5" />
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

                  {pendingFeeStudents.map(({ student, seatNumber }) => (
                    <div
                      key={student.id}
                      className="p-3 bg-red-50/40 rounded-xl border border-red-200 flex items-center justify-between gap-2"
                    >
                      <div>
                        <p className="font-bold text-gray-900 text-xs">{student.name}</p>
                        <p className="text-[11px] text-gray-500">
                          Seat #{seatNumber} • {student.phone}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleWhatsAppReminder(student, 'fee')}
                          className="p-1.5 bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                          title="WhatsApp Fee Reminder"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
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
                  ))}
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
