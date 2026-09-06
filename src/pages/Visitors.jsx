import React, { useState, useEffect, useMemo } from 'react';
import Layout from '../components/layout/Layout';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import Modal from '../components/common/Modal';
import { COLLECTIONS, SHIFTS } from '../utils/constants';
import { fetchCollectionData, createDocument, updateDocument, removeDocument } from '../firebase/storageService';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  UserCheck,
  UserPlus,
  Users,
  Search,
  Calendar,
  Clock,
  Armchair,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  Clock3,
  Sparkles,
  Edit2,
  Trash2,
  Filter,
  Phone,
  BookOpen,
  ArrowRight,
  TrendingUp,
  Building2,
  X,
  ExternalLink,
  UserX,
  RotateCcw,
} from 'lucide-react';
import { formatDate } from '../utils/helpers';

export default function Visitors() {
  const { hasPermission } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [visitors, setVisitors] = useState([]);
  const [sections, setSections] = useState([]);
  const [seats, setSeats] = useState([]);
  const [students, setStudents] = useState([]);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'demo_active' | 'demo_expiring' | 'converted' | 'inquiry'
  const [sectionFilter, setSectionFilter] = useState('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVisitor, setEditingVisitor] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const getInitialFormData = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    return {
      name: '',
      phone: '',
      purpose: 'demo', // 'demo' | 'inquiry'
      examTarget: '',
      shift: 'full_day',
      sectionId: '',
      seatId: '',
      startDate: todayStr,
      endDate: tomorrowStr,
      durationDays: '2', // '1' | '2' | '3' | 'custom'
      status: 'demo_active', // 'demo_active' | 'demo_completed' | 'converted' | 'not_interested' | 'inquiry'
      notes: '',
    };
  };

  const [formData, setFormData] = useState(getInitialFormData());

  const fetchData = async () => {
    setLoading(true);
    try {
      const [visitorDocs, sectionDocs, seatDocs, studentDocs] = await Promise.all([
        fetchCollectionData(COLLECTIONS.VISITORS),
        fetchCollectionData(COLLECTIONS.SECTIONS),
        fetchCollectionData(COLLECTIONS.SEATS),
        fetchCollectionData(COLLECTIONS.STUDENTS),
      ]);
      setVisitors(visitorDocs || []);
      setSections(sectionDocs || []);
      setSeats(seatDocs || []);
      setStudents(studentDocs || []);
    } catch (err) {
      console.error('Error fetching visitor data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Duration preset change helper
  const handleDurationPreset = (days) => {
    const start = new Date(formData.startDate || new Date());
    const end = new Date(start);
    end.setDate(start.getDate() + (Number(days) - 1));

    setFormData((prev) => ({
      ...prev,
      durationDays: String(days),
      endDate: end.toISOString().split('T')[0],
    }));
  };

  // Open modal for Create
  const handleOpenCreateModal = () => {
    setEditingVisitor(null);
    setFormData(getInitialFormData());
    setIsModalOpen(true);
  };

  // Open modal for Edit
  const handleOpenEditModal = (visitor) => {
    setEditingVisitor(visitor);
    setFormData({
      name: visitor.name || '',
      phone: visitor.phone || '',
      purpose: visitor.purpose || 'demo',
      examTarget: visitor.examTarget || '',
      shift: visitor.shift || 'full_day',
      sectionId: visitor.sectionId || '',
      seatId: visitor.seatId || '',
      startDate: visitor.startDate || new Date().toISOString().split('T')[0],
      endDate: visitor.endDate || new Date().toISOString().split('T')[0],
      durationDays: visitor.durationDays || 'custom',
      status: visitor.status || 'demo_active',
      notes: visitor.notes || '',
    });
    setIsModalOpen(true);
  };

  // Save Form (Create or Update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim()) {
      alert('Please provide visitor name and mobile number.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        purpose: formData.purpose,
        examTarget: formData.examTarget.trim(),
        shift: formData.shift,
        sectionId: formData.sectionId,
        seatId: formData.seatId,
        startDate: formData.startDate,
        endDate: formData.endDate,
        durationDays: formData.durationDays,
        status: formData.purpose === 'inquiry' && formData.status === 'demo_active' ? 'inquiry' : formData.status,
        notes: formData.notes.trim(),
        updatedAt: new Date().toISOString(),
      };

      if (editingVisitor) {
        await updateDocument(COLLECTIONS.VISITORS, editingVisitor.id, payload);
        setVisitors((prev) =>
          prev.map((v) => (v.id === editingVisitor.id ? { ...v, ...payload } : v))
        );
      } else {
        payload.createdAt = new Date().toISOString();
        const created = await createDocument(COLLECTIONS.VISITORS, payload);
        setVisitors((prev) => [created, ...prev]);
      }

      setIsModalOpen(false);
    } catch (err) {
      console.error('Error saving visitor entry:', err);
      alert('Error saving visitor details. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete visitor entry
  const handleDelete = async (visitorId) => {
    if (!window.confirm('Are you sure you want to delete this visitor record?')) return;
    try {
      await removeDocument(COLLECTIONS.VISITORS, visitorId);
      setVisitors((prev) => prev.filter((v) => v.id !== visitorId));
    } catch (err) {
      console.error('Error deleting visitor:', err);
    }
  };

  // 1-Click WhatsApp Follow-up Link Generator
  const handleWhatsAppReminder = (visitor) => {
    const cleanPhone = (visitor.phone || '').replace(/\D/g, '');
    const phoneWithCountry = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

    let message = '';
    if (visitor.purpose === 'demo') {
      message = `Namaste ${visitor.name || 'Student'} ji 🙏\n\nStudy Point Library mein aapka free demo trial kaisa raha? Humari peaceful reading environment, comfortable AC seats aur study facilities pasand aayi?\n\nAgar aap apni regular seat confirm karna chahte hain toh batayein, seats limited hain.\n\nDhanyawad! ✨\nStudy Point Library`;
    } else {
      message = `Namaste ${visitor.name || 'Student'} ji 🙏\n\nStudy Point Library visit karne ke liye dhanyawad! Kya aapne library join karne ka decide kiya hai? Humare paas peaceful study space aur personal lockers available hain.\n\nKisi bhi jaankari ke liye humse sampark karein!\n\nDhanyawad! ✨\nStudy Point Library`;
    }

    const waUrl = `https://api.whatsapp.com/send?phone=${phoneWithCountry}&text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  // 1-Click Convert to Regular Student: redirects to /students with prefilled details.
  // Note: Visitor status is ONLY marked 'converted' after student is actually saved in Students.jsx!
  const handleConvertToStudent = (visitor) => {
    navigate('/students', {
      state: {
        convertVisitor: {
          visitorId: visitor.id,
          name: visitor.name || '',
          phone: visitor.phone || '',
          sectionId: visitor.sectionId || '',
          seatId: visitor.seatId || '',
          shift: visitor.shift || 'full_day',
          notes: visitor.notes ? `Converted from Visitor/Demo. Previous Notes: ${visitor.notes}` : 'Converted from Visitor/Demo',
        },
      },
    });
  };

  // Mark Not Interested (frees trial seat immediately, archives candidate details)
  const handleMarkNotInterested = async (visitor) => {
    if (!window.confirm(`Mark "${visitor.name}" as Not Interested? Their trial seat will be freed up, but candidate details will remain safely saved.`)) return;
    try {
      await updateDocument(COLLECTIONS.VISITORS, visitor.id, {
        status: 'not_interested',
        seatId: '', // frees trial seat immediately
        notInterestedAt: new Date().toISOString(),
      });
      setVisitors((prev) =>
        prev.map((v) =>
          v.id === visitor.id ? { ...v, status: 'not_interested', seatId: '' } : v
        )
      );
    } catch (err) {
      console.error('Error marking not interested:', err);
    }
  };

  // Re-activate a Not Interested or completed demo entry
  const handleReactivate = async (visitor) => {
    try {
      const newStatus = visitor.purpose === 'demo' ? 'demo_active' : 'inquiry';
      await updateDocument(COLLECTIONS.VISITORS, visitor.id, {
        status: newStatus,
      });
      setVisitors((prev) =>
        prev.map((v) => (v.id === visitor.id ? { ...v, status: newStatus } : v))
      );
    } catch (err) {
      console.error('Error re-activating visitor:', err);
    }
  };

  // Calculate Expiry Status & Remaining Days
  const getDemoExpiryInfo = (visitor) => {
    if (visitor.status === 'converted') {
      return { label: 'Converted to Student', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', type: 'converted' };
    }
    if (visitor.purpose === 'inquiry' || visitor.status === 'inquiry') {
      return { label: 'Inquiry / Visit Only', color: 'bg-slate-100 text-slate-700 border-slate-200', type: 'inquiry' };
    }
    if (visitor.status === 'not_interested') {
      return { label: '⚪ Not Interested', color: 'bg-slate-100 text-slate-500 border-slate-200', type: 'not_interested' };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const endDate = new Date(visitor.endDate || visitor.startDate || today);
    endDate.setHours(0, 0, 0, 0);

    const diffTime = endDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 1) {
      return { label: `🟢 Active Demo (${diffDays} Days Left)`, color: 'bg-emerald-50 text-emerald-700 border-emerald-200', type: 'active', daysLeft: diffDays };
    } else if (diffDays === 1) {
      return { label: '🟢 Active Demo (1 Day Left)', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', type: 'active', daysLeft: 1 };
    } else if (diffDays === 0) {
      return { label: '🟡 Expiring Today!', color: 'bg-amber-50 text-amber-700 border-amber-200 font-black', type: 'expiring', daysLeft: 0 };
    } else {
      return { label: `🔴 Demo Expired (${Math.abs(diffDays)}d ago)`, color: 'bg-rose-50 text-rose-700 border-rose-200 font-bold', type: 'expired', daysLeft: diffDays };
    }
  };

  // Filtered List
  const filteredVisitors = useMemo(() => {
    return visitors.filter((v) => {
      // 1. Search Query
      const q = searchQuery.toLowerCase().trim();
      const nameMatch = (v.name || '').toLowerCase().includes(q);
      const phoneMatch = (v.phone || '').includes(q);

      if (q && !nameMatch && !phoneMatch) return false;

      // 2. Section Filter
      if (sectionFilter !== 'all' && v.sectionId !== sectionFilter) return false;

      // 3. Tab Filter
      const info = getDemoExpiryInfo(v);
      if (activeTab === 'demo_active') {
        return (info.type === 'active' || info.type === 'expiring') && v.status !== 'not_interested';
      }
      if (activeTab === 'demo_expiring') {
        return (info.type === 'expiring' || info.type === 'expired') && v.status !== 'not_interested';
      }
      if (activeTab === 'converted') {
        return v.status === 'converted';
      }
      if (activeTab === 'inquiry') {
        return (v.purpose === 'inquiry' || v.status === 'inquiry') && v.status !== 'not_interested';
      }
      if (activeTab === 'not_interested') {
        return v.status === 'not_interested';
      }

      return true;
    });
  }, [visitors, searchQuery, activeTab, sectionFilter]);

  // Overall Statistics Counts
  const stats = useMemo(() => {
    let activeDemoCount = 0;
    let expiringCount = 0;
    let convertedCount = 0;
    let inquiryCount = 0;
    let notInterestedCount = 0;

    visitors.forEach((v) => {
      const info = getDemoExpiryInfo(v);
      if (v.status === 'not_interested') notInterestedCount++;
      else if (v.status === 'converted') convertedCount++;
      else if (v.purpose === 'inquiry' || v.status === 'inquiry') inquiryCount++;
      else if (info.type === 'active') activeDemoCount++;
      else if (info.type === 'expiring' || info.type === 'expired') expiringCount++;
    });

    return {
      total: visitors.length,
      activeDemoCount,
      expiringCount,
      convertedCount,
      inquiryCount,
      notInterestedCount,
    };
  }, [visitors]);

  // Available Seats in selected Section for form (Naturally sorted: 1, 2, 3... & filtered by availability)
  const availableSeatsForForm = useMemo(() => {
    if (!formData.sectionId) return [];

    // 1. All seats in this section, sorted in natural numeric order (1, 2, 3... 9, 10, 11...)
    const sectionSeats = seats
      .filter((s) => s.sectionId === formData.sectionId)
      .sort((a, b) => {
        const numA = parseInt(String(a.seatNumber).replace(/\D/g, ''), 10);
        const numB = parseInt(String(b.seatNumber).replace(/\D/g, ''), 10);
        if (!isNaN(numA) && !isNaN(numB)) {
          if (numA !== numB) return numA - numB;
        }
        return String(a.seatNumber).localeCompare(String(b.seatNumber), undefined, { numeric: true });
      });

    // 2. Active regular students in this section
    const activeStudents = students.filter(
      (s) => s.status === 'active' && s.sectionId === formData.sectionId && s.seatId
    );

    // 3. Other active demo visitors on trial seats (excluding current visitor if editing)
    const activeDemos = visitors.filter(
      (v) =>
        v.status === 'demo_active' &&
        v.sectionId === formData.sectionId &&
        v.seatId &&
        v.id !== editingVisitor?.id
    );

    // 4. Evaluate availability per shift
    return sectionSeats.map((seat) => {
      const seatStudents = activeStudents.filter((s) => s.seatId === seat.id);
      const demoOccupant = activeDemos.find((v) => v.seatId === seat.id);

      const hasFullDay = seatStudents.some((s) => !s.shift || s.shift === 'full_day');
      const hasFirstHalf = seatStudents.some((s) => s.shift === 'first_half');
      const hasSecondHalf = seatStudents.some((s) => s.shift === 'second_half');

      let isAvailable = true;
      let reason = 'Available';

      if (demoOccupant) {
        isAvailable = false;
        reason = `Demo trial by ${demoOccupant.name}`;
      } else if (hasFullDay) {
        isAvailable = false;
        const stName = seatStudents.find((s) => !s.shift || s.shift === 'full_day')?.name || 'Student';
        reason = `Occupied Full Day (${stName})`;
      } else if (formData.shift === 'full_day' && seatStudents.length > 0) {
        isAvailable = false;
        reason = 'Occupied in Shift';
      } else if (formData.shift === 'first_half' && hasFirstHalf) {
        isAvailable = false;
        reason = '1st Half Booked';
      } else if (formData.shift === 'second_half' && hasSecondHalf) {
        isAvailable = false;
        reason = '2nd Half Booked';
      } else if (seat.status === 'reserved') {
        isAvailable = false;
        reason = 'Reserved';
      }

      // If currently editing this visitor and this seat was already assigned to them, allow keeping it
      if (editingVisitor && editingVisitor.seatId === seat.id) {
        isAvailable = true;
        reason = 'Current Trial Seat';
      }

      return {
        ...seat,
        isAvailable,
        reason,
      };
    });
  }, [seats, formData.sectionId, formData.shift, students, visitors, editingVisitor]);

  const getSectionName = (secId) => sections.find((s) => s.id === secId)?.name || '—';
  const getSeatNumber = (seatId) => {
    const st = seats.find((s) => s.id === seatId);
    return st ? `#${st.seatNumber}` : '—';
  };

  return (
    <Layout title="Visit & Demo">
      <div className="space-y-6">
        
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
                Visit & Demo Management
              </h1>
              <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                Live Register
              </span>
            </div>
            <p className="text-gray-500 text-xs sm:text-sm mt-0.5 font-medium">
              Track student inquiries, 1 to 3 day free demo seats, follow-up alerts & 1-click admissions
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            {hasPermission('visitors', 'create') && (
              <Button
                variant="primary"
                icon={<UserPlus className="w-4 h-4" />}
                onClick={handleOpenCreateModal}
              >
                + New Visitor / Demo Entry
              </Button>
            )}
          </div>
        </div>

        {/* 4 Summary Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Card 1: Total Entries */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Visitors</p>
              <h3 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">{stats.total}</h3>
              <p className="text-[11px] text-slate-500 mt-0.5 font-medium">Inquiries & Trials</p>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>

          {/* Card 2: Active Demos */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Demo Seats</p>
              <h3 className="text-2xl sm:text-3xl font-black text-emerald-600 mt-1">{stats.activeDemoCount}</h3>
              <p className="text-[11px] text-emerald-600 mt-0.5 font-medium">Currently testing library</p>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Armchair className="w-5 h-5" />
            </div>
          </div>

          {/* Card 3: Expiring / Expired */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Follow-Up Required</p>
              <h3 className="text-2xl sm:text-3xl font-black text-rose-600 mt-1">{stats.expiringCount}</h3>
              <p className="text-[11px] text-rose-500 mt-0.5 font-medium">Send WhatsApp reminder</p>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Clock3 className="w-5 h-5" />
            </div>
          </div>

          {/* Card 4: Converted to Students */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Converted Admissions</p>
              <h3 className="text-2xl sm:text-3xl font-black text-violet-600 mt-1">{stats.convertedCount}</h3>
              <p className="text-[11px] text-violet-600 mt-0.5 font-medium">Joined regular membership</p>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Filter Tabs & Search Bar */}
        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
            
            {/* Scrollable Tabs */}
            <div className="overflow-x-auto scrollbar-hide -mx-1 px-1">
              <div className="bg-slate-100 p-1 rounded-2xl flex items-center min-w-max gap-1">
                <button
                  onClick={() => setActiveTab('all')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'all'
                      ? 'bg-white text-indigo-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All Visitors ({visitors.length})
                </button>
                <button
                  onClick={() => setActiveTab('demo_active')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'demo_active'
                      ? 'bg-white text-emerald-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span>Active Demos ({stats.activeDemoCount})</span>
                </button>
                <button
                  onClick={() => setActiveTab('demo_expiring')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'demo_expiring'
                      ? 'bg-white text-rose-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                  <span>Expiring / Expired ({stats.expiringCount})</span>
                </button>
                <button
                  onClick={() => setActiveTab('converted')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'converted'
                      ? 'bg-white text-violet-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Sparkles className="w-3 h-3 text-violet-600" />
                  <span>Converted ({stats.convertedCount})</span>
                </button>
                <button
                  onClick={() => setActiveTab('inquiry')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'inquiry'
                      ? 'bg-white text-slate-800 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Inquiry Only ({stats.inquiryCount})
                </button>
                <button
                  onClick={() => setActiveTab('not_interested')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'not_interested'
                      ? 'bg-white text-slate-700 shadow-xs font-black'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  ⚪ Not Interested ({stats.notInterestedCount})
                </button>
              </div>
            </div>

            {/* Right: Search & Section filter */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by name, phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 bg-slate-50/50"
                />
              </div>

              {sections.length > 0 && (
                <select
                  value={sectionFilter}
                  onChange={(e) => setSectionFilter(e.target.value)}
                  className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 bg-slate-50/50"
                >
                  <option value="all">All Sections</option>
                  {sections.map((sec) => (
                    <option key={sec.id} value={sec.id}>
                      {sec.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Visitors Table / Feed */}
          {filteredVisitors.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-[11px] font-black text-slate-400 uppercase tracking-wider border-y border-slate-100">
                  <tr>
                    <th className="px-4 py-3">Visitor / Candidate</th>
                    <th className="px-4 py-3">Purpose</th>
                    <th className="px-4 py-3">Assigned Seat & Shift</th>
                    <th className="px-4 py-3">Demo Timeline</th>
                    <th className="px-4 py-3">Status / Expiry</th>
                    <th className="px-4 py-3 text-right">Quick Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredVisitors.map((item) => {
                    const expiry = getDemoExpiryInfo(item);

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                        
                        {/* Name & Phone */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-2xl bg-indigo-50 text-indigo-700 font-black text-xs flex items-center justify-center flex-shrink-0">
                              {(item.name || 'V').slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 text-sm">{item.name}</p>
                              <a
                                href={`tel:${item.phone}`}
                                className="text-xs text-slate-500 font-medium hover:text-indigo-600 flex items-center gap-1 mt-0.5"
                              >
                                <Phone className="w-3 h-3 text-slate-400" />
                                <span>{item.phone}</span>
                              </a>
                            </div>
                          </div>
                        </td>

                        {/* Purpose */}
                        <td className="px-4 py-3.5">
                          <span
                            className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-md ${
                              item.purpose === 'demo'
                                ? 'bg-indigo-50 text-indigo-700'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {item.purpose === 'demo' ? '🎯 Free Demo Seat' : '📋 General Inquiry'}
                          </span>
                        </td>

                        {/* Seat & Shift */}
                        <td className="px-4 py-3.5">
                          {item.seatId ? (
                            <div>
                              <p className="font-extrabold text-indigo-900 text-xs flex items-center gap-1">
                                <Armchair className="w-3.5 h-3.5 text-indigo-600" />
                                <span>{getSeatNumber(item.seatId)}</span>
                                <span className="text-slate-400 font-normal">({getSectionName(item.sectionId)})</span>
                              </p>
                              <p className="text-[11px] text-slate-500 capitalize mt-0.5">
                                Shift: {item.shift?.replace('_', ' ') || 'Full Day'}
                              </p>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400 italic font-medium">No seat assigned</span>
                          )}
                        </td>

                        {/* Demo Dates */}
                        <td className="px-4 py-3.5">
                          {item.purpose === 'demo' ? (
                            <div className="text-xs">
                              <p className="font-semibold text-slate-800">
                                {formatDate(item.startDate)} to {formatDate(item.endDate)}
                              </p>
                              <p className="text-[11px] text-slate-400 mt-0.5">
                                {item.durationDays ? `${item.durationDays} Days Trial` : 'Trial Period'}
                              </p>
                            </div>
                          ) : (
                            <p className="text-xs text-slate-500 font-medium">Visited: {formatDate(item.startDate || item.createdAt)}</p>
                          )}
                        </td>

                        {/* Expiry Pill */}
                        <td className="px-4 py-3.5">
                          <span
                            className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full border ${expiry.color}`}
                          >
                            {expiry.label}
                          </span>
                          {item.notes && (
                            <p className="text-[11px] text-slate-400 truncate max-w-xs mt-1" title={item.notes}>
                              Note: {item.notes}
                            </p>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">

                            {/* Convert to Regular Student */}
                            {item.status !== 'converted' && (
                              <button
                                onClick={() => handleConvertToStudent(item)}
                                className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-bold transition-all shadow-2xs cursor-pointer flex items-center gap-1"
                                title="1-Click Convert to Regular Admission"
                              >
                                <UserPlus className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Admit Student</span>
                              </button>
                            )}

                            {/* Mark Not Interested (Frees seat, keeps data) */}
                            {item.status !== 'converted' && item.status !== 'not_interested' && (
                              <button
                                onClick={() => handleMarkNotInterested(item)}
                                className="p-2 rounded-xl bg-slate-100 hover:bg-amber-50 text-slate-400 hover:text-amber-700 transition-all cursor-pointer"
                                title="Mark Not Interested (Frees seat, archives details)"
                              >
                                <UserX className="w-4 h-4" />
                              </button>
                            )}

                            {/* Re-activate if Not Interested */}
                            {item.status === 'not_interested' && (
                              <button
                                onClick={() => handleReactivate(item)}
                                className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                                title="Re-open Demo / Inquiry"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Re-open</span>
                              </button>
                            )}

                            {/* Edit */}
                            {hasPermission('visitors', 'edit') && (
                              <button
                                onClick={() => handleOpenEditModal(item)}
                                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer"
                                title="Edit Entry"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {/* Delete */}
                            {hasPermission('visitors', 'delete') && (
                              <button
                                onClick={() => handleDelete(item.id)}
                                className="p-2 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-all cursor-pointer"
                                title="Delete Entry"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
                <UserCheck className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-800">No Visitors or Demo Records Found</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                {searchQuery
                  ? 'No entries match your search query.'
                  : 'Start logging student inquiries and free demo trial seats to never lose a prospective admission!'}
              </p>
              {hasPermission('visitors', 'create') && (
                <button
                  onClick={handleOpenCreateModal}
                  className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
                >
                  + Add First Visitor / Demo
                </button>
              )}
            </div>
          )}
        </div>

        {/* Modal: Add or Edit Visitor */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingVisitor ? 'Edit Visitor / Demo Record' : 'New Visitor & Free Demo Entry'}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Purpose Toggle */}
            <div className="flex rounded-xl bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, purpose: 'demo' }))}
                className={`flex-1 py-2 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                  formData.purpose === 'demo'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                🎯 Free Demo Seat Trial
              </button>
              <button
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, purpose: 'inquiry' }))}
                className={`flex-1 py-2 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                  formData.purpose === 'inquiry'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                📋 Library Visit / Inquiry Only
              </button>
            </div>

            {/* Candidate Name & Mobile */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 block">
                  Candidate Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-indigo-500 bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 block">
                  WhatsApp / Mobile Number *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="10 digit mobile"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-indigo-500 bg-white"
                />
              </div>
            </div>

            {/* Preferred Shift */}
            <div>
              <label className="text-xs font-bold text-slate-700 mb-1 block">
                Preferred Shift Slot
              </label>
              <select
                value={formData.shift}
                onChange={(e) => setFormData({ ...formData, shift: e.target.value })}
                className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="full_day">Full Day (6 AM - 11 PM)</option>
                <option value="first_half">1st Half / Morning (6 AM - 2 PM)</option>
                <option value="second_half">2nd Half / Evening (2 PM - 11 PM)</option>
                <option value="custom">Custom Timing</option>
              </select>
            </div>

            {/* Seat Allocation (If Demo) */}
            {formData.purpose === 'demo' && (
              <div className="p-3.5 rounded-2xl bg-indigo-50/50 border border-indigo-100 space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-black text-indigo-900">
                  <Armchair className="w-4 h-4 text-indigo-600" />
                  <span>Assign Trial Seat for Demo</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 mb-1 block">
                      Select Section / Hall
                    </label>
                    <select
                      value={formData.sectionId}
                      onChange={(e) => setFormData({ ...formData, sectionId: e.target.value, seatId: '' })}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-xl text-xs font-semibold bg-white"
                    >
                      <option value="">-- Choose Section --</option>
                      {sections.map((sec) => (
                        <option key={sec.id} value={sec.id}>
                          {sec.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 mb-1 block">
                      Select Trial Seat Number
                    </label>
                    <select
                      value={formData.seatId}
                      onChange={(e) => setFormData({ ...formData, seatId: e.target.value })}
                      disabled={!formData.sectionId}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-xl text-xs font-semibold bg-white disabled:opacity-50"
                    >
                      <option value="">
                        {availableSeatsForForm.filter((st) => st.isAvailable).length > 0
                          ? `-- Choose Available Seat (${availableSeatsForForm.filter((st) => st.isAvailable).length} Available) --`
                          : '-- No Seats Available in this Shift --'}
                      </option>
                      {availableSeatsForForm
                        .filter((st) => st.isAvailable)
                        .map((st) => (
                          <option key={st.id} value={st.id}>
                            Seat #{st.seatNumber}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Demo Dates & Presets */}
            {formData.purpose === 'demo' && (
              <div>
                <label className="text-xs font-bold text-slate-700 mb-1.5 block">
                  Demo Trial Duration
                </label>
                
                {/* Duration Presets */}
                <div className="grid grid-cols-4 gap-2 mb-2.5">
                  {['1', '2', '3'].map((days) => (
                    <button
                      key={days}
                      type="button"
                      onClick={() => handleDurationPreset(days)}
                      className={`py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        formData.durationDays === days
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {days} {days === '1' ? 'Day' : 'Days'}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, durationDays: 'custom' })}
                    className={`py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      formData.durationDays === 'custom'
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    Custom
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 mb-1 block">From Date</label>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-xl text-xs font-semibold bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 mb-1 block">To Date</label>
                    <input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value, durationDays: 'custom' })}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-xl text-xs font-semibold bg-white"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Status Selector (If Editing) */}
            {editingVisitor && (
              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 block">
                  Current Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs font-semibold bg-white"
                >
                  <option value="demo_active">🟢 Active Demo Trial</option>
                  <option value="demo_completed">⏳ Demo Trial Completed</option>
                  <option value="converted">🤝 Converted to Regular Student</option>
                  <option value="inquiry">📋 Inquiry / Visit Only</option>
                  <option value="not_interested">⚪ Not Interested / Left</option>
                </select>
              </div>
            )}

            {/* Notes / Remarks */}
            <div>
              <label className="text-xs font-bold text-slate-700 mb-1 block">
                Receptionist Notes / Discussion Summary
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Needs morning slot, interested in Locker facility..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs font-medium bg-white"
              />
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <Button variant="secondary" type="button" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : editingVisitor ? 'Update Record' : 'Save Visitor / Demo'}
              </Button>
            </div>
          </form>
        </Modal>

      </div>
    </Layout>
  );
}
