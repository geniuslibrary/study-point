import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { doc, getDoc, collectionGroup, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { COLLECTIONS } from '../utils/constants';
import { formatCurrency, formatDate, formatMonthDisplay } from '../utils/helpers';
import { BookOpen, Download, Printer, CheckCircle2, ShieldCheck, ArrowLeft, Loader2 } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export default function PublicReceipt() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const receiptRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [fee, setFee] = useState(null);
  const [student, setStudent] = useState(null);
  const [seat, setSeat] = useState(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [libraryInfo, setLibraryInfo] = useState({
    studyPointName: 'Royal Study Point & Library',
    ownerName: 'Manish',
    phone: '9876543210',
    email: 'study@gmail.com',
    address: 'Near Metro Station, Main Road, Study Zone',
    logoUrl: '',
    signatureUrl: '',
  });

  useEffect(() => {
    const fetchReceiptData = async () => {
      setLoading(true);
      try {
        let activeTenant = searchParams.get('tenant') || null;

        // 1. Fetch Fee Doc
        let feeData = null;
        if (activeTenant && activeTenant !== 'genius_root') {
          const tenantFeeSnap = await getDoc(doc(db, 'libraries', activeTenant, COLLECTIONS.FEES, id));
          if (tenantFeeSnap.exists()) {
            feeData = { id: tenantFeeSnap.id, ...tenantFeeSnap.data() };
          }
        }

        // Try root collection if not found
        if (!feeData) {
          const rootFeeSnap = await getDoc(doc(db, COLLECTIONS.FEES, id));
          if (rootFeeSnap.exists()) {
            feeData = { id: rootFeeSnap.id, ...rootFeeSnap.data() };
            activeTenant = feeData.tenantId || 'genius_root';
          }
        }

        // Fallback: search across all fee subcollections using collectionGroup
        if (!feeData) {
          try {
            const groupSnap = await getDocs(collectionGroup(db, COLLECTIONS.FEES));
            const matched = groupSnap.docs.find((d) => d.id === id);
            if (matched) {
              feeData = { id: matched.id, ...matched.data() };
              activeTenant = feeData.tenantId || matched.ref.parent.parent?.id || 'genius_root';
            }
          } catch (cgErr) {
            console.warn('CollectionGroup fee lookup warning:', cgErr);
          }
        }

        if (feeData) {
          setFee(feeData);

          const getScopedDoc = (collName, docId) => {
            if (activeTenant && activeTenant !== 'genius_root') {
              return doc(db, 'libraries', activeTenant, collName, docId);
            }
            return doc(db, collName, docId);
          };

          // 2. Fetch Student Doc
          if (feeData.studentId) {
            const stuSnap = await getDoc(getScopedDoc(COLLECTIONS.STUDENTS, feeData.studentId));
            if (stuSnap.exists()) {
              const stuData = { id: stuSnap.id, ...stuSnap.data() };
              setStudent(stuData);

              // 3. Fetch Seat Doc
              if (stuData.seatId) {
                try {
                  const seatSnap = await getDoc(getScopedDoc(COLLECTIONS.SEATS, stuData.seatId));
                  if (seatSnap.exists()) {
                    setSeat({ id: seatSnap.id, ...seatSnap.data() });
                  }
                } catch (e) {}
              }
            }
          }

          // 4. Fetch Settings
          const settingsSnap = await getDoc(getScopedDoc(COLLECTIONS.SETTINGS, 'ownerProfile'));
          if (settingsSnap.exists()) {
            setLibraryInfo((prev) => ({ ...prev, ...settingsSnap.data() }));
          }
        }
      } catch (err) {
        console.error('Error fetching public receipt:', err);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchReceiptData();
  }, [id, searchParams]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-2" />
        <p className="text-sm font-bold text-slate-600">Loading Official Fee Receipt...</p>
      </div>
    );
  }

  if (!fee) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4 text-center">
        <div className="bg-white p-8 rounded-3xl shadow-sm max-w-md w-full border border-slate-200">
          <BookOpen className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h2 className="text-xl font-black text-slate-900">Receipt Not Found</h2>
          <p className="text-xs text-slate-500 mt-1">
            This fee receipt does not exist or may have been removed.
          </p>
        </div>
      </div>
    );
  }

  const libraryTitle = libraryInfo.studyPointName || 'Study Point Library';
  const libraryAddress = libraryInfo.address || 'Self Study Point & Reading Hall';
  const libraryPhone = libraryInfo.phone || '';
  const libraryOwner = libraryInfo.ownerName || 'Study Point Owner';
  const libraryLogo = libraryInfo.logoUrl || '';
  const librarySignature = libraryInfo.signatureUrl || '';
  const receiptNo = `SP-${String(fee.month || '').replace('-', '') || '2026'}-${(fee.id || '001').slice(-4).toUpperCase()}`;

  const planTitle = fee.planName
    ? `${fee.planName}${fee.planDuration ? ` (${fee.planDuration} Months)` : ''}`
    : `Monthly Membership (${formatMonthDisplay(fee.month)})`;

  const validityText = fee.periodStart && fee.periodEnd
    ? `${formatDate(fee.periodStart)} to ${formatDate(fee.periodEnd)}`
    : formatMonthDisplay(fee.month);

  const displaySeatNumber =
    seat?.seatNumber ||
    (student?.seatNumber ? student.seatNumber : null) ||
    (student?.seatId && student.seatId.includes('_seat_') ? student.seatId.split('_seat_').pop() : null) ||
    (student?.seatId ? student.seatId : '—');

  const pdfFileName = `Fee_Receipt_${(student?.name || 'Student').replace(/\s+/g, '_')}_${receiptNo}.pdf`;

  const handleDownloadPDF = () => {
    const receiptEl = document.getElementById('public-receipt-card') || receiptRef.current;
    if (!receiptEl) {
      window.print();
      return;
    }

    let printDiv = document.getElementById('print-only-container');
    if (!printDiv) {
      printDiv = document.createElement('div');
      printDiv.id = 'print-only-container';
      document.body.appendChild(printDiv);
    }

    printDiv.innerHTML = receiptEl.outerHTML;
    document.body.classList.add('is-printing-receipt');

    window.print();

    setTimeout(() => {
      document.body.classList.remove('is-printing-receipt');
      if (printDiv) printDiv.innerHTML = '';
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-slate-100 py-8 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto space-y-4">
        {/* Top Control Bar */}
        <div className="flex items-center justify-between bg-white p-4 rounded-2xl shadow-xs border border-slate-200">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-black uppercase tracking-wider text-slate-800">
              Verified Digital Receipt
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPDF}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition-all shadow-md flex items-center gap-2 cursor-pointer"
              title="Save to PDF / Print Receipt"
            >
              <Download className="w-4 h-4" />
              <span>Download PDF</span>
            </button>
          </div>
        </div>

        {/* Printable Official Receipt */}
        <div
          ref={receiptRef}
          id="public-receipt-card"
          className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-slate-200 shadow-sm space-y-5 text-slate-900"
        >
          {/* Header */}
          <div className="text-center border-b border-slate-200 pb-5">
            {libraryLogo ? (
              <div className="flex justify-center mb-2.5">
                <img
                  src={libraryLogo}
                  alt="Library Logo"
                  crossOrigin="anonymous"
                  className="max-h-20 max-w-44 object-contain rounded-2xl p-1 border border-slate-100 bg-white"
                />
              </div>
            ) : (
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600 text-white mb-2 shadow-md shadow-indigo-600/20">
                <BookOpen className="w-7 h-7" />
              </div>
            )}
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight uppercase">
              {libraryTitle}
            </h1>
            <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest mt-1">
              Official Fee Payment Bill & Receipt
            </p>
            <p className="text-xs text-slate-600 mt-1 font-medium">{libraryAddress}</p>
            {libraryPhone && (
              <p className="text-xs text-slate-500 mt-0.5">
                Helpdesk Phone: <strong>{libraryPhone}</strong> {libraryInfo.email ? `• ${libraryInfo.email}` : ''}
              </p>
            )}
          </div>

          {/* Student & Shift Meta Grid */}
          <div className="grid grid-cols-2 gap-3.5 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div>
              <span className="text-slate-400 font-bold uppercase text-[10px]">Receipt Number</span>
              <p className="font-mono font-black text-indigo-700 text-sm mt-0.5">{receiptNo}</p>
            </div>
            <div className="text-right">
              <span className="text-slate-400 font-bold uppercase text-[10px]">Payment Date</span>
              <p className="font-bold text-slate-900 mt-0.5">{formatDate(fee.paidDate)}</p>
            </div>
            <div>
              <span className="text-slate-400 font-bold uppercase text-[10px]">Student Name</span>
              <p className="font-bold text-slate-900 text-sm mt-0.5">{student?.name || fee.studentName || 'Student'}</p>
              <p className="text-[11px] text-slate-500">{student?.phone || ''}</p>
            </div>
            <div className="text-right">
              <span className="text-slate-400 font-bold uppercase text-[10px]">Validity Period</span>
              <p className="font-bold text-emerald-800 mt-0.5">{validityText}</p>
              <p className="text-[11px] text-slate-500">
                Seat #{displaySeatNumber} • {student?.shiftTiming || 'Shift'}
              </p>
            </div>
          </div>

          {/* Itemized Breakdown Table */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden text-xs">
            <table className="w-full">
              <thead className="bg-slate-100/90 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left font-bold text-slate-700 uppercase text-[10px]">
                    Description
                  </th>
                  <th className="px-4 py-3 text-right font-bold text-slate-700 uppercase text-[10px]">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="px-4 py-3 text-slate-800 font-semibold">
                    {libraryTitle} - {planTitle}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-slate-900">
                    {formatCurrency(fee.baseFee || fee.amount)}
                  </td>
                </tr>
                {fee.addonCharges &&
                  Object.entries(fee.addonCharges).map(([name, amt]) => (
                    <tr key={name}>
                      <td className="px-4 py-2.5 text-slate-600 font-medium">{name} Facility Add-on</td>
                      <td className="px-4 py-2.5 text-right font-bold text-slate-900">
                        {formatCurrency(amt)}
                      </td>
                    </tr>
                  ))}
                {fee.discountAmount > 0 && (
                  <tr className="text-emerald-700 font-semibold bg-emerald-50/50">
                    <td className="px-4 py-2.5">Special Concession / Discount</td>
                    <td className="px-4 py-2.5 text-right">- {formatCurrency(fee.discountAmount)}</td>
                  </tr>
                )}
                <tr className="bg-slate-50 font-bold text-xs border-t border-slate-200">
                  <td className="px-4 py-2.5 text-slate-700">Total Plan Fee</td>
                  <td className="px-4 py-2.5 text-right text-slate-900 font-extrabold">
                    {formatCurrency(fee.amount)}
                  </td>
                </tr>
                <tr className="bg-emerald-50/70 font-black text-xs text-emerald-950">
                  <td className="px-4 py-2.5">Total Amount Paid</td>
                  <td className="px-4 py-2.5 text-right text-emerald-800 text-sm">
                    {formatCurrency(fee.paidAmount !== undefined && fee.paidAmount !== null ? fee.paidAmount : (fee.dueAmount > 0 ? fee.amount - fee.dueAmount : fee.amount))}
                  </td>
                </tr>
                {Number(fee.dueAmount) > 0 && (
                  <tr className="bg-amber-50 font-black text-xs text-amber-950 border-t border-amber-200">
                    <td className="px-4 py-2.5 text-amber-900">Remaining Balance Due</td>
                    <td className="px-4 py-2.5 text-right text-amber-700 text-sm">
                      {formatCurrency(fee.dueAmount)}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Installment Payment History */}
          {fee.payments && fee.payments.length > 0 && (
            <div className="border border-slate-200 rounded-2xl overflow-hidden text-xs">
              <div className="bg-slate-100 px-4 py-2.5 border-b border-slate-200 font-bold text-[11px] text-slate-700 uppercase tracking-wide">
                Installment Payment History ({fee.payments.length})
              </div>
              <table className="w-full">
                <thead className="bg-slate-50 text-[10px] uppercase text-slate-500 font-semibold border-b border-slate-100">
                  <tr>
                    <th className="px-3 py-2 text-left">#</th>
                    <th className="px-3 py-2 text-left">Date</th>
                    <th className="px-3 py-2 text-left">Mode</th>
                    <th className="px-3 py-2 text-right">Amount Paid</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {fee.payments.map((p, idx) => (
                    <tr key={p.id || idx}>
                      <td className="px-3 py-2 text-slate-500 font-mono font-bold">{idx + 1}</td>
                      <td className="px-3 py-2 text-slate-700 font-medium">{formatDate(p.paidDate)}</td>
                      <td className="px-3 py-2 text-slate-800 font-semibold">
                        {p.paymentMode === 'split'
                          ? `Split (Cash: ₹${p.splitDetails?.cash || 0} + UPI: ₹${p.splitDetails?.upi || 0})`
                          : (p.paymentMode || 'Cash').toUpperCase()}
                      </td>
                      <td className="px-3 py-2 text-right font-bold text-emerald-700">
                        {formatCurrency(p.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Payment Mode, Status Badge & Signature Preview */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
            <div>
              <p className="text-slate-500">
                Payment Mode:{' '}
                <strong className="text-indigo-700 font-extrabold">
                  {fee.paymentMode === 'split'
                    ? `SPLIT (Cash: ₹${fee.splitDetails?.cash || 0} + UPI: ₹${fee.splitDetails?.upi || 0})`
                    : (fee.paymentMode || 'CASH').toUpperCase()}
                </strong>
              </p>
              {fee.notes && <p className="text-slate-400 text-[11px] mt-0.5">Remarks: {fee.notes}</p>}
              {Number(fee.dueAmount) > 0 || fee.status === 'partial' ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-900 border border-amber-300 rounded-full font-black text-xs uppercase mt-2">
                  <span>🟡 PARTIALLY PAID (₹{fee.dueAmount} DUE)</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-full font-black text-xs uppercase mt-2">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>PAID & VERIFIED</span>
                </span>
              )}
            </div>

            {/* Signature Preview Box */}
            <div className="text-center sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0">
              {librarySignature ? (
                <div className="inline-block text-center">
                  <img
                    src={librarySignature}
                    alt="Authorized Signature"
                    crossOrigin="anonymous"
                    className="max-h-12 max-w-28 object-contain mx-auto"
                  />
                  <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5 border-t border-slate-300 pt-0.5">
                    Authorized Signatory
                  </p>
                  <p className="text-[11px] font-bold text-indigo-700">{libraryOwner}</p>
                </div>
              ) : (
                <div className="text-slate-400 text-center">
                  <p className="text-[10px] uppercase font-bold border-t border-slate-300 pt-1">
                    Authorized Signatory
                  </p>
                  <p className="text-[11px] font-bold text-slate-700">{libraryOwner}</p>
                </div>
              )}
            </div>
          </div>

          {/* Terms & Conditions Box */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-600 space-y-1">
            <p className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">
              Terms & Conditions:
            </p>
            <ol className="list-decimal list-inside space-y-0.5 text-slate-600 font-medium pl-0.5 leading-relaxed">
              <li>Your seat is reserved for the subscribed period.</li>
              <li>The fee is non-refundable under any circumstances.</li>
              <li>The fee is non-transferrable.</li>
            </ol>
          </div>

          <div className="text-center pt-2 text-[11px] text-slate-400">
            Official computer-generated receipt issued by <strong>{libraryTitle}</strong>.
          </div>
        </div>
      </div>
    </div>
  );
}
