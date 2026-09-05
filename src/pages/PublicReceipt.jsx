import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { COLLECTIONS } from '../utils/constants';
import { formatCurrency, formatDate } from '../utils/helpers';
import { BookOpen, Download, Printer, CheckCircle2, ShieldCheck, ArrowLeft, Loader2 } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export default function PublicReceipt() {
  const { id } = useParams();
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
        // 1. Fetch Fee Doc
        const feeSnap = await getDoc(doc(db, COLLECTIONS.FEES, id));
        if (feeSnap.exists()) {
          const feeData = { id: feeSnap.id, ...feeSnap.data() };
          setFee(feeData);

          // 2. Fetch Student Doc
          if (feeData.studentId) {
            const stuSnap = await getDoc(doc(db, COLLECTIONS.STUDENTS, feeData.studentId));
            if (stuSnap.exists()) {
              const stuData = { id: stuSnap.id, ...stuSnap.data() };
              setStudent(stuData);

              // 3. Fetch Seat Doc
              if (stuData.seatId) {
                try {
                  const seatSnap = await getDoc(doc(db, COLLECTIONS.SEATS, stuData.seatId));
                  if (seatSnap.exists()) {
                    setSeat({ id: seatSnap.id, ...seatSnap.data() });
                  }
                } catch (e) {}
              }
            }
          }
        }

        // 4. Fetch Settings
        const settingsSnap = await getDoc(doc(db, COLLECTIONS.SETTINGS, 'ownerProfile'));
        if (settingsSnap.exists()) {
          setLibraryInfo((prev) => ({ ...prev, ...settingsSnap.data() }));
        }
      } catch (err) {
        console.error('Error fetching public receipt:', err);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchReceiptData();
  }, [id]);

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
  const receiptNo = `SP-${fee.month?.replace('-', '') || '2026'}-${(fee.id || '001').slice(-4).toUpperCase()}`;

  const planTitle = fee.planName
    ? `${fee.planName}${fee.planDuration ? ` (${fee.planDuration} Months)` : ''}`
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

  const handleDownloadPDF = async () => {
    const element = document.getElementById('public-receipt-card') || receiptRef.current;
    if (!element) return;
    setIsGeneratingPdf(true);

    let cloneContainer = null;
    try {
      // 1. Create clean offscreen container
      cloneContainer = document.createElement('div');
      cloneContainer.style.position = 'fixed';
      cloneContainer.style.left = '-9999px';
      cloneContainer.style.top = '0';
      cloneContainer.style.width = '750px';
      cloneContainer.style.background = '#ffffff';
      cloneContainer.style.zIndex = '-9999';

      // 2. Clone receipt
      const clone = element.cloneNode(true);
      clone.style.width = '100%';
      clone.style.maxWidth = '100%';
      clone.style.margin = '0';
      clone.style.padding = '24px';
      clone.style.boxShadow = 'none';
      clone.style.border = '2px solid #e2e8f0';
      clone.style.borderRadius = '16px';
      cloneContainer.appendChild(clone);
      document.body.appendChild(cloneContainer);

      // 3. Render canvas
      const canvas = await html2canvas(clone, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#ffffff',
        logging: false,
        imageTimeout: 4000,
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
        // Fits on 1 single page
        pdf.addImage(imgData, 'JPEG', margin, margin, contentWidth, contentHeight);
      } else {
        // If it really exceeds 1 page, clean split
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
    } catch (err) {
      console.warn('Primary PDF generation failed, attempting safe fallback:', err);
      try {
        if (cloneContainer) {
          const imgs = cloneContainer.querySelectorAll('img');
          imgs.forEach((img) => img.remove());
          const canvas2 = await html2canvas(cloneContainer.firstElementChild || cloneContainer, {
            scale: 2,
            backgroundColor: '#ffffff',
            logging: false,
          });
          const imgData2 = canvas2.toDataURL('image/jpeg', 0.98);
          const pdf2 = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
          const pdfWidth2 = pdf2.internal.pageSize.getWidth();
          const margin2 = 10;
          const contentWidth2 = pdfWidth2 - margin2 * 2;
          const contentHeight2 = (canvas2.height * contentWidth2) / canvas2.width;
          pdf2.addImage(imgData2, 'JPEG', margin2, margin2, contentWidth2, Math.min(contentHeight2, 277));
          pdf2.save(pdfFileName);
        }
      } catch (fallbackErr) {
        console.error('PDF error:', fallbackErr);
      }
    } finally {
      if (cloneContainer && cloneContainer.parentNode) {
        cloneContainer.parentNode.removeChild(cloneContainer);
      }
      setIsGeneratingPdf(false);
    }
  };

  const handlePrint = () => {
    window.print();
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
              onClick={handlePrint}
              disabled={isGeneratingPdf}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
              title="Direct 1-Page Print"
            >
              <Printer className="w-4 h-4" />
              <span>Print (1-Page)</span>
            </button>

            <button
              onClick={handleDownloadPDF}
              disabled={isGeneratingPdf}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-black transition-all shadow-md flex items-center gap-2 cursor-pointer"
            >
              {isGeneratingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              <span>{isGeneratingPdf ? 'Saving...' : 'Download PDF'}</span>
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
                <tr className="bg-indigo-50/80 font-extrabold text-sm">
                  <td className="px-4 py-3 text-indigo-950">TOTAL AMOUNT RECEIVED</td>
                  <td className="px-4 py-3 text-right text-indigo-700 text-base">
                    {formatCurrency(fee.amount)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Payment Mode, Status Badge & Signature Preview */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
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

          <div className="text-center pt-2 text-[11px] text-slate-400">
            Official computer-generated receipt issued by <strong>{libraryTitle}</strong>.
          </div>
        </div>
      </div>
    </div>
  );
}
