import { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { formatCurrency, formatDate } from '../../utils/helpers';
import { Printer, BookOpen, Download, MessageSquare, CheckCircle2, ShieldCheck, Tag, PenTool } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { COLLECTIONS } from '../../utils/constants';

const SETTINGS_LOCAL_KEY = 'studypoint_settings';

export default function FeeReceipt({ isOpen, onClose, fee, student, section, seat }) {
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

  const planTitle = fee.planName
    ? `${fee.planName}${fee.planDuration ? ` (${fee.planDuration} Months)` : ''}`
    : `Monthly Membership (${fee.month})`;

  const validityText = fee.periodStart && fee.periodEnd
    ? `${formatDate(fee.periodStart)} to ${formatDate(fee.periodEnd)}`
    : fee.month;

  const handlePrintOrSavePDF = () => {
    const printWindow = window.open('', '_blank', 'width=800,height=900');

    const logoHtml = libraryLogo
      ? `<img src="${libraryLogo}" alt="Logo" style="max-height: 65px; max-width: 140px; object-fit: contain; margin-bottom: 8px; border-radius: 8px;" />`
      : `<div style="display: inline-block; width: 44px; height: 44px; line-height: 44px; background: #4338ca; color: #fff; border-radius: 12px; font-size: 20px; font-weight: bold; margin-bottom: 8px;">📚</div>`;

    const signHtml = librarySignature
      ? `<img src="${librarySignature}" alt="Authorized Signature" style="max-height: 48px; max-width: 140px; object-fit: contain; margin-bottom: 2px;" /><br/>`
      : '';

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Fee Receipt - ${student?.name || 'Student'} - ${receiptNo}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap');
            * { box-sizing: border-box; font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; }
            body { margin: 0; padding: 24px; color: #0f172a; background: #fff; }
            .receipt-container { max-width: 650px; margin: 0 auto; border: 2px solid #e2e8f0; border-radius: 16px; padding: 32px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
            .header { text-align: center; border-bottom: 2px dashed #cbd5e1; padding-bottom: 18px; margin-bottom: 20px; }
            .logo-title { font-size: 24px; font-weight: 900; color: #4338ca; letter-spacing: -0.5px; margin: 4px 0 0 0; text-transform: uppercase; }
            .sub-title { font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 1.5px; margin-top: 4px; }
            .tagline { font-size: 12px; color: #475569; margin-top: 4px; font-weight: 500; }
            .contact-tag { font-size: 11px; color: #64748b; margin-top: 2px; }
            .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; background: #f8fafc; border: 1px solid #f1f5f9; padding: 16px; border-radius: 12px; }
            .meta-item { font-size: 12px; }
            .meta-label { color: #64748b; font-size: 11px; font-weight: 600; text-transform: uppercase; }
            .meta-val { font-weight: 700; color: #0f172a; margin-top: 2px; font-size: 13px; }
            .table-wrap { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
            .table-wrap th { background: #f1f5f9; text-align: left; padding: 10px 14px; font-size: 11px; font-weight: 700; text-transform: uppercase; color: #475569; border-bottom: 1px solid #e2e8f0; }
            .table-wrap td { padding: 12px 14px; font-size: 12px; border-bottom: 1px solid #f1f5f9; }
            .table-wrap .total-row td { background: #eef2ff; font-weight: 800; font-size: 14px; color: #3730a3; border-top: 2px solid #c7d2fe; }
            .paid-badge { display: inline-block; padding: 4px 12px; background: #dcfce7; color: #166534; font-size: 11px; font-weight: 800; border-radius: 9999px; border: 1px solid #bbf7d0; text-transform: uppercase; }
            .footer-notes { display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 16px; align-items: flex-end; margin-top: 28px; padding-top: 16px; border-top: 1px solid #e2e8f0; }
            .sign-box { text-align: center; border-top: 1px solid #94a3b8; padding-top: 6px; font-size: 11px; font-weight: 700; color: #475569; margin-top: 40px; }
            @media print {
              body { padding: 0; }
              .receipt-container { border: none; box-shadow: none; padding: 16px; }
            }
          </style>
        </head>
        <body>
          <div class="receipt-container">
            <div class="header">
              ${logoHtml}
              <h1 class="logo-title">${libraryTitle}</h1>
              <div class="sub-title">Official Fee Payment Receipt</div>
              <div class="tagline">${libraryAddress}</div>
              ${libraryPhone ? `<div class="contact-tag">Contact: <strong>${libraryPhone}</strong> ${libraryInfo.email ? `• ${libraryInfo.email}` : ''}</div>` : ''}
            </div>

            <div class="meta-grid">
              <div class="meta-item">
                <div class="meta-label">Receipt Number</div>
                <div class="meta-val" style="font-family: monospace; color: #4338ca;">${receiptNo}</div>
              </div>
              <div class="meta-item" style="text-align: right;">
                <div class="meta-label">Payment Date</div>
                <div class="meta-val">${formatDate(fee.paidDate)}</div>
              </div>
              <div class="meta-item">
                <div class="meta-label">Student Name</div>
                <div class="meta-val">${student?.name || '—'}</div>
              </div>
              <div class="meta-item" style="text-align: right;">
                <div class="meta-label">Contact Number</div>
                <div class="meta-val">${student?.phone || '—'}</div>
              </div>
              <div class="meta-item">
                <div class="meta-label">Section & Seat</div>
                <div class="meta-val">${section?.name || 'Main Hall'} • Seat #${student?.seatId?.split('_seat_')?.pop() || '—'}</div>
              </div>
              <div class="meta-item" style="text-align: right;">
                <div class="meta-label">Membership Validity</div>
                <div class="meta-val" style="color: #166534;">${validityText}</div>
              </div>
            </div>

            <table class="table-wrap">
              <thead>
                <tr>
                  <th>Description</th>
                  <th style="text-align: right;">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>${libraryTitle} - ${planTitle}</td>
                  <td style="text-align: right; font-weight: 600;">${formatCurrency(fee.baseFee || fee.amount)}</td>
                </tr>
                ${
                  fee.addonCharges
                    ? Object.entries(fee.addonCharges)
                        .map(
                          ([name, amt]) => `
                        <tr>
                          <td>${name} Facility & Locker Add-on</td>
                          <td style="text-align: right; font-weight: 600;">${formatCurrency(amt)}</td>
                        </tr>`
                        )
                        .join('')
                    : ''
                }
                ${
                  fee.discountAmount > 0
                    ? `
                        <tr style="color: #166534;">
                          <td>Special Discount / Concession</td>
                          <td style="text-align: right; font-weight: 600;">- ${formatCurrency(fee.discountAmount)}</td>
                        </tr>`
                    : ''
                }
                <tr class="total-row">
                  <td>TOTAL AMOUNT RECEIVED</td>
                  <td style="text-align: right;">${formatCurrency(fee.amount)}</td>
                </tr>
              </tbody>
            </table>

            <div class="footer-notes">
              <div style="font-size: 11px; color: #64748b;">
                <p style="margin: 0 0 4px 0;"><strong>Payment Mode:</strong> <span style="text-transform: uppercase; color: #4338ca; font-weight: 800;">${fee.paymentMode || 'CASH'}</span></p>
                <p style="margin: 0 0 4px 0;"><strong>Status:</strong> <span class="paid-badge">✓ PAYMENT VERIFIED & RECEIVED</span></p>
                <p style="margin: 0; color: #94a3b8; font-size: 10px;">Computer-generated official receipt issued by ${libraryTitle}.</p>
              </div>
              <div>
                <div class="sign-box">
                  ${signHtml}
                  Authorized Signatory<br/>
                  <span style="font-size: 10px; color: #4338ca; font-weight: 700;">${libraryOwner}</span>
                </div>
              </div>
            </div>
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 400);
  };

  const handleSendWhatsAppReceipt = () => {
    const cleanPhone = (student?.phone || '').replace(/\D/g, '');
    const phoneWithCountry = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

    const message = `🎉 *FEE PAYMENT RECEIPT - ${libraryTitle.toUpperCase()}*\n\n` +
      `👤 *Student Name:* ${student?.name || 'Student'}\n` +
      `🧾 *Receipt No:* ${receiptNo}\n` +
      `📦 *Plan:* ${planTitle}\n` +
      `📅 *Validity Period:* ${validityText}\n` +
      `💵 *Amount Paid:* ₹${fee.amount}\n` +
      (fee.discountAmount > 0 ? `🏷️ *Discount Given:* ₹${fee.discountAmount}\n` : '') +
      `💳 *Payment Mode:* ${(fee.paymentMode || 'CASH').toUpperCase()}\n` +
      `📍 *Seat Allocated:* Seat #${student?.seatId?.split('_seat_')?.pop() || '—'} (${student?.shiftTiming || 'Shift'})\n` +
      `🗓️ *Date:* ${formatDate(fee.paidDate)}\n` +
      `🏢 *Address:* ${libraryAddress}\n` +
      `📞 *Helpdesk:* ${libraryPhone}\n\n` +
      `✅ *Status:* PAID & CONFIRMED\n\n` +
      `Thank you for studying at ${libraryTitle}! 🙏`;

    const waUrl = `https://api.whatsapp.com/send?phone=${phoneWithCountry}&text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Official Fee Bill & Receipt" size="lg">
      <div className="space-y-5">
        {/* Receipt Container Preview */}
        <div id="printable-fee-receipt" className="p-6 bg-white rounded-2xl border-2 border-slate-200 shadow-sm space-y-4">
          {/* Header */}
          <div className="text-center border-b border-slate-200 pb-4">
            {libraryLogo ? (
              <div className="flex justify-center mb-2">
                <img
                  src={libraryLogo}
                  alt="Library Logo"
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
              Official Fee Payment Bill
            </p>
            <p className="text-xs text-slate-600 mt-1 font-medium">{libraryAddress}</p>
            {libraryPhone && (
              <p className="text-[11px] text-slate-400">Phone: {libraryPhone} {libraryInfo.email ? `• ${libraryInfo.email}` : ''}</p>
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
              <p className="text-[11px] text-slate-500">Seat #{student?.seatId?.split('_seat_')?.pop() || '—'} • {student?.shiftTiming || 'Shift'}</p>
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
                    className="max-h-12 max-w-28 object-contain mx-auto"
                  />
                  <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5 border-t border-slate-300 pt-0.5">
                    Authorized Signatory
                  </p>
                  <p className="text-[11px] font-bold text-indigo-700">{libraryOwner}</p>
                </div>
              ) : (
                <div className="text-slate-400 text-center">
                  <p className="text-[10px] uppercase font-bold border-t border-slate-300 pt-1">Authorized Signatory</p>
                  <p className="text-[11px] font-bold text-slate-700">{libraryOwner}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSendWhatsAppReceipt}
              className="px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
              title="Share receipt bill on WhatsApp"
            >
              <MessageSquare className="w-4 h-4" />
              <span>WhatsApp Receipt</span>
            </button>

            <button
              onClick={handlePrintOrSavePDF}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
              title="Print or Save as PDF"
            >
              <Download className="w-4 h-4" />
              <span>📄 Save PDF / Print</span>
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
