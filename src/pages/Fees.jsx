import { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import Button from '../components/common/Button';
import FeeTracker from '../components/fees/FeeTracker';
import CollectFeeModal from '../components/fees/CollectFeeModal';
import FeeReceipt from '../components/fees/FeeReceipt';
import { Plus, Loader2, IndianRupee, AlertCircle, CheckCircle } from 'lucide-react';
import { COLLECTIONS } from '../utils/constants';
import { formatCurrency } from '../utils/helpers';
import {
  fetchCollectionData,
  createDocument,
  updateDocument,
} from '../firebase/storageService';

export default function Fees() {
  const [fees, setFees] = useState([]);
  const [students, setStudents] = useState([]);
  const [sections, setSections] = useState([]);
  const [seats, setSeats] = useState([]);
  const [plans, setPlans] = useState([]);
  const [addonPricing, setAddonPricing] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [collectFee, setCollectFee] = useState(null);
  const [receiptFee, setReceiptFee] = useState(null);
  const [generating, setGenerating] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [feeDocs, stuDocs, secDocs, seatDocs, planDocs, addonDocs] = await Promise.all([
        fetchCollectionData(COLLECTIONS.FEES),
        fetchCollectionData(COLLECTIONS.STUDENTS),
        fetchCollectionData(COLLECTIONS.SECTIONS),
        fetchCollectionData(COLLECTIONS.SEATS),
        fetchCollectionData(COLLECTIONS.MEMBERSHIP_PLANS),
        fetchCollectionData(COLLECTIONS.ADDON_PRICING),
      ]);
      setFees(feeDocs);
      setStudents(stuDocs);
      setSections(secDocs);
      setSeats(seatDocs);
      setPlans(planDocs);
      setAddonPricing(addonDocs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getCurrentMonth = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  };

  const handleGenerateMonthlyFees = async () => {
    setGenerating(true);
    const currentMonth = getCurrentMonth();
    const activeStudents = students.filter((s) => s.status === 'active');
    try {
      for (const student of activeStudents) {
        const existingFee = fees.find((f) => f.studentId === student.id && f.month === currentMonth);
        if (existingFee) continue;

        const plan = plans.find((p) => p.id === student.membershipPlanId);
        const seat = seats.find((s) => s.id === student.seatId);
        const baseFee = plan ? Math.round(plan.price / (plan.durationMonths || 1)) : 0;
        const addonCharges = {};
        let addonTotal = 0;
        if (seat?.addons) {
          addonPricing.forEach((addon) => {
            const key = addon.name?.toLowerCase();
            if (seat.addons[key]) {
              addonCharges[addon.name] = addon.monthlyCharge || 0;
              addonTotal += addon.monthlyCharge || 0;
            }
          });
        }

        const dueDate = new Date();
        dueDate.setDate(10);
        if (dueDate < new Date()) dueDate.setMonth(dueDate.getMonth() + 1);

        await createDocument(COLLECTIONS.FEES, {
          studentId: student.id,
          amount: baseFee + addonTotal,
          baseFee,
          addonCharges,
          dueDate: dueDate.toISOString(),
          paidDate: null,
          status: 'pending',
          month: currentMonth,
          paymentMode: '',
          notes: '',
        });
      }
      await fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  const handleCollectFee = async (paymentData) => {
    if (!collectFee) return;
    await updateDocument(COLLECTIONS.FEES, collectFee.id, {
      status: 'paid',
      paidDate: new Date().toISOString(),
      paymentMode: paymentData.paymentMode,
      notes: paymentData.notes,
      amount: paymentData.amount,
      baseFee: paymentData.baseFee,
      addonCharges: paymentData.addonCharges,
    });
    setCollectFee(null);
    await fetchData();
  };

  const currentMonth = getCurrentMonth();
  const monthFees = fees.filter((f) => f.month === (selectedMonth || currentMonth));
  const totalRevenue = fees.filter((f) => f.status === 'paid').reduce((s, f) => s + (f.amount || 0), 0);
  const monthCollected = monthFees.filter((f) => f.status === 'paid').reduce((s, f) => s + (f.amount || 0), 0);
  const pendingCount = monthFees.filter((f) => f.status !== 'paid').length;

  const collectFeeStudent = collectFee ? students.find((s) => s.id === collectFee.studentId) : null;
  const collectFeePlan = collectFeeStudent ? plans.find((p) => p.id === collectFeeStudent.membershipPlanId) : null;
  const collectFeeSeat = collectFeeStudent ? seats.find((s) => s.id === collectFeeStudent.seatId) : null;

  const receiptStudent = receiptFee ? students.find((s) => s.id === receiptFee.studentId) : null;
  const receiptSection = receiptStudent ? sections.find((s) => s.id === receiptStudent.sectionId) : null;

  if (loading) {
    return (
      <Layout title="Fees">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Fee Management">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Fee Management</h1>
            <p className="text-gray-500 mt-1">Track collections, dues, and issue printable receipts</p>
          </div>
          <Button icon={<Plus className="w-4 h-4" />} onClick={handleGenerateMonthlyFees} loading={generating}>
            Generate Monthly Fees
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl shadow-sm p-4 flex items-center gap-3 border border-gray-100">
            <div className="w-11 h-11 bg-green-100 rounded-xl flex items-center justify-center">
              <IndianRupee className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Total Revenue</p>
              <p className="text-xl font-bold text-gray-900">{formatCurrency(totalRevenue)}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-4 flex items-center gap-3 border border-gray-100">
            <div className="w-11 h-11 bg-blue-100 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Collected (Month)</p>
              <p className="text-xl font-bold text-gray-900">{formatCurrency(monthCollected)}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-4 flex items-center gap-3 border border-gray-100">
            <div className="w-11 h-11 bg-red-100 rounded-xl flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Pending Dues</p>
              <p className="text-xl font-bold text-gray-900">{pendingCount} students</p>
            </div>
          </div>
        </div>

        <FeeTracker
          fees={fees}
          students={students}
          sections={sections}
          onCollect={setCollectFee}
          onViewReceipt={setReceiptFee}
          selectedMonth={selectedMonth}
          onMonthChange={setSelectedMonth}
        />
      </div>

      <CollectFeeModal
        isOpen={!!collectFee}
        onClose={() => setCollectFee(null)}
        onSubmit={handleCollectFee}
        student={collectFeeStudent}
        plan={collectFeePlan}
        seat={collectFeeSeat}
        addonPricing={addonPricing}
      />

      <FeeReceipt
        isOpen={!!receiptFee}
        onClose={() => setReceiptFee(null)}
        fee={receiptFee}
        student={receiptStudent}
        section={receiptSection}
      />
    </Layout>
  );
}
