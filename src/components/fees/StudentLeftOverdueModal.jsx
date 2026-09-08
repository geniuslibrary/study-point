import React from 'react';
import Modal from '../common/Modal';
import { UserX, RotateCcw, ShieldCheck, Armchair, Phone, IndianRupee, AlertCircle } from 'lucide-react';
import { formatCurrency } from '../../utils/helpers';

export default function StudentLeftOverdueModal({
  isOpen,
  onClose,
  target,
  onConfirmLeft,
  onRenew,
  loading = false,
}) {
  if (!target || !isOpen) return null;

  const { student, fee, seat } = target;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <div className="space-y-4 pt-1">
        {/* Top Header Badge */}
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200/80 flex items-center justify-center text-rose-600 shrink-0 shadow-2xs">
            <UserX className="w-6 h-6" />
          </div>
          <div>
            <span className="inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-wider text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md mb-1 border border-rose-100">
              <AlertCircle className="w-3 h-3" /> Overdue Action
            </span>
            <h3 className="text-lg font-extrabold text-slate-900 leading-tight">
              Kya student library chhod raha hai?
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Renew karke aage badhana hai ya Left mark karke seat free karni hai?
            </p>
          </div>
        </div>

        {/* Student Summary Card */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 font-extrabold text-xs flex items-center justify-center">
                {student?.name?.charAt(0)?.toUpperCase() || '?'}
              </div>
              <div>
                <p className="font-extrabold text-slate-900 text-sm">{student?.name || 'Unknown'}</p>
                <p className="text-[11px] text-slate-500 flex items-center gap-1">
                  <Phone className="w-3 h-3 text-slate-400" /> {student?.phone || '—'}
                </p>
              </div>
            </div>

            <div className="text-right">
              {seat?.seatNumber ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-black">
                  <Armchair className="w-3 h-3" /> #{seat.seatNumber}
                </span>
              ) : (
                <span className="text-xs text-slate-400 font-medium">No seat</span>
              )}
            </div>
          </div>

          {fee?.amount && (
            <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-semibold">Overdue Dues Amount:</span>
              <span className="font-black text-rose-600">{formatCurrency(fee.amount)}</span>
            </div>
          )}
        </div>

        {/* Data Safety Assurance Box */}
        <div className="bg-emerald-50/80 border border-emerald-200/90 rounded-2xl p-3 flex items-start gap-2.5">
          <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="text-xs text-emerald-900 leading-relaxed">
            <strong className="font-black block text-emerald-950">Student Data Safe Rahega:</strong>
            Student ka sara data (Profile, Fees history, Attendance) software mein hamesha safe rahega (kabhi delete nahi hoga). Sirf unki seat free ho jayegi taaki aap naye student ko allot kar sakein.
          </div>
        </div>

        {/* Decision Buttons */}
        <div className="pt-2 space-y-2.5">
          {/* Option 1: Renew / Pay Fee */}
          <button
            type="button"
            onClick={onRenew}
            disabled={loading}
            className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Renew Karein (Membership Aage Badhayein)</span>
          </button>

          {/* Option 2: Left & Free Seat */}
          <button
            type="button"
            onClick={onConfirmLeft}
            disabled={loading}
            className="w-full py-3 px-4 bg-rose-600 hover:bg-rose-700 active:scale-[0.99] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center justify-center gap-2"
          >
            <UserX className="w-4 h-4" />
            <span>{loading ? 'Processing...' : 'Left Chhod Diya (Seat Free Karein)'}</span>
          </button>

          {/* Option 3: Cancel */}
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="w-full py-2 px-4 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-bold transition-colors cursor-pointer text-center"
          >
            Cancel / Wapas Jaayein
          </button>
        </div>
      </div>
    </Modal>
  );
}