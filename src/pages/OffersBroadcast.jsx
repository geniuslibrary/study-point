import React, { useState, useEffect, useMemo, useRef } from 'react';
import Layout from '../components/layout/Layout';
import Modal from '../components/common/Modal';
import {
  Megaphone,
  Image as ImageIcon,
  Send,
  Users,
  UserX,
  Copy,
  Trash2,
  Search,
  Check,
  Sparkles,
  Upload,
  Download,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { COLLECTIONS } from '../utils/constants';
import { fetchCollectionData, getTenantItem } from '../firebase/storageService';

export default function OffersBroadcast() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. Message State
  const defaultLibName = getTenantItem('library_name', 'Study Point Library');
  const [message, setMessage] = useState(
    `नमस्ते {name} जी! 🙏\n${defaultLibName} की तरफ से आपके लिए एक विशेष ऑफर है!\nअधिक जानकारी व अपनी सीट बुक करने के लिए रिसेप्शन पर संपर्क करें। 📚✨`
  );

  // 2. Image Attachment State
  const [attachedImage, setAttachedImage] = useState(null); // base64 or object URL
  const [imageName, setImageName] = useState('');
  const fileInputRef = useRef(null);

  // 3. Student Filter & Selection
  const [studentFilter, setStudentFilter] = useState('left'); // 'left' | 'active' | 'all'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);

  // 4. Dispatcher Queue Modal
  const [isQueueModalOpen, setIsQueueModalOpen] = useState(false);
  const [sentMap, setSentMap] = useState({});
  const [queueIndex, setQueueIndex] = useState(0);

  // 5. Toast
  const [toastMsg, setToastMsg] = useState('');
  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  // Fetch students from database
  useEffect(() => {
    const loadStudents = async () => {
      setLoading(true);
      try {
        const data = await fetchCollectionData(COLLECTIONS.STUDENTS);
        setStudents(data || []);
      } catch (e) {
        console.error('Error fetching students for broadcast:', e);
      } finally {
        setLoading(false);
      }
    };
    loadStudents();
  }, []);

  // Filtered Student List
  const filteredStudents = useMemo(() => {
    let list = students;

    if (studentFilter === 'left') {
      list = list.filter((s) => s.status === 'left' || s.status === 'inactive');
    } else if (studentFilter === 'active') {
      list = list.filter((s) => s.status === 'active');
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (s) =>
          (s.name || '').toLowerCase().includes(q) ||
          (s.phone || '').includes(q)
      );
    }

    return list;
  }, [students, studentFilter, searchQuery]);

  // Default select all in current filtered view
  useEffect(() => {
    setSelectedStudentIds(filteredStudents.map((s) => s.id));
  }, [studentFilter, searchQuery]);

  // Handle Image Upload
  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Kripya sirf image file (PNG, JPG, JPEG) select karein!');
      return;
    }

    setImageName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      setAttachedImage(reader.result);
      showToast('Image poster attach ho gayi! 🖼️');
    };
    reader.readAsDataURL(file);
  };

  // Remove attached image
  const handleRemoveImage = () => {
    setAttachedImage(null);
    setImageName('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    showToast('Image hata di gayi.');
  };

  // Format message for a specific student
  const formatStudentMessage = (rawText, student) => {
    return (rawText || '')
      .replace(/{name}/g, student?.name || 'Student')
      .replace(/{phone}/g, student?.phone || '');
  };

  // Open WhatsApp Web/App for a single student
  const handleSendSingleWhatsApp = (student, markSent = true) => {
    const cleanPhone = (student.phone || '').replace(/[^0-9]/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      alert(`Invalid phone number for ${student.name}: ${student.phone || 'None'}`);
      return false;
    }

    const phoneWithCountry = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const formattedText = formatStudentMessage(message, student);
    const waUrl = `https://api.whatsapp.com/send?phone=${phoneWithCountry}&text=${encodeURIComponent(formattedText)}`;

    window.open(waUrl, '_blank', 'noopener,noreferrer');

    if (markSent) {
      setSentMap((prev) => ({ ...prev, [student.id]: true }));
    }
    return true;
  };

  // Open Queue Modal for bulk dispatch
  const handleStartQueue = () => {
    if (selectedStudentIds.length === 0) {
      alert('Kripya kam se kam ek student select karein!');
      return;
    }
    if (!message.trim()) {
      alert('Kripya bhejne ke liye message type karein!');
      return;
    }
    setQueueIndex(0);
    setIsQueueModalOpen(true);
  };

  // Dispatch next in queue
  const handleDispatchNextInQueue = () => {
    const recipients = filteredStudents.filter((s) => selectedStudentIds.includes(s.id));
    if (queueIndex >= recipients.length) {
      alert('Sabhi chune huye students ko message bheja ja chuka hai! 🎉');
      return;
    }

    const currStudent = recipients[queueIndex];
    handleSendSingleWhatsApp(currStudent, true);
    setQueueIndex((prev) => Math.min(prev + 1, recipients.length));
  };

  // Copy all selected phone numbers
  const handleCopyPhoneNumbers = () => {
    const recipients = filteredStudents.filter((s) => selectedStudentIds.includes(s.id));
    const phones = recipients
      .map((s) => (s.phone || '').replace(/[^0-9]/g, ''))
      .filter((p) => p.length >= 10)
      .join(', ');

    if (!phones) {
      alert('Koi valid phone number nahi mila!');
      return;
    }

    navigator.clipboard.writeText(phones);
    showToast(`${recipients.length} phone numbers copy ho gaye! 📋`);
  };

  // Download attached image to device
  const handleDownloadImage = () => {
    if (!attachedImage) return;
    const a = document.createElement('a');
    a.href = attachedImage;
    a.download = imageName || 'study-point-offer.png';
    a.click();
    showToast('Image download ho gayi! Ab WhatsApp me attach kar sakte hain.');
  };

  const selectedCount = selectedStudentIds.length;
  const leftStudentsCount = students.filter((s) => s.status === 'left' || s.status === 'inactive').length;
  const activeStudentsCount = students.filter((s) => s.status === 'active').length;

  return (
    <Layout title="Offer & Broadcast">
      {/* Toast Alert */}
      {toastMsg && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-bold border border-slate-700 animate-in fade-in slide-in-from-top">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      <div className="space-y-5">
        {/* Simple Top Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Megaphone className="w-4 h-4" />
              </div>
              <h1 className="text-xl font-black text-slate-900">Offer & Broadcast</h1>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Message type karein, offer poster attach karein aur ek saath students (Left ya active) ko WhatsApp par bhejein.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleCopyPhoneNumbers}
              disabled={selectedCount === 0}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="Copy phone numbers for WhatsApp Broadcast"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copy Numbers ({selectedCount})</span>
            </button>

            <button
              type="button"
              onClick={handleStartQueue}
              disabled={selectedCount === 0}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-all shadow-md shadow-emerald-600/20 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send WhatsApp ({selectedCount})</span>
            </button>
          </div>
        </div>

        {/* 2-Column Clean Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* ================= LEFT COLUMN: MESSAGE & IMAGE ATTACHMENT (5 cols) ================= */}
          <div className="lg:col-span-5 space-y-4">
            {/* 1. Message Type Box */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                  1. Message Type Karo (मैसेज लिखें) *
                </label>
                <button
                  type="button"
                  onClick={() => setMessage((prev) => `${prev} {name}`)}
                  className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100 cursor-pointer"
                  title="Click to insert student name placeholder"
                >
                  + Student Name ({'{name}'})
                </button>
              </div>

              <textarea
                rows={7}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Yahan apna offer ya notice message type karein..."
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 leading-relaxed"
              />

              <p className="text-[11px] text-slate-400">
                Tip: <strong>{'{name}'}</strong> likhne par har student ka naam apne-aap wahan lag jayega.
              </p>
            </div>

            {/* 2. Image Attach Box */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-indigo-600" />
                  <span>2. Image / Poster Attach Karo (फोटो जोड़ें)</span>
                </label>
                {attachedImage && (
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="text-xs font-bold text-rose-600 hover:text-rose-800 flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Hatao</span>
                  </button>
                )}
              </div>

              {/* Hidden File Input */}
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />

              {attachedImage ? (
                /* Image Preview Box */
                <div className="space-y-2">
                  <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-50 group">
                    <img
                      src={attachedImage}
                      alt="Attached Offer"
                      className="w-full max-h-56 object-contain rounded-xl"
                    />
                    <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/60 backdrop-blur-xs p-1 rounded-lg">
                      <button
                        type="button"
                        onClick={handleDownloadImage}
                        className="p-1.5 text-white hover:text-amber-300 transition-colors"
                        title="Download image"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="p-1.5 text-white hover:text-rose-400 transition-colors"
                        title="Remove image"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 bg-slate-50 p-2 rounded-xl border border-slate-200">
                    <span className="truncate max-w-[200px] font-semibold">{imageName || 'Offer Image'}</span>
                    <button
                      type="button"
                      onClick={handleDownloadImage}
                      className="text-indigo-600 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Download className="w-3 h-3" />
                      <span>Download Image</span>
                    </button>
                  </div>

                  <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-800 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>
                      WhatsApp link par message ke sath yeh poster bhejne ke liye, image <strong>Download</strong> karein aur chat khulte hi photo attach kar dein!
                    </span>
                  </div>
                </div>
              ) : (
                /* Upload Button Area */
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 hover:border-indigo-400 hover:bg-indigo-50/30 rounded-2xl p-6 text-center transition-colors cursor-pointer space-y-2"
                >
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800">
                      Offer Poster ya Photo Chunein (Click to Upload)
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      PNG, JPG, JPEG (Offer banner, discount poster)
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ================= RIGHT COLUMN: STUDENT KA OPTION (7 cols) ================= */}
          <div className="lg:col-span-7 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4 flex flex-col">
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-indigo-600" />
                  <span>3. Student Ka Option (छात्र चुनें)</span>
                </label>
                <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-xl border border-indigo-100">
                  {selectedCount} / {filteredStudents.length} Selected
                </span>
              </div>

              {/* Audience Filter Pills: Left vs Active vs All */}
              <div className="grid grid-cols-3 gap-2 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setStudentFilter('left')}
                  className={`p-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer border ${
                    studentFilter === 'left'
                      ? 'bg-rose-50 text-rose-700 border-rose-300 shadow-2xs ring-2 ring-rose-400/20 font-black'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <UserX className="w-3.5 h-3.5 text-rose-600" />
                  <span>Left ({leftStudentsCount})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setStudentFilter('active')}
                  className={`p-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer border ${
                    studentFilter === 'active'
                      ? 'bg-indigo-50 text-indigo-700 border-indigo-300 shadow-2xs ring-2 ring-indigo-400/20 font-black'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Users className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Active ({activeStudentsCount})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setStudentFilter('all')}
                  className={`p-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer border ${
                    studentFilter === 'all'
                      ? 'bg-slate-900 text-white border-slate-900 shadow-2xs font-black'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span>All Students ({students.length})</span>
                </button>
              </div>
            </div>

            {/* Search and Bulk Select All / Clear */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-100">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Student name ya phone se search karein..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setSelectedStudentIds(filteredStudents.map((s) => s.id))}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                >
                  Select All
                </button>
                <span className="text-slate-300">|</span>
                <button
                  type="button"
                  onClick={() => setSelectedStudentIds([])}
                  className="text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  Clear All
                </button>
              </div>
            </div>

            {/* Scrollable Student List */}
            <div className="flex-1 min-h-[320px] max-h-[480px] overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-2xl bg-slate-50/40">
              {loading ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  Loading students list...
                </div>
              ) : filteredStudents.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  Koi student nahi mila is filter me.
                </div>
              ) : (
                filteredStudents.map((student) => {
                  const isChecked = selectedStudentIds.includes(student.id);
                  const isSent = sentMap[student.id];
                  const isLeft = student.status === 'left' || student.status === 'inactive';

                  return (
                    <div
                      key={student.id}
                      className="p-3 flex items-center justify-between gap-3 hover:bg-white transition-colors"
                    >
                      <label className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedStudentIds((prev) => [...prev, student.id]);
                            } else {
                              setSelectedStudentIds((prev) => prev.filter((id) => id !== student.id));
                            }
                          }}
                          className="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer w-4 h-4 shrink-0"
                        />

                        <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-black text-xs shrink-0">
                          {(student.name || 'S').charAt(0).toUpperCase()}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-bold text-slate-900 truncate">
                              {student.name}
                            </span>
                            <span
                              className={`text-[9px] font-black px-1.5 py-0.2 rounded-md ${
                                isLeft
                                  ? 'bg-rose-100 text-rose-700 border border-rose-200'
                                  : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              }`}
                            >
                              {isLeft ? 'Left' : 'Active'}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-400 block truncate">
                            📞 {student.phone || 'No phone'} {student.shift ? `• ${student.shift}` : ''}
                          </span>
                        </div>
                      </label>

                      {/* Direct 1-Click WhatsApp Button */}
                      <button
                        type="button"
                        onClick={() => handleSendSingleWhatsApp(student, true)}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 shrink-0 cursor-pointer ${
                          isSent
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                        }`}
                        title="Open WhatsApp chat with pre-filled message"
                      >
                        {isSent ? <Check className="w-3 h-3" /> : <Send className="w-3 h-3" />}
                        <span>{isSent ? 'Sent' : 'WhatsApp'}</span>
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            {/* Bottom Dispatch Bar */}
            <div className="pt-2 flex items-center justify-between gap-3">
              <span className="text-xs font-bold text-slate-600">
                Total <strong>{selectedCount}</strong> students selected
              </span>

              <button
                type="button"
                onClick={handleStartQueue}
                disabled={selectedCount === 0}
                className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-black transition-all shadow-md shadow-emerald-600/20 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Start Sending ({selectedCount})</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ================= SAFE 1-BY-1 WHATSAPP QUEUE MODAL ================= */}
      <Modal
        isOpen={isQueueModalOpen}
        onClose={() => setIsQueueModalOpen(false)}
        title="WhatsApp Message Queue"
        size="md"
      >
        <div className="space-y-4">
          <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl text-xs text-emerald-900">
            <p className="font-black">Browser popup blocker se bachne ke liye safe sender:</p>
            <p className="text-[11px] mt-0.5">
              Niche <strong>"Send Next Recipient"</strong> dabayein, ek-ek karke WhatsApp open hoga aur status <strong>Sent</strong> mark ho jayega.
            </p>
          </div>

          {/* Recipient Queue List */}
          <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-xl bg-white">
            {filteredStudents
              .filter((s) => selectedStudentIds.includes(s.id))
              .map((student, idx) => {
                const isSent = sentMap[student.id];
                const isCurrent = idx === queueIndex;

                return (
                  <div
                    key={student.id}
                    className={`p-2.5 flex items-center justify-between gap-3 text-xs ${
                      isCurrent ? 'bg-indigo-50/70 border-l-4 border-indigo-600 font-bold' : ''
                    }`}
                  >
                    <div className="min-w-0">
                      <span className="font-bold text-slate-900 block truncate">{student.name}</span>
                      <span className="text-[11px] text-slate-400 block">{student.phone}</span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                          isSent ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {isSent ? '✓ Sent' : 'Ready'}
                      </span>

                      <button
                        type="button"
                        onClick={() => {
                          handleSendSingleWhatsApp(student, true);
                          setQueueIndex(idx + 1);
                        }}
                        className="px-2 py-1 bg-emerald-600 text-white rounded-md text-[11px] font-bold cursor-pointer hover:bg-emerald-700"
                      >
                        Send
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsQueueModalOpen(false)}
              className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
            >
              Close
            </button>

            <button
              type="button"
              onClick={handleDispatchNextInQueue}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send Next Recipient & Advance →</span>
            </button>
          </div>
        </div>
      </Modal>
    </Layout>
  );
}
