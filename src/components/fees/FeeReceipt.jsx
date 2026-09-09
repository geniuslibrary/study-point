import { useState, useEffect, useRef } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { formatCurrency, formatDate, formatMonthDisplay, calculateSeatAddonCharges, getStoredAddons } from '../../utils/helpers';
import { BookOpen, Download, MessageSquare, CheckCircle2, PenTool, Loader2, ExternalLink, Printer } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { COLLECTIONS } from '../../utils/constants';
import { getFirestoreDocRef, getActiveTenantId, getTenantStorageKey } from '../../firebase/storageService';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

const getSettingsKey = () => getTenantStorageKey('settings');

export default function FeeReceipt({ isOpen, onClose, fee, student, section, seat }) {
  const receiptRef = useRef(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfToast, setPdfToast] = useState('');

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
    if (!isOpen) return;

    const sKey = getSettingsKey();
    let local = localStorage.getItem(sKey);
    if (!local && getActiveTenantId() === 'genius_root') {
      local = localStorage.getItem('studypoint_settings');
      if (local) localStorage.setItem(sKey, local);
    }
    if (local) {
      try {
        setLibraryInfo((prev) => ({ ...prev, ...JSON.parse(local) }));
      } catch (e) {}
    }

    const fetchCloudSettings = async () => {
      try {
        const docSnap = await getDoc(getFirestoreDocRef(COLLECTIONS.SETTINGS, 'ownerProfile'));
        if (docSnap.exists()) {
          const data = docSnap.data();
          setLibraryInfo((prev) => ({ ...prev, ...data }));
          localStorage.setItem(sKey, JSON.stringify(data));
        }
      } catch (e) {
        console.warn('Receipt settings fetch warning:', e.message);
      }
    };

    fetchCloudSettings();
  }, [isOpen]);

  if (!fee) return null;

  const libraryTitle = libraryInfo.studyPointName || 'Study Point Library';
  const libraryAddress = libraryInfo.address || 'Self Study Point & Reading Hall';
  const libraryPhone = libraryInfo.phone || '';
  const libraryOwner = libraryInfo.ownerName || 'Study Point Owner';
  const libraryLogo = libraryInfo.logoUrl || '';
  const librarySignature = libraryInfo.signatureUrl || '';
  const receiptNo = `SP-${String(fee.month || '').replace('-', '') || '2026'}-${(fee.id || '001').slice(-4).toUpperCase()}`;

  const isDayPlan = Boolean(
    fee.isDayBased ||
    fee.durationUnit === 'days' ||
    (fee.planName && (fee.planName.toLowerCase().includes('day') || fee.planName.toLowerCase().includes('extension')))
  );

  const durationDays = isDayPlan
    ? (Number(fee.durationDays) || (fee.periodStart && fee.periodEnd ? Math.max(1, Math.round((new Date(fee.periodEnd) - new Date(fee.periodStart)) / (24 * 60 * 60 * 1000))) : 10))
    : null;

  const duration = isDayPlan
    ? Math.max(1, Math.round((durationDays || 10) / 30))
    : (Number(fee.planDuration) || (fee.periodStart && fee.periodEnd ? Math.max(1, Math.round((new Date(fee.periodEnd) - new Date(fee.periodStart)) / (30 * 24 * 60 * 60 * 1000))) : 1));

  // Compute final addon charges (from fee.addonCharges or from seat's active addons)
  let finalAddonCharges = fee.addonCharges && Object.keys(fee.addonCharges).length > 0 ? { ...fee.addonCharges } : {};
  if (Object.keys(finalAddonCharges).length === 0 && seat?.addons) {
    const { charges } = calculateSeatAddonCharges(seat.addons, getStoredAddons(), duration);
    if (Object.keys(charges).length > 0) {
      finalAddonCharges = charges;
    }
  }

  const addonTotal = Object.values(finalAddonCharges).reduce((sum, v) => sum + (Number(v) || 0), 0);
  const baseRate = Number(fee.baseFee) || (Number(fee.amount) || 0);
  const discountAmt = Number(fee.discountAmount) || 0;
  const totalPayable = fee.amount !== undefined && fee.amount !== null
    ? (Object.keys(fee.addonCharges || {}).length > 0 ? Number(fee.amount) : Math.max(0, baseRate + addonTotal - discountAmt))
    : Math.max(0, baseRate + addonTotal - discountAmt);

  const dueAmount = Number(fee.dueAmount) || 0;
  const paidAmount = fee.paidAmount !== undefined && fee.paidAmount !== null
    ? Number(fee.paidAmount)
    : (dueAmount > 0 ? Math.max(0, totalPayable - dueAmount) : totalPayable);
  const isPartial = fee.status === 'partial' || dueAmount > 0;

  const getPaymentModeDisplay = (mode, split) => {
    const m = (mode || 'CASH').toUpperCase();
    if (m === 'SPLIT') {
      const c = Number(split?.cash) || 0;
      const u = Number(split?.upi) || 0;
      return `SPLIT (Cash: ₹${c} + UPI: ₹${u})`;
    }
    return m;
  };

  let planTitle = fee.planName || (isDayPlan ? `${durationDays} Days Plan` : `Monthly Membership (${formatMonthDisplay(fee.month)})`);
  if (!planTitle.toLowerCase().includes('day') && !planTitle.toLowerCase().includes('extension') && !planTitle.toLowerCase().includes('month')) {
    if (isDayPlan) {
      planTitle = `${planTitle} (${durationDays} Days)`;
    } else if (duration) {
      planTitle = `${planTitle} (${duration} Month${duration > 1 ? 's' : ''})`;
    }
  }

  const validityText = fee.periodStart && fee.periodEnd
    ? `${formatDate(fee.periodStart)} to ${formatDate(fee.periodEnd)}`
    : formatMonthDisplay(fee.month);

  const displaySeatNumber =
    seat?.seatNumber ||
    (student?.seatNumber ? student.seatNumber : null) ||
    (student?.seatId && student.seatId.includes('_seat_') ? student.seatId.split('_seat_').pop() : null) ||
    (student?.seatId ? student.seatId : '—');

  const pdfFileName = `Fee_Receipt_${(student?.name || 'Student').replace(/\s+/g, '_')}_${receiptNo}.pdf`;
  const tenantId = getActiveTenantId();
  const tenantParam = tenantId && tenantId !== 'genius_root' ? `?tenant=${tenantId}` : '';
  const onlineReceiptUrl = `${window.location.origin}/receipt/${fee.id}${tenantParam}`;

  // 1. Download / Save as PDF via native browser dialog (Guaranteed Strict 1 of 1 Page)
  const handleDownloadPDF = () => {
    const receiptEl = document.getElementById('printable-fee-receipt') || receiptRef.current;
    if (!receiptEl) {
      window.print();
      return;
    }

    // 1. Get or create dedicated print container directly in body
    let printDiv = document.getElementById('print-only-container');
    if (!printDiv) {
      printDiv = document.createElement('div');
      printDiv.id = 'print-only-container';
      document.body.appendChild(printDiv);
    }

    // 2. Clone the fully styled receipt into the print container
    printDiv.innerHTML = receiptEl.outerHTML;

    // 3. Mark body to isolate print container and hide root
    document.body.classList.add('is-printing-receipt');

    // 4. Trigger print
    window.print();

    // 5. Clean up after print dialog finishes
    setTimeout(() => {
      document.body.classList.remove('is-printing-receipt');
      if (printDiv) printDiv.innerHTML = '';
    }, 1000);
  };

  // 2. Share Live Digital Bill on WhatsApp (Instant non-blocking redirect)
  const handleShareWhatsApp = () => {
    const cleanPhone = (student?.phone || '').replace(/\D/g, '');
    const phoneWithCountry = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

    let addonSummary = '';
    if (Object.keys(finalAddonCharges).length > 0) {
      addonSummary = Object.entries(finalAddonCharges)
        .map(([n, a]) => `🔒 *${n} Add-on:* ₹${a} (${duration} Mo)\n`)
        .join('');
    }

    const perksList = fee.planFeatures || fee.includedBenefits || student?.planFeatures || student?.includedBenefits || [];
    let perksSummary = '';
    if (perksList.length > 0) {
      perksSummary = `🎁 *Included Benefits:* ${perksList.join(', ')}\n`;
    }

    const paymentModeLabel = getPaymentModeDisplay(fee.paymentMode, fee.splitDetails);
    const isZeroPaid = Number(paidAmount) <= 0;
    const feeStatusLine = isZeroPaid
      ? `🔴 *Status:* PAYMENT DUE / UNPAID (Due Amount: ₹${dueAmount})\n`
      : isPartial
        ? `🟡 *Status:* PARTIALLY PAID (Remaining Due: ₹${dueAmount})\n`
        : `✅ *Status:* PAID & VERIFIED\n`;

    const financialSummary = isZeroPaid
      ? `💰 *Total Plan Fee:* ₹${totalPayable}\n` +
        `💵 *Paid Amount:* ₹0\n` +
        `⏳ *Remaining Balance Due:* ₹${dueAmount}\n`
      : isPartial
        ? `💰 *Total Plan Fee:* ₹${totalPayable}\n` +
          `💵 *Paid Amount:* ₹${paidAmount}\n` +
          `⏳ *Remaining Balance Due:* ₹${dueAmount}\n`
        : `💰 *Amount Paid:* ₹${paidAmount}\n` +
          `⚖️ *Balance Due:* ₹0 (Nil)\n`;

    const greetingLine = isZeroPaid
      ? `Your membership validity has been extended. The fee of *₹${dueAmount}* is currently pending/due.\n\n`
      : `Your fee payment of *₹${paidAmount}* has been confirmed!\n\n`;

    const message = `🎉 *FEE PAYMENT RECEIPT - ${libraryTitle.toUpperCase()}*\n\n` +
      `Hello *${student?.name || 'Student'}*,\n` +
      greetingLine +
      `🧾 *Receipt No:* ${receiptNo}\n` +
      `📦 *Plan:* ${planTitle}\n` +
      (perksSummary ? perksSummary : '') +
      (addonSummary ? addonSummary : '') +
      (discountAmt > 0 ? `🏷️ *Discount:* -₹${discountAmt}\n` : '') +
      `📅 *Validity Period:* ${validityText}\n` +
      `📍 *Seat Allocated:* Seat #${displaySeatNumber} (${student?.shiftTiming || 'Shift'})\n` +
      `💳 *Payment Mode:* ${paymentModeLabel}\n` +
      financialSummary +
      feeStatusLine + '\n' +
      `📜 *Terms & Conditions:*\n` +
      `1. Your seat is reserved for the subscribed period.\n` +
      `2. The fee is non-refundable under any circumstances.\n` +
      `3. The fee is non-transferrable.\n\n` +
      `📄 *View & Download Official PDF Receipt:* \n👉 ${onlineReceiptUrl}\n\n` +
      `Thank you for studying at ${libraryTitle}! 🙏`;

    const waUrl = `https://api.whatsapp.com/send?phone=${phoneWithCountry}&text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');

    setPdfToast('🎉 WhatsApp Redirected!');
    setTimeout(() => setPdfToast(''), 4000);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Official Fee Bill & Receipt" size="lg">
      <div className="space-y-4">
        {pdfToast && (
          <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{pdfToast}</span>
          </div>
        )}

        {/* Receipt Container (Target for PDF Generation) */}
        <div
          ref={receiptRef}
          id="printable-fee-receipt"
          className="p-6 bg-white rounded-2xl border-2 border-slate-200 shadow-sm space-y-4 text-slate-900"
        >
          {/* Header */}
          <div className="text-center border-b border-slate-200 pb-4">
            {libraryLogo ? (
              <div className="flex justify-center mb-2">
                <img
                  src={libraryLogo}
                  alt="Library Logo"
                  crossOrigin="anonymous"
                  className="max-h-16 max-w-36 object-contain rounded-xl shadow-xs p-1 border border-slate-100 bg-white"
                />
              </div>
            ) : (
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-600 text-white mb-2 shadow-md shadow-indigo-600/20">
                <BookOpen className="w-6 h-6" />
              </div>
            )}
            <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">{libraryTitle}</h2>
            <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest mt-0.5">
              Official Fee Payment Bill & Receipt
            </p>
            <p className="text-xs text-slate-600 mt-1 font-medium">{libraryAddress}</p>
            {libraryPhone && (
              <p className="text-[11px] text-slate-400">
                Phone: {libraryPhone} {libraryInfo.email ? `• ${libraryInfo.email}` : ''}
              </p>
            )}
          </div>

          {/* Student & Shift Meta Grid */}
          <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
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
              <p className="font-bold text-slate-900 text-sm mt-0.5">{student?.name || '—'}</p>
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
          <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
            <table className="w-full">
              <thead className="bg-slate-100/80 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-2.5 text-left font-bold text-slate-700 uppercase text-[10px]">
                    Description
                  </th>
                  <th className="px-4 py-2.5 text-right font-bold text-slate-700 uppercase text-[10px]">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="px-4 py-3 text-slate-800 font-medium">
                    {libraryTitle} - {planTitle}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-slate-900">
                    {formatCurrency(baseRate)}
                  </td>
                </tr>
                {(() => {
                  const perks = fee.planFeatures || fee.includedBenefits || student?.planFeatures || student?.includedBenefits || [];
                  if (perks.length === 0) return null;
                  return (
                    <tr className="bg-emerald-50/40">
                      <td colSpan={2} className="px-4 py-2 text-emerald-800 text-[11px]">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-emerald-950">🎁 Free Plan Perks:</span>
                          {perks.map((p, i) => (
                            <span key={i} className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                              ✓ {p}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  );
                })()}
                {Object.entries(finalAddonCharges).map(([name, amt]) => {
                  const monthlyRate = duration > 0 ? Math.round(amt / duration) : amt;
                  return (
                    <tr key={name} className="bg-indigo-50/40">
                      <td className="px-4 py-2.5 text-indigo-950 font-semibold">
                        <span className="flex items-center gap-1.5">
                          <span>🔒 {name} Facility Add-on</span>
                          <span className="text-[10px] text-indigo-600 font-bold">
                            (₹{monthlyRate}/month × {duration} Month{duration > 1 ? 's' : ''})
                          </span>
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right font-bold text-indigo-900">
                        +{formatCurrency(amt)}
                      </td>
                    </tr>
                  );
                })}
                {discountAmt > 0 && (
                  <tr className="text-emerald-700 font-semibold bg-emerald-50/50">
                    <td className="px-4 py-2.5">Special Concession / Discount</td>
                    <td className="px-4 py-2.5 text-right">- {formatCurrency(discountAmt)}</td>
                  </tr>
                )}
                <tr className="bg-slate-50 font-bold text-xs border-t border-slate-200">
                  <td className="px-4 py-2.5 text-slate-700">Total Plan Fee</td>
                  <td className="px-4 py-2.5 text-right text-slate-900 font-extrabold">
                    {formatCurrency(totalPayable)}
                  </td>
                </tr>
                <tr className="bg-emerald-50/70 font-black text-xs text-emerald-950">
                  <td className="px-4 py-2.5">Total Amount Paid</td>
                  <td className="px-4 py-2.5 text-right text-emerald-800 text-sm">
                    {formatCurrency(paidAmount)}
                  </td>
                </tr>
                {dueAmount > 0 && (
                  <tr className="bg-amber-50 font-black text-xs text-amber-950 border-t border-amber-200">
                    <td className="px-4 py-2.5 text-amber-900">Remaining Balance Due</td>
                    <td className="px-4 py-2.5 text-right text-amber-700 text-sm">
                      {formatCurrency(dueAmount)}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Installment Payment History (if multiple installments exist) */}
          {fee.payments && fee.payments.length > 0 && (
            <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
              <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 font-bold text-[11px] text-slate-700 uppercase tracking-wide">
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
            <div>
              <p className="text-slate-500">
                Payment Mode:{' '}
                <strong className="text-indigo-700 font-extrabold">
                  {getPaymentModeDisplay(fee.paymentMode, fee.splitDetails)}
                </strong>
              </p>
              {fee.notes && <p className="text-slate-400 text-[11px] mt-0.5">Remarks: {fee.notes}</p>}
              {Number(paidAmount) <= 0 ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-100 text-rose-900 border border-rose-300 rounded-full font-black text-xs uppercase mt-2">
                  <span>🔴 PAYMENT DUE / UNPAID (₹{dueAmount} DUE)</span>
                </span>
              ) : isPartial ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-900 border border-amber-300 rounded-full font-black text-xs uppercase mt-2">
                  <span>🟡 PARTIALLY PAID (₹{dueAmount} DUE)</span>
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
          <div className="p-3 bg-slate-50/90 border border-slate-200/90 rounded-xl text-[11px] text-slate-600 space-y-1">
            <p className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">
              Terms & Conditions:
            </p>
            <ol className="list-decimal list-inside space-y-0.5 text-slate-600 font-medium pl-0.5 leading-relaxed">
              <li>Your seat is reserved for the subscribed period.</li>
              <li>The fee is non-refundable under any circumstances.</li>
              <li>The fee is non-transferrable.</li>
            </ol>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleShareWhatsApp}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer"
              title="Share Live Digital Bill on WhatsApp"
            >
              <MessageSquare className="w-4 h-4" />
              <span>WhatsApp PDF Bill</span>
            </button>

            <button
              onClick={handleDownloadPDF}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition-all shadow-md flex items-center gap-2 cursor-pointer"
              title="Save to PDF / Print Receipt"
            >
              <Download className="w-4 h-4" />
              <span>Download PDF</span>
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
