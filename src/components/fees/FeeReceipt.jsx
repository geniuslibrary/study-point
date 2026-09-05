import { useState, useEffect, useRef } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { formatCurrency, formatDate, calculateSeatAddonCharges, getStoredAddons } from '../../utils/helpers';
import { BookOpen, Download, MessageSquare, CheckCircle2, PenTool, Loader2, ExternalLink, Printer } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { COLLECTIONS } from '../../utils/constants';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

const SETTINGS_LOCAL_KEY = 'studypoint_settings';

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

    const local = localStorage.getItem(SETTINGS_LOCAL_KEY);
    if (local) {
      try {
        setLibraryInfo((prev) => ({ ...prev, ...JSON.parse(local) }));
      } catch (e) {}
    }

    const fetchCloudSettings = async () => {
      try {
        const docSnap = await getDoc(doc(db, COLLECTIONS.SETTINGS, 'ownerProfile'));
        if (docSnap.exists()) {
          const data = docSnap.data();
          setLibraryInfo((prev) => ({ ...prev, ...data }));
          localStorage.setItem(SETTINGS_LOCAL_KEY, JSON.stringify(data));
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
  const receiptNo = `SP-${fee.month?.replace('-', '') || '2026'}-${(fee.id || '001').slice(-4).toUpperCase()}`;

  const duration = Number(fee.planDuration) || (fee.periodStart && fee.periodEnd ? Math.max(1, Math.round((new Date(fee.periodEnd) - new Date(fee.periodStart)) / (30 * 24 * 60 * 60 * 1000))) : 1);

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
  const totalReceived = fee.amount !== undefined && fee.amount !== null
    ? (Object.keys(fee.addonCharges || {}).length > 0 ? Number(fee.amount) : Math.max(0, baseRate + addonTotal - discountAmt))
    : Math.max(0, baseRate + addonTotal - discountAmt);

  const planTitle = fee.planName
    ? `${fee.planName}${duration ? ` (${duration} Month${duration > 1 ? 's' : ''})` : ''}`
    : `Monthly Membership (${fee.month})`;

  const validityText = fee.periodStart && fee.periodEnd
    ? `${formatDate(fee.periodStart)} to ${formatDate(fee.periodEnd)}`
    : fee.month;

  const displaySeatNumber =
    seat?.seatNumber ||
    (student?.seatNumber ? student.seatNumber : null) ||
    (student?.seatId && student.seatId.includes('_seat_') ? student.seatId.split('_seat_').pop() : null) ||
    (student?.seatId ? student.seatId : '—');

  const pdfFileName = `Fee_Receipt_${(student?.name || 'Student').replace(/\s+/g, '_')}_${receiptNo}.pdf`;
  const onlineReceiptUrl = `${window.location.origin}/receipt/${fee.id}`;

  // 1. Direct High-Resolution PDF Download (Strict 1-2 Pages)
  const handleDownloadPDF = async () => {
    const element = document.getElementById('printable-fee-receipt') || receiptRef.current;
    if (!element) return;
    setIsGeneratingPdf(true);

    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#ffffff',
        logging: false,
        scrollX: 0,
        scrollY: -window.scrollY,
        windowWidth: document.documentElement.offsetWidth,
        windowHeight: document.documentElement.offsetHeight,
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.98);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth(); // 210mm
      const pdfHeight = pdf.internal.pageSize.getHeight(); // 297mm
      const margin = 10;
      const contentWidth = pdfWidth - margin * 2; // 190mm
      const contentHeight = (canvas.height * contentWidth) / canvas.width;
      const printableHeight = pdfHeight - margin * 2; // 277mm

      if (contentHeight <= printableHeight) {
        // Fits perfectly on a single 1-page A4
        pdf.addImage(imgData, 'JPEG', margin, margin, contentWidth, contentHeight);
      } else {
        // Multi-page clean split (max 2 pages)
        let heightLeft = contentHeight;
        let position = margin;

        pdf.addImage(imgData, 'JPEG', margin, position, contentWidth, contentHeight);
        heightLeft -= printableHeight;

        while (heightLeft > 0) {
          position = position - printableHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'JPEG', margin, position, contentWidth, contentHeight);
          heightLeft -= printableHeight;
        }
      }

      pdf.save(pdfFileName);

      setPdfToast('🎉 PDF Receipt Downloaded Successfully!');
      setTimeout(() => setPdfToast(''), 4000);
    } catch (err) {
      console.error('PDF error:', err);
      setPdfToast('⚠️ PDF error: ' + (err?.message || 'Download failed'));
      setTimeout(() => setPdfToast(''), 4000);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // 2. Direct 1-Page Print Handler
  const handlePrint = () => {
    window.print();
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

    const message = `🎉 *FEE PAYMENT RECEIPT - ${libraryTitle.toUpperCase()}*\n\n` +
      `Hello *${student?.name || 'Student'}*,\n` +
      `Your official fee payment of *₹${totalReceived}* has been confirmed!\n\n` +
      `🧾 *Receipt No:* ${receiptNo}\n` +
      `📦 *Plan:* ${planTitle}\n` +
      (addonSummary ? addonSummary : '') +
      (discountAmt > 0 ? `🏷️ *Discount:* -₹${discountAmt}\n` : '') +
      `📅 *Validity Period:* ${validityText}\n` +
      `📍 *Seat Allocated:* Seat #${displaySeatNumber} (${student?.shiftTiming || 'Shift'})\n` +
      `💳 *Payment Mode:* ${(fee.paymentMode || 'CASH').toUpperCase()}\n` +
      `✅ *Status:* PAID & VERIFIED\n\n` +
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
                {Object.entries(finalAddonCharges).map(([name, amt]) => {
                  const monthlyRate = duration > 0 ? Math.round(amt / duration) : amt;
                  return (
                    <tr key={name} className="bg-indigo-50/40">
                      <td className="px-4 py-2.5 text-indigo-950 font-semibold">
                        <span className="flex items-center gap-1.5">
                          <span>🔒 {name} Facility Add-on</span>
                          <span className="text-[10px] text-indigo-600 font-bold">
                            (₹{monthlyRate}/mo × {duration} Month{duration > 1 ? 's' : ''})
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
                <tr className="bg-indigo-50/80 font-extrabold text-sm">
                  <td className="px-4 py-3 text-indigo-950">TOTAL AMOUNT RECEIVED</td>
                  <td className="px-4 py-3 text-right text-indigo-700 text-base">
                    {formatCurrency(totalReceived)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Payment Mode, Status Badge & Signature Preview */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
            <div>
              <p className="text-slate-500">
                Payment Mode:{' '}
                <strong className="text-indigo-700 font-extrabold uppercase">
                  {fee.paymentMode || 'CASH'}
                </strong>
              </p>
              {fee.notes && <p className="text-slate-400 text-[11px] mt-0.5">Remarks: {fee.notes}</p>}
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-full font-black text-xs uppercase mt-2">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>PAID & VERIFIED</span>
              </span>
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
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <Button variant="secondary" onClick={onClose} disabled={isGeneratingPdf}>
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
              disabled={isGeneratingPdf}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-black transition-all shadow-md flex items-center gap-2 cursor-pointer"
              title="Download PDF Receipt"
            >
              {isGeneratingPdf ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              <span>{isGeneratingPdf ? 'Saving...' : 'Download PDF'}</span>
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
