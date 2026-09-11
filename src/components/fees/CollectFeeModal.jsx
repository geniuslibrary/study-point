import { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { formatCurrency, formatDate, formatDateInput, calculateSeatAddonCharges, getStoredAddons } from '../../utils/helpers';
import { Armchair, Clock, Tag, Calendar, Sparkles, CheckCircle2, ArrowRight, MessageSquare } from 'lucide-react';
import { getActiveTemplates, renderTemplate } from '../../utils/templateHelpers';
import { getActiveTenantId, getTenantItem } from '../../firebase/storageService';

export default function CollectFeeModal({
  isOpen,
  onClose,
  onSubmit,
  student,
  fee,
  plan,
  plans = [],
  seat,
  addonPricing = [],
}) {
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [isCustomDays, setIsCustomDays] = useState(false);
  const [customDays, setCustomDays] = useState('10');
  const [customFeeAmount, setCustomFeeAmount] = useState('400');
  const [discountAmount, setDiscountAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('cash');
  const [paymentType, setPaymentType] = useState('full'); // 'full' | 'partial'
  const [customPayingAmount, setCustomPayingAmount] = useState('');
  const [splitCash, setSplitCash] = useState('');
  const [splitUpi, setSplitUpi] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  // Validity Period State (Start Date & End Date)
  const [validityStart, setValidityStart] = useState('');
  const [validityEnd, setValidityEnd] = useState('');

  // Helper to calculate end date from start date and duration (days or months)
  const computeEndDate = (startDateStr, planObj) => {
    if (!startDateStr) return '';
    try {
      const cleanStr = String(startDateStr).split('T')[0];
      const [y, m, d] = cleanStr.split('-').map(Number);
      if (isNaN(y) || isNaN(m) || isNaN(d)) {
        throw new Error('Invalid date components');
      }
      const start = new Date(y, m - 1, d);
      
      const isDay = Boolean(
        planObj?.isDayBased ||
        planObj?.durationUnit === 'days' ||
        (planObj?.durationDays && !planObj?.durationMonths)
      );

      if (isDay) {
        const days = Number(planObj?.durationDays) || 10;
        const end = new Date(start);
        end.setDate(end.getDate() + days);
        return formatDateInput(end);
      }

      const durationMonths = Number(planObj?.durationMonths) || 1;
      const end = new Date(y, m - 1 + durationMonths, d);
      return formatDateInput(end);
    } catch (e) {
      const now = new Date();
      return formatDateInput(new Date(now.getFullYear(), now.getMonth() + 1, now.getDate()));
    }
  };

  useEffect(() => {
    if (student || fee) {
      const isFeeExtension = Boolean(
        fee?.isExtension ||
        fee?.planName?.toLowerCase().includes('extension') ||
        fee?.receiptNumber?.startsWith('EXT-') ||
        fee?.notes?.toLowerCase().includes('extended')
      );

      const isCustom = Boolean(
        student?.membershipPlanId === 'custom_days' ||
        student?.isCustomDays ||
        fee?.planId === 'custom_days' ||
        fee?.isCustomDays
      );

      const isDay = Boolean(
        isFeeExtension ||
        isCustom ||
        student?.isDayBased ||
        fee?.isDayBased ||
        student?.durationUnit === 'days' ||
        fee?.durationUnit === 'days'
      );

      const defaultDays = String(
        (isFeeExtension && fee?.durationDays) ? fee.durationDays :
        (student?.customDays || student?.durationDays || fee?.durationDays || '10')
      );
      const defaultFee = String(
        (isFeeExtension && (fee?.baseFee || fee?.amount)) ? (fee.baseFee || fee.amount) :
        (student?.customFeeAmount ||
        student?.planPrice ||
        (isDay && (!fee?.baseFee || Number(fee.baseFee) >= 800) ? '400' : fee?.baseFee) ||
        (isDay ? '400' : '800'))
      );

      setIsCustomDays(isCustom && !isFeeExtension);
      setCustomDays(defaultDays);
      setCustomFeeAmount(defaultFee);

      let currentPlanId = '';
      if (isFeeExtension) {
        currentPlanId = 'extension';
      } else if (isCustom) {
        currentPlanId = 'custom_days';
      } else {
        currentPlanId = fee?.planId || student?.membershipPlanId || (plans[0]?.id || '');
      }
      setSelectedPlanId(currentPlanId);

      const disc =
        fee && fee.discountAmount !== undefined && fee.discountAmount !== null && fee.discountAmount !== 0
          ? fee.discountAmount
          : student && student.discountAmount !== undefined && student.discountAmount !== null && student.discountAmount !== 0
          ? student.discountAmount
          : '';

      setDiscountAmount(disc !== '' ? String(disc) : '');
      setPaymentMode(fee?.paymentMode === 'split' ? 'split' : (fee?.paymentMode || 'cash'));
      setPaymentType('full');
      setCustomPayingAmount(fee?.dueAmount ? String(fee.dueAmount) : '');
      if (fee?.splitDetails) {
        setSplitCash(String(fee.splitDetails.cash || ''));
        setSplitUpi(String(fee.splitDetails.upi || ''));
      } else {
        setSplitCash('');
        setSplitUpi('');
      }
      setNotes(fee?.notes || '');

      // Build temp active plan to calculate correct initial end date
      let tempActivePlan;
      if (isFeeExtension) {
        tempActivePlan = {
          id: 'extension',
          name: fee?.planName || `Extension (+${defaultDays} Days)`,
          price: Number(defaultFee) || 0,
          durationDays: Number(defaultDays) || 10,
          durationUnit: 'days',
          isDayBased: true,
          isExtension: true,
        };
      } else if (isCustom || currentPlanId === 'custom_days') {
        tempActivePlan = {
          id: 'custom_days',
          name: `${defaultDays} Days Custom Plan`,
          price: Number(defaultFee) || 0,
          durationDays: Number(defaultDays) || 10,
          durationUnit: 'days',
          isDayBased: true,
        };
      } else {
        const found = plans.find((p) => p.id === currentPlanId) || plan;
        if (found) {
          const isPlanDay = found.durationUnit === 'days' || (found.durationDays && !found.durationMonths);
          tempActivePlan = {
            ...found,
            isDayBased: isPlanDay,
            durationDays: isPlanDay ? (Number(found.durationDays) || 7) : null,
            durationMonths: isPlanDay ? 1 : (Number(found.durationMonths) || 1),
          };
        } else if (student?.isDayBased || student?.customDays || isDay) {
          tempActivePlan = {
            id: student?.membershipPlanId || 'custom_days',
            name: student?.planName || `${student?.durationDays || 10} Days Plan`,
            price: Number(student?.planPrice) || Number(student?.customFeeAmount) || 400,
            durationDays: Number(student?.durationDays || student?.customDays) || 10,
            durationUnit: 'days',
            isDayBased: true,
          };
        } else {
          tempActivePlan = {
            name: 'Standard Monthly Plan',
            price: 800,
            durationMonths: 1,
            durationUnit: 'months',
            isDayBased: false,
          };
        }
      }

      // Check if modal opened to collect dues for an existing unpaid / partial fee
      const isDueOrPartialFee = Boolean(
        fee && (
          fee.status === 'partial' ||
          fee.status === 'pending' ||
          (fee.dueAmount !== undefined && Number(fee.dueAmount) > 0)
        )
      );

      let initStart = '';
      let initEnd = '';

      if (isDueOrPartialFee) {
        // CASE 1: Collecting remaining dues for an existing bill/cycle
        // Preserve the start date of this fee (e.g. 09/09/2026)
        initStart = formatDateInput(
          fee.periodStart || student?.membershipStart || student?.joinDate || new Date()
        );
        // Preserve the end date of this fee (e.g. 09/10/2026)
        initEnd = formatDateInput(
          fee.periodEnd || student?.membershipEnd || computeEndDate(initStart, tempActivePlan)
        );

        // Safety check: end date must be strictly after start date
        if (!initEnd || initEnd <= initStart) {
          initEnd = computeEndDate(initStart, tempActivePlan);
        }
      } else {
        // CASE 2: Renewal for upcoming cycle OR New Admission
        const prevEnd = student?.membershipEnd
          ? (student.membershipEnd.toDate ? student.membershipEnd.toDate() : new Date(student.membershipEnd))
          : null;
        const isFutureRenewal = Boolean(
          student?.hasPaidBefore &&
          prevEnd &&
          !isNaN(prevEnd.getTime()) &&
          prevEnd > new Date()
        );

        if (isFutureRenewal) {
          initStart = formatDateInput(prevEnd);
        } else if (student?.membershipStart && !student?.hasPaidBefore) {
          initStart = formatDateInput(student.membershipStart);
        } else if (student?.joinDate && !student?.hasPaidBefore) {
          initStart = formatDateInput(student.joinDate);
        } else {
          initStart = formatDateInput(new Date());
        }

        // Renewal / New Admission end date is ALWAYS computed by adding plan duration to initStart
        initEnd = computeEndDate(initStart, tempActivePlan);
      }

      setValidityStart(initStart);
      setValidityEnd(initEnd);
    }
  }, [student, fee, plans, isOpen]);

  const isFeeExtension = Boolean(
    fee?.isExtension ||
    fee?.planName?.toLowerCase().includes('extension') ||
    fee?.receiptNumber?.startsWith('EXT-') ||
    fee?.notes?.toLowerCase().includes('extended')
  );

  // Active Plan determination
  let activePlan;
  if (isFeeExtension && (selectedPlanId === 'extension' || selectedPlanId === fee?.planId)) {
    const extDays = Number(fee?.durationDays) || Number(customDays) || 10;
    const extFee = Number(fee?.baseFee !== undefined ? fee.baseFee : fee?.amount) || Number(customFeeAmount) || 0;
    activePlan = {
      id: 'extension',
      name: fee?.planName || `Extension (+${extDays} Days)`,
      price: extFee,
      durationDays: extDays,
      durationMonths: null,
      durationUnit: 'days',
      isDayBased: true,
      isExtension: true,
    };
  } else if (selectedPlanId === 'custom_days' || isCustomDays) {
    const cDays = Number(customDays) || 10;
    const cFee = Number(customFeeAmount) || 0;
    activePlan = {
      id: 'custom_days',
      name: `${cDays} Days Custom Plan`,
      price: cFee,
      durationDays: cDays,
      durationMonths: null,
      durationUnit: 'days',
      isDayBased: true,
    };
  } else {
    const foundPlan = plans.find((p) => p.id === selectedPlanId);
    if (foundPlan) {
      const isDay = foundPlan.durationUnit === 'days' || (foundPlan.durationDays && !foundPlan.durationMonths);
      activePlan = {
        ...foundPlan,
        isDayBased: isDay,
        durationDays: isDay ? (Number(foundPlan.durationDays) || 7) : null,
        durationMonths: isDay ? 1 : (Number(foundPlan.durationMonths) || 1),
      };
    } else if (student?.isDayBased || student?.customDays) {
      activePlan = {
        id: student.membershipPlanId || 'custom_days',
        name: student.planName || `${student.durationDays || 10} Days Plan`,
        price: Number(student.planPrice) || Number(student.customFeeAmount) || 400,
        durationDays: Number(student.durationDays || student.customDays) || 10,
        durationMonths: null,
        durationUnit: 'days',
        isDayBased: true,
      };
    } else {
      activePlan = plan || plans[0] || {
        id: 'standard_1m',
        name: 'Standard Monthly Plan',
        price: 800,
        durationMonths: 1,
        durationUnit: 'months',
        isDayBased: false,
      };
    }
  }

  const planPrice = Number(activePlan.price) || 0;
  const isDayPlan = Boolean(activePlan.isDayBased);
  const durationDays = activePlan.durationDays || 10;
  const durationMonths = activePlan.durationMonths || 1;
  const durationLabel = isDayPlan ? `${durationDays} Days (दिन)` : `${durationMonths} Month${durationMonths > 1 ? 's' : ''}`;

  // When plan changes, re-calculate validityEnd based on current validityStart
  const handlePlanChange = (newPlanId) => {
    setSelectedPlanId(newPlanId);
    if (newPlanId === 'extension') {
      setIsCustomDays(false);
      if (validityStart && fee?.periodEnd) {
        setValidityEnd(formatDateInput(fee.periodEnd));
      }
    } else if (newPlanId === 'custom_days') {
      setIsCustomDays(true);
      const cDays = Number(customDays) || 10;
      const cFee = Number(customFeeAmount) || 400;
      const customP = {
        id: 'custom_days',
        name: `${cDays} Days Custom Plan`,
        price: cFee,
        durationDays: cDays,
        isDayBased: true,
      };
      if (validityStart) {
        setValidityEnd(computeEndDate(validityStart, customP));
      }
    } else {
      setIsCustomDays(false);
      const newPlan = plans.find((p) => p.id === newPlanId);
      if (validityStart && newPlan) {
        setValidityEnd(computeEndDate(validityStart, newPlan));
      }
    }
  };

  const handleCustomDaysChange = (val) => {
    setCustomDays(val);
    const cDays = Number(val) || 10;
    const customP = {
      isDayBased: true,
      durationDays: cDays,
    };
    if (validityStart) {
      setValidityEnd(computeEndDate(validityStart, customP));
    }
  };

  const handleCustomFeeChange = (val) => {
    setCustomFeeAmount(val);
  };

  // When user edits validityStart, auto recalculate validityEnd
  const handleStartDateChange = (newStartDate) => {
    setValidityStart(newStartDate);
    if (newStartDate) {
      setValidityEnd(computeEndDate(newStartDate, activePlan));
    }
  };

  // Calculate Addon Charges dynamically (respecting plan included features)
  const planPerks = activePlan?.features || student?.planFeatures || student?.includedBenefits || [];
  const studentOrSeatAddons = { ...(seat?.addons || {}), ...(student?.addons || {}) };
  const addonDurationFactor = isDayPlan ? Math.max(1, Math.round(durationDays / 30)) : durationMonths;
  const { charges: addonCharges, total: addonTotal, includedCharges } = calculateSeatAddonCharges(
    studentOrSeatAddons,
    addonPricing && addonPricing.length > 0 ? addonPricing : getStoredAddons(),
    addonDurationFactor,
    planPerks
  );

  const discount = discountAmount === '' ? 0 : Number(discountAmount) || 0;

  // Determine if we are collecting dues for an existing partial/unpaid fee record
  const isExistingPartial = Boolean(
    fee &&
    fee.status === 'partial' &&
    Number(fee.paidAmount) > 0 &&
    Number(fee.dueAmount) > 0
  );

  const isExistingPending = Boolean(
    fee && (
      fee.status === 'pending' ||
      (Number(fee.amount) > 0 && (!fee.paidAmount || Number(fee.paidAmount) === 0))
    )
  );

  let previouslyPaid = 0;
  let totalBalanceDue = 0;
  let totalPayable = 0;

  if (isExistingPartial) {
    previouslyPaid = Number(fee.paidAmount) || 0;
    totalBalanceDue = Number(fee.dueAmount) > 0 ? Number(fee.dueAmount) : Math.max(0, (Number(fee.amount) || 0) - previouslyPaid);
    totalPayable = previouslyPaid + totalBalanceDue;
  } else if (isExistingPending) {
    previouslyPaid = 0;
    const isSamePlan = isFeeExtension
      ? (selectedPlanId === 'extension' || selectedPlanId === fee?.planId)
      : (selectedPlanId === fee?.planId);

    if (isSamePlan && Number(fee.amount) > 0) {
      totalPayable = Number(fee.amount);
    } else {
      totalPayable = Math.max(0, planPrice + addonTotal - discount);
    }
    totalBalanceDue = totalPayable;
  } else {
    previouslyPaid = 0;
    totalPayable = Math.max(0, planPrice + addonTotal - discount);
    totalBalanceDue = totalPayable;
  }

  const actualPaidNow = paymentType === 'full'
    ? totalBalanceDue
    : Math.min(totalBalanceDue, Math.max(0, Number(customPayingAmount) || 0));

  const newCumulativePaid = previouslyPaid + actualPaidNow;
  const remainingAfterPayment = Math.max(0, totalBalanceDue - actualPaidNow);

  const handleSplitCashChange = (val) => {
    setSplitCash(val);
    const cVal = Number(val) || 0;
    const remainingForUpi = Math.max(0, actualPaidNow - cVal);
    setSplitUpi(String(remainingForUpi));
  };

  const handleSplitUpiChange = (val) => {
    setSplitUpi(val);
    const uVal = Number(val) || 0;
    const remainingForCash = Math.max(0, actualPaidNow - uVal);
    setSplitCash(String(remainingForCash));
  };

  const handleSelectPaymentMode = (mode) => {
    setPaymentMode(mode);
    if (mode === 'split') {
      const half = Math.round(actualPaidNow / 2);
      setSplitCash(String(half));
      setSplitUpi(String(actualPaidNow - half));
    }
  };

  const handleSubmit = async (e, shareWhatsApp = false) => {
    if (e) e.preventDefault();
    if (actualPaidNow <= 0 && totalBalanceDue > 0) {
      alert('Kripya valid payment amount (₹1 ya usse zyada) darj karein.');
      return;
    }

    const isSplit = paymentMode === 'split';
    let finalSplitDetails = null;
    if (isSplit) {
      const cNum = Number(splitCash) || 0;
      const uNum = Number(splitUpi) || 0;
      if (cNum + uNum !== actualPaidNow) {
        alert(`Cash (₹${cNum}) aur UPI (₹${uNum}) ka jod ₹${actualPaidNow} ke barabar hona chahiye!`);
        return;
      }
      finalSplitDetails = { cash: cNum, upi: uNum };
    }

    setLoading(true);
    try {
      const startDateObj = validityStart ? new Date(validityStart) : new Date();
      let endDateObj;
      if (validityEnd) {
        endDateObj = new Date(validityEnd);
      } else {
        endDateObj = new Date(startDateObj);
        if (isDayPlan) {
          endDateObj.setDate(endDateObj.getDate() + durationDays);
        } else {
          endDateObj.setMonth(endDateObj.getMonth() + durationMonths);
        }
      }

      const isFullyPaid = remainingAfterPayment <= 0;
      const paymentStatus = isFullyPaid ? 'paid' : 'partial';

      await onSubmit({
        amount: totalPayable,
        baseFee: planPrice,
        discountAmount: discount,
        addonCharges,
        includedCharges,
        planFeatures: planPerks,
        paymentMode,
        splitDetails: finalSplitDetails,
        notes,
        planId: activePlan.id,
        planName: activePlan.name,
        planDuration: isDayPlan ? durationDays : durationMonths,
        durationUnit: isDayPlan ? 'days' : 'months',
        durationDays: isDayPlan ? durationDays : null,
        durationMonths: isDayPlan ? null : durationMonths,
        isDayBased: isDayPlan,
        isExtension: Boolean(fee?.isExtension || activePlan?.isExtension || isFeeExtension),
        periodStart: startDateObj.toISOString(),
        periodEnd: endDateObj.toISOString(),
        // Partial & Split properties
        paidNow: actualPaidNow,
        paidAmount: newCumulativePaid,
        dueAmount: remainingAfterPayment,
        status: paymentStatus,
        previouslyPaid,
      });

      if (shareWhatsApp) {
        const cleanPhone = (student?.phone || '').replace(/\D/g, '');
        const phoneWithCountry = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

        if (!phoneWithCountry || phoneWithCountry.length < 10) {
          alert('WhatsApp share ke liye student ka valid phone number hona chahiye!');
        } else {
          const libraryTitle = getTenantItem('library_name', 'Study Point Library');
          const validityText = (validityStart && validityEnd)
            ? `${formatDate(validityStart)} to ${formatDate(validityEnd)}`
            : (activePlan.durationMonths ? `${activePlan.durationMonths} Month(s)` : `${activePlan.durationDays || 10} Day(s)`);

          const receiptNo = `REC-${Date.now().toString().slice(-6)}`;
          const displaySeatNumber = seat?.seatNumber ? `#${seat.seatNumber}` : '—';

          let addonSummary = '';
          if (Object.keys(addonCharges).length > 0) {
            addonSummary = Object.entries(addonCharges)
              .map(([n, a]) => `🔒 *${n} Add-on:* ₹${a} (${durationLabel})\n`)
              .join('');
          }

          const tenantId = getActiveTenantId();
          const tenantParam = tenantId && tenantId !== 'genius_root' ? `?tenant=${tenantId}` : '';
          // Use student.id for receipt URL (fee.id is not available at this point)
          const receiptLookupId = fee?.id || student?.id || '';
          const onlineReceiptUrl = receiptLookupId
            ? `${window.location.origin}/receipt/${receiptLookupId}${tenantParam}`
            : '';

          const currentTemplates = getActiveTemplates();
          const payModeLabel = paymentMode === 'split'
            ? `SPLIT (Cash: ₹${splitCash || 0} + UPI: ₹${splitUpi || 0})`
            : (paymentMode || 'CASH').toUpperCase();

          const dueInfo = remainingAfterPayment > 0
            ? `\n⚠️ *Remaining Due Balance (बाकी बकाया):* ₹${remainingAfterPayment}`
            : `\n✅ *Status:* FULLY PAID (पूर्ण भुगतान)`;

          let message = renderTemplate(currentTemplates.feeReceipt?.template, {
            student_name: student?.name || 'Student',
            library_name: libraryTitle.toUpperCase(),
            amount: actualPaidNow,
            receipt_no: receiptNo,
            plan_name: activePlan.name,
            validity_period: validityText,
            seat_number: displaySeatNumber,
            shift: student?.shiftTiming || 'Full Day',
            payment_mode: payModeLabel,
          });

          // Fallback message if template is empty or not configured
          if (!message || message.trim().length < 10) {
            message = `🎓 *${libraryTitle.toUpperCase()}*\n\n✅ *Fee Payment Receipt — ${student?.name || 'Student'}*\n\n📋 *Plan:* ${activePlan.name}\n💰 *Amount Paid Today:* ₹${actualPaidNow}\n📊 *Total Plan Fee:* ₹${totalPayable}${dueInfo}\n🪑 *Seat:* ${displaySeatNumber}\n⏰ *Shift:* ${student?.shiftTiming || 'Full Day'}\n📅 *Validity:* ${validityText}\n💳 *Payment:* ${payModeLabel}\n🧾 *Receipt No:* ${receiptNo}`;
          }

          if (addonSummary) message += `\n${addonSummary}`;
          if (discount > 0) message += `\n🏷️ *Discount:* -₹${discount}`;
          if (remainingAfterPayment > 0) message += `\n⚠️ *Pending Due:* ₹${remainingAfterPayment} (Due soon)`;
          message += `\n\n📜 *Terms & Conditions:*\n1. Your seat is reserved for the subscribed period.\n2. The fee is non-refundable under any circumstances.\n3. The fee is non-transferrable.`;
          if (onlineReceiptUrl) {
            message += `\n\n📄 *View Receipt Online:*\n👉 ${onlineReceiptUrl}`;
          }
          message += `\n\nThank you for studying at ${libraryTitle}! 🙏`;

          const waUrl = `https://api.whatsapp.com/send?phone=${phoneWithCountry}&text=${encodeURIComponent(message)}`;
          window.open(waUrl, '_blank', 'noopener,noreferrer');
        }
      }

      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Collect Fee & Renew Membership" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Student & Seat Context Card */}
        {student && (
          <div className="bg-indigo-50/70 rounded-2xl p-4 border border-indigo-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {student.photo ? (
                <img
                  src={student.photo}
                  alt={student.name}
                  className="w-12 h-12 rounded-2xl object-cover border border-indigo-200 shrink-0 shadow-2xs"
                />
              ) : (
                <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white font-black text-lg flex items-center justify-center shrink-0 shadow-2xs">
                  {student.name?.charAt(0)?.toUpperCase()}
                </div>
              )}
              <div>
                <p className="font-extrabold text-slate-900 text-base leading-tight">{student.name}</p>
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 mt-1">
                  <span className="flex items-center gap-1 font-bold text-indigo-700">
                    <Armchair className="w-3.5 h-3.5" /> Seat #{seat?.seatNumber || '—'}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-slate-700 font-medium">
                    <Clock className="w-3.5 h-3.5 text-indigo-500" /> {student.shiftTiming || 'Full Day'}
                  </span>
                </div>
              </div>
            </div>

            <div className="text-left sm:text-right">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Admission / Joining Date</span>
              <span className="text-xs font-bold text-indigo-900">
                {student.joinDate ? formatDate(student.joinDate) : 'Today'}
              </span>
            </div>
          </div>
        )}

        {/* Membership Plan Selection & Discount */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Select Membership Plan (प्लान चुनें) *
            </label>
            <select
              value={selectedPlanId}
              onChange={(e) => handlePlanChange(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm font-semibold bg-white focus:ring-2 focus:ring-indigo-500"
            >
              {isFeeExtension && (
                <optgroup label="⚡ Extension Plan (एक्सटेंशन प्लान)">
                  <option value="extension">
                    ⚡ {fee?.planName || `Extension (+${fee?.durationDays || 10} Days)`} — ₹{fee?.baseFee || fee?.amount}
                  </option>
                </optgroup>
              )}
              <optgroup label="📋 Standard / Pre-configured Plans">
                {plans.map((p) => {
                  return (
                    <option key={p.id} value={p.id}>
                      {p.name} — ₹{p.price}
                    </option>
                  );
                })}
              </optgroup>
              <optgroup label="🗓️ Custom Days (कस्टम दिन)">
                <option value="custom_days">
                  🗓️ Custom Days (कस्टम दिन - जैसे 10 दिन, 15 दिन)
                </option>
              </optgroup>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1">
              <Tag className="w-3.5 h-3.5 text-emerald-600" />
              <span>Discount (छूट ₹)</span>
            </label>
            <input
              type="number"
              min="0"
              value={discountAmount}
              onChange={(e) => setDiscountAmount(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm font-bold text-emerald-700 bg-white focus:ring-2 focus:ring-emerald-500"
              placeholder="e.g. 100"
            />
          </div>
        </div>

        {/* If Custom Days is selected, show inputs for Days and Fee Amount */}
        {(selectedPlanId === 'custom_days' || isCustomDays) && (
          <div className="p-3.5 bg-amber-50/90 rounded-2xl border border-amber-200 grid grid-cols-1 sm:grid-cols-2 gap-3 animate-fadeIn">
            <div>
              <label className="block text-xs font-bold text-amber-900 mb-1">
                Number of Days (दिनों की संख्या) *
              </label>
              <input
                type="number"
                min="1"
                required
                value={customDays}
                onChange={(e) => handleCustomDaysChange(e.target.value)}
                placeholder="e.g. 10"
                className="w-full px-3 py-2 border border-amber-300 rounded-xl text-sm font-bold text-amber-950 bg-white focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-amber-900 mb-1">
                Fee Amount for {customDays || 0} Days (फीस ₹) *
              </label>
              <input
                type="number"
                min="0"
                required
                value={customFeeAmount}
                onChange={(e) => handleCustomFeeChange(e.target.value)}
                placeholder="e.g. 400"
                className="w-full px-3 py-2 border border-amber-300 rounded-xl text-sm font-bold text-amber-950 bg-white focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>
        )}

        {/* Membership Validity Period Configuration (Joining Date -> Valid Till) */}
        <div className="p-4 bg-emerald-50/80 rounded-2xl border border-emerald-200 text-xs text-emerald-950 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="font-bold flex items-center gap-1.5 text-emerald-900">
              <Calendar className="w-4 h-4 text-emerald-600" />
              <span>Membership Bill Validity Period ({durationLabel}):</span>
            </span>
            <span className="font-black bg-emerald-100 text-emerald-900 px-2.5 py-0.5 rounded-md text-[11px]">
              {validityStart && validityEnd ? `${formatDate(validityStart)} से ${formatDate(validityEnd)}` : ''}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-[11px] font-bold text-emerald-900 mb-1">
                Validity Start Date (शुरू दिनांक - Joining Date) *
              </label>
              <input
                type="date"
                required
                value={validityStart}
                onChange={(e) => handleStartDateChange(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-emerald-300 rounded-xl font-bold text-emerald-950 focus:ring-2 focus:ring-emerald-500 text-xs"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-emerald-900 mb-1">
                Validity End / Due Date (समाप्ति / अगली फीस दिनांक) *
              </label>
              <input
                type="date"
                required
                value={validityEnd}
                onChange={(e) => setValidityEnd(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-emerald-300 rounded-xl font-bold text-emerald-950 focus:ring-2 focus:ring-emerald-500 text-xs"
              />
            </div>
          </div>
        </div>

        {/* Itemized Breakdown Table */}
        <div className="space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
          <div className="flex justify-between">
            <span className="text-slate-600 font-medium">{activePlan.name} ({durationLabel})</span>
            <span className="font-bold text-slate-900">{formatCurrency(planPrice)}</span>
          </div>

          {planPerks.length > 0 && (
            <div className="flex items-center justify-between text-emerald-800 bg-emerald-50/70 p-2 rounded-xl border border-emerald-200">
              <span className="font-bold flex items-center gap-1.5 text-[11px] flex-wrap">
                <span>🎁 Plan Included (फ्री सुविधाएं):</span>
                <span className="font-extrabold bg-emerald-100 text-emerald-900 px-1.5 py-0.5 rounded border border-emerald-300">
                  {planPerks.join(', ')}
                </span>
              </span>
              <span className="font-extrabold text-emerald-700 text-xs shrink-0">₹0 (Free)</span>
            </div>
          )}

          {Object.entries(addonCharges).map(([name, charge]) => (
            <div key={name} className="flex justify-between">
              <span className="text-slate-600 font-medium">{name} Facility Add-on</span>
              <span className="font-bold text-slate-900">{formatCurrency(charge)}</span>
            </div>
          ))}

          {discount > 0 && (
            <div className="flex justify-between text-emerald-700 font-bold">
              <span>Special Discount Applied</span>
              <span>- {formatCurrency(discount)}</span>
            </div>
          )}

          <div className="border-t border-slate-200 pt-2 flex justify-between items-center text-sm font-black">
            <span className="text-slate-900">TOTAL PLAN FEE</span>
            <span className="text-lg text-indigo-700">{formatCurrency(totalPayable)}</span>
          </div>
        </div>

        {/* Partial / Installment Payment Selector */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="text-xs font-black text-slate-700 uppercase tracking-wider">
              Payment Type (भुगतान प्रकार)
            </span>
            <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
              <button
                type="button"
                onClick={() => {
                  setPaymentType('full');
                  if (paymentMode === 'split') {
                    const half = Math.round(totalBalanceDue / 2);
                    setSplitCash(String(half));
                    setSplitUpi(String(totalBalanceDue - half));
                  }
                }}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  paymentType === 'full'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                ● Full Payment (पूरा ₹{totalBalanceDue})
              </button>
              <button
                type="button"
                onClick={() => {
                  setPaymentType('partial');
                  if (!customPayingAmount || Number(customPayingAmount) <= 0) {
                    const suggested = Math.round(totalBalanceDue / 2) || totalBalanceDue;
                    setCustomPayingAmount(String(suggested));
                    if (paymentMode === 'split') {
                      const half = Math.round(suggested / 2);
                      setSplitCash(String(half));
                      setSplitUpi(String(suggested - half));
                    }
                  }
                }}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  paymentType === 'partial'
                    ? 'bg-amber-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                ● Partial / Installment (किस्त)
              </button>
            </div>
          </div>

          {previouslyPaid > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl px-3 py-2 text-xs flex justify-between items-center text-blue-900">
              <span className="font-medium">ℹ️ Previously Received (पहले जमा हो चुका):</span>
              <strong className="font-extrabold text-blue-800">{formatCurrency(previouslyPaid)}</strong>
            </div>
          )}

          {paymentType === 'partial' && (
            <div className="pt-2 border-t border-slate-200 space-y-1.5">
              <label className="block text-xs font-bold text-amber-900">
                Amount Paying Now (आज कितना जमा कर रहे हैं) *
              </label>
              <div className="relative max-w-xs">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-500">₹</span>
                <input
                  type="number"
                  min="1"
                  max={totalBalanceDue}
                  value={customPayingAmount}
                  onChange={(e) => {
                    const val = e.target.value;
                    setCustomPayingAmount(val);
                    const num = Number(val) || 0;
                    if (paymentMode === 'split') {
                      const half = Math.round(num / 2);
                      setSplitCash(String(half));
                      setSplitUpi(String(num - half));
                    }
                  }}
                  className="w-full pl-7 pr-3 py-2 border-2 border-amber-300 rounded-xl text-sm font-black text-amber-950 bg-white focus:ring-2 focus:ring-amber-500 outline-none"
                  placeholder={`Max ₹${totalBalanceDue}`}
                />
              </div>
            </div>
          )}

          {/* Live 3-Column Summary Bar */}
          <div className="grid grid-cols-3 gap-2 pt-1.5 border-t border-slate-200 text-center text-xs">
            <div className="bg-white p-2 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Total Plan Fee</span>
              <span className="font-black text-slate-800 text-sm">{formatCurrency(totalPayable)}</span>
            </div>
            <div className="bg-emerald-50 p-2 rounded-xl border border-emerald-200">
              <span className="text-[10px] text-emerald-600 font-bold uppercase block">Paying Now</span>
              <span className="font-black text-emerald-800 text-sm">{formatCurrency(actualPaidNow)}</span>
            </div>
            <div className={`p-2 rounded-xl border ${remainingAfterPayment > 0 ? 'bg-amber-50 border-amber-300 text-amber-900' : 'bg-slate-100 border-slate-200 text-slate-600'}`}>
              <span className="text-[10px] font-bold uppercase block">Remaining Due (बाकी)</span>
              <span className="font-black text-sm">{formatCurrency(remainingAfterPayment)}</span>
            </div>
          </div>
        </div>

        {/* Payment Mode Selector */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Payment Mode (भुगतान माध्यम) *
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: 'cash', label: '💵 Cash' },
              { id: 'upi', label: '📱 UPI / QR' },
              { id: 'bank', label: '🏦 Bank' },
              { id: 'split', label: '⚡ Split (Cash + UPI)' },
            ].map((m) => (
              <button
                type="button"
                key={m.id}
                onClick={() => handleSelectPaymentMode(m.id)}
                className={`py-2 px-2.5 rounded-xl border text-xs font-black transition-all cursor-pointer text-center ${
                  paymentMode === m.id
                    ? 'border-indigo-600 bg-indigo-600 text-white shadow-xs'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* Split Mode Inputs (Cash + UPI) */}
          {paymentMode === 'split' && (
            <div className="mt-3 p-3.5 bg-indigo-50/80 border border-indigo-200 rounded-2xl space-y-2.5">
              <div className="flex items-center justify-between text-xs font-black text-indigo-950">
                <span>⚡ Split Payment Breakdown</span>
                <span className="text-[11px] text-indigo-700 font-bold">
                  Cash + UPI = ₹{actualPaidNow}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    💵 Cash Portion (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={actualPaidNow}
                    value={splitCash}
                    onChange={(e) => handleSplitCashChange(e.target.value)}
                    className="w-full px-3 py-2 border border-indigo-300 rounded-xl text-xs font-bold bg-white text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Cash ₹"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    📱 UPI Portion (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={actualPaidNow}
                    value={splitUpi}
                    onChange={(e) => handleSplitUpiChange(e.target.value)}
                    className="w-full px-3 py-2 border border-indigo-300 rounded-xl text-xs font-bold bg-white text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="UPI ₹"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Remarks / Notes */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
            Payment Remarks / Transaction ID (Optional)
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs bg-white"
            placeholder="e.g. GPay Ref #123456 / ₹200 cash advance"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 flex-wrap">
          <Button variant="secondary" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button 
            type="button" 
            variant="outline" 
            loading={loading}
            onClick={(e) => handleSubmit(e, false)}
            className="border-indigo-200 text-indigo-700 hover:bg-indigo-50"
          >
            Collect ₹{actualPaidNow} Only
          </Button>
          <Button 
            type="button" 
            loading={loading}
            onClick={(e) => handleSubmit(e, true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <span className="flex items-center gap-1.5 font-bold">
              <MessageSquare className="w-4 h-4" />
              <span>Collect {formatCurrency(actualPaidNow)} & WhatsApp Bill</span>
            </span>
          </Button>
        </div>
      </form>
    </Modal>
  );
}
