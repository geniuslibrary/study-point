import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { EXPENSE_CATEGORIES } from '../../utils/constants';
import { Zap, Users, Receipt, Wrench, Calculator, Sparkles } from 'lucide-react';
import { formatCurrency } from '../../utils/helpers';

export default function ExpenseForm({ isOpen, onClose, onSubmit, editData }) {
  // Form Mode: 'general' | 'electricity' | 'salary' | 'additional'
  const [formMode, setFormMode] = useState('general');

  // General fields
  const [formData, setFormData] = useState({
    category: 'Electricity',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
    expenseType: 'general',
  });

  // Electricity specific calculator fields
  const [meterData, setMeterData] = useState({
    meterNumber: '',
    prevReading: '',
    currReading: '',
    ratePerUnit: '9',
    unitsConsumed: 0,
    fixedCharges: '',
    directBillAmount: '',
    isAutoCalculate: true,
  });

  // Staff Salary specific calculator fields
  const [salaryData, setSalaryData] = useState({
    staffName: '',
    role: '',
    baseSalary: '',
    daysInMonth: '30',
    daysWorked: '30',
    bonus: '',
    deductions: '',
    netSalary: 0,
    paymentMode: 'upi',
  });

  useEffect(() => {
    if (editData) {
      const dStr = editData.date instanceof Date
        ? editData.date.toISOString().split('T')[0]
        : editData.date?.seconds
          ? new Date(editData.date.seconds * 1000).toISOString().split('T')[0]
          : editData.date || new Date().toISOString().split('T')[0];

      setFormData({
        ...editData,
        amount: editData.amount !== undefined && editData.amount !== null ? String(editData.amount) : '',
        date: dStr,
        category: editData.category || 'Electricity',
        description: editData.description || '',
        expenseType: editData.expenseType || 'general',
      });

      if (editData.category === 'Electricity') setFormMode('electricity');
      else if (editData.category === 'Staff Salary') setFormMode('salary');
      else if (editData.expenseType === 'additional') setFormMode('additional');
      else setFormMode('general');
    } else {
      setFormData({
        category: 'Electricity',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        description: '',
        expenseType: 'general',
      });
      setMeterData({
        meterNumber: '',
        prevReading: '',
        currReading: '',
        ratePerUnit: '9',
        unitsConsumed: 0,
        fixedCharges: '',
        directBillAmount: '',
        isAutoCalculate: true,
      });
      setSalaryData({
        staffName: '',
        role: '',
        baseSalary: '',
        daysInMonth: '30',
        daysWorked: '30',
        bonus: '',
        deductions: '',
        netSalary: 0,
        paymentMode: 'upi',
      });
      setFormMode('general');
    }
  }, [editData, isOpen]);

  // Recalculate Electricity Amount
  useEffect(() => {
    if (formMode === 'electricity') {
      if (meterData.isAutoCalculate) {
        const prev = Number(meterData.prevReading) || 0;
        const curr = Number(meterData.currReading) || 0;
        const units = Math.max(0, curr - prev);
        const rate = Number(meterData.ratePerUnit) || 0;
        const fixed = Number(meterData.fixedCharges) || 0;
        const total = units > 0 ? units * rate + fixed : (Number(meterData.directBillAmount) || 0);

        setMeterData((prevD) => ({ ...prevD, unitsConsumed: units }));
        if (total > 0) {
          setFormData((prevD) => ({
            ...prevD,
            amount: String(total),
            category: 'Electricity',
            description: `Electricity Bill (${units} units @ ₹${rate}/unit + ₹${fixed} fixed charges)`,
          }));
        }
      } else if (meterData.directBillAmount) {
        setFormData((prevD) => ({
          ...prevD,
          amount: String(meterData.directBillAmount),
          category: 'Electricity',
          description: `Electricity Monthly Bill (Direct Invoice)`,
        }));
      }
    }
  }, [
    formMode,
    meterData.prevReading,
    meterData.currReading,
    meterData.ratePerUnit,
    meterData.fixedCharges,
    meterData.directBillAmount,
    meterData.isAutoCalculate,
  ]);

  // Recalculate Staff Salary
  useEffect(() => {
    if (formMode === 'salary') {
      const base = Number(salaryData.baseSalary) || 0;
      const daysTotal = Number(salaryData.daysInMonth) || 30;
      const daysWorked = Number(salaryData.daysWorked) || 30;
      const bonus = Number(salaryData.bonus) || 0;
      const deductions = Number(salaryData.deductions) || 0;

      const perDay = daysTotal > 0 ? base / daysTotal : 0;
      const earned = Math.round(perDay * daysWorked) + bonus - deductions;
      const finalNet = Math.max(0, earned);

      setSalaryData((prevD) => ({ ...prevD, netSalary: finalNet }));
      if (base > 0) {
        setFormData((prevD) => ({
          ...prevD,
          amount: String(finalNet),
          category: 'Staff Salary',
          description: `Salary for ${salaryData.staffName || 'Staff'} (${salaryData.role || 'Role'}) [${daysWorked}/${daysTotal} days + Bonus ₹${bonus} - Deduct ₹${deductions}]`,
        }));
      }
    }
  }, [
    formMode,
    salaryData.baseSalary,
    salaryData.daysInMonth,
    salaryData.daysWorked,
    salaryData.bonus,
    salaryData.deductions,
    salaryData.staffName,
    salaryData.role,
  ]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const finalAmount = formData.amount === '' ? 0 : Number(formData.amount) || 0;
    onSubmit({
      ...formData,
      amount: finalAmount,
      date: new Date(formData.date).toISOString(),
      expenseType: formMode,
      meterDetails: formMode === 'electricity' ? meterData : null,
      salaryDetails: formMode === 'salary' ? salaryData : null,
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editData ? 'Edit Expense Record' : 'Record Study Point Expense'}
      size="lg"
    >
      <div className="space-y-4">
        {/* Expense Mode Switcher */}
        {!editData && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-gray-100 p-1.5 rounded-xl text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setFormMode('general');
                setFormData((prev) => ({ ...prev, category: 'Rent' }));
              }}
              className={`py-2 px-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                formMode === 'general'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>Standard</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setFormMode('electricity');
                setFormData((prev) => ({ ...prev, category: 'Electricity' }));
              }}
              className={`py-2 px-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                formMode === 'electricity'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>⚡ Electricity</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setFormMode('salary');
                setFormData((prev) => ({ ...prev, category: 'Staff Salary' }));
              }}
              className={`py-2 px-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                formMode === 'salary'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>👥 Staff Salary</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setFormMode('additional');
                setFormData((prev) => ({ ...prev, category: 'Maintenance' }));
              }}
              className={`py-2 px-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                formMode === 'additional'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>🛠️ Repair/Other</span>
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Mode 1: ELECTRICITY METER CALCULATOR */}
          {formMode === 'electricity' && (
            <div className="bg-amber-50/70 border border-amber-200 p-4 rounded-xl space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-600" />
                  <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                    Electricity Meter Unit Billing Calculator
                  </h4>
                </div>
                <label className="flex items-center gap-1.5 text-xs text-amber-900 font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={meterData.isAutoCalculate}
                    onChange={(e) =>
                      setMeterData((prev) => ({ ...prev, isAutoCalculate: e.target.checked }))
                    }
                    className="rounded text-amber-600 focus:ring-amber-500"
                  />
                  <span>Calculate by Units</span>
                </label>
              </div>

              {meterData.isAutoCalculate ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">
                      Meter No.
                    </label>
                    <input
                      type="text"
                      value={meterData.meterNumber}
                      onChange={(e) =>
                        setMeterData((prev) => ({ ...prev, meterNumber: e.target.value }))
                      }
                      placeholder="e.g. MTR-1082"
                      className="w-full px-2.5 py-1.5 bg-white border border-amber-200 rounded-lg text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">
                      Prev Reading
                    </label>
                    <input
                      type="number"
                      value={meterData.prevReading}
                      onChange={(e) =>
                        setMeterData((prev) => ({ ...prev, prevReading: e.target.value }))
                      }
                      placeholder="e.g. 1420"
                      className="w-full px-2.5 py-1.5 bg-white border border-amber-200 rounded-lg text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">
                      Current Reading
                    </label>
                    <input
                      type="number"
                      value={meterData.currReading}
                      onChange={(e) =>
                        setMeterData((prev) => ({ ...prev, currReading: e.target.value }))
                      }
                      placeholder="e.g. 1780"
                      className="w-full px-2.5 py-1.5 bg-white border border-amber-200 rounded-lg text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">
                      Rate/Unit (₹)
                    </label>
                    <input
                      type="number"
                      value={meterData.ratePerUnit}
                      onChange={(e) =>
                        setMeterData((prev) => ({ ...prev, ratePerUnit: e.target.value }))
                      }
                      placeholder="9"
                      className="w-full px-2.5 py-1.5 bg-white border border-amber-200 rounded-lg text-xs font-semibold"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Direct Invoice Bill Amount (₹)
                  </label>
                  <input
                    type="number"
                    value={meterData.directBillAmount}
                    onChange={(e) =>
                      setMeterData((prev) => ({ ...prev, directBillAmount: e.target.value }))
                    }
                    placeholder="e.g. 4500"
                    className="w-full px-3 py-2 bg-white border border-amber-200 rounded-lg text-sm font-bold text-gray-900"
                  />
                </div>
              )}

              {meterData.isAutoCalculate && meterData.unitsConsumed > 0 && (
                <div className="flex items-center justify-between text-xs bg-white/80 p-2 rounded-lg border border-amber-200/60 font-semibold text-amber-950">
                  <span>
                    Consumed: <strong>{meterData.unitsConsumed} Units</strong> (@ ₹
                    {meterData.ratePerUnit}/unit)
                  </span>
                  <span className="text-amber-800 font-extrabold text-sm">
                    Total: {formatCurrency(formData.amount || 0)}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Mode 2: STAFF SALARY CALCULATOR */}
          {formMode === 'salary' && (
            <div className="bg-blue-50/70 border border-blue-200 p-4 rounded-xl space-y-3.5">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wider">
                  Staff Salary & Attendance Calculator
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">
                    Staff Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={salaryData.staffName}
                    onChange={(e) =>
                      setSalaryData((prev) => ({ ...prev, staffName: e.target.value }))
                    }
                    placeholder="e.g. Ramesh Kumar"
                    className="w-full px-2.5 py-1.5 bg-white border border-blue-200 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">
                    Role / Designation
                  </label>
                  <input
                    type="text"
                    value={salaryData.role}
                    onChange={(e) => setSalaryData((prev) => ({ ...prev, role: e.target.value }))}
                    placeholder="e.g. Caretaker, Receptionist"
                    className="w-full px-2.5 py-1.5 bg-white border border-blue-200 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">
                    Monthly Base (₹)
                  </label>
                  <input
                    type="number"
                    value={salaryData.baseSalary}
                    onChange={(e) =>
                      setSalaryData((prev) => ({ ...prev, baseSalary: e.target.value }))
                    }
                    placeholder="e.g. 8000"
                    className="w-full px-2.5 py-1.5 bg-white border border-blue-200 rounded-lg text-xs font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">
                    Days Worked
                  </label>
                  <input
                    type="number"
                    value={salaryData.daysWorked}
                    onChange={(e) =>
                      setSalaryData((prev) => ({ ...prev, daysWorked: e.target.value }))
                    }
                    placeholder="30"
                    className="w-full px-2.5 py-1.5 bg-white border border-blue-200 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">
                    Bonus / Incentive (₹)
                  </label>
                  <input
                    type="number"
                    value={salaryData.bonus}
                    onChange={(e) =>
                      setSalaryData((prev) => ({ ...prev, bonus: e.target.value }))
                    }
                    placeholder="0"
                    className="w-full px-2.5 py-1.5 bg-white border border-blue-200 rounded-lg text-xs text-green-700"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">
                    Deduction (₹)
                  </label>
                  <input
                    type="number"
                    value={salaryData.deductions}
                    onChange={(e) =>
                      setSalaryData((prev) => ({ ...prev, deductions: e.target.value }))
                    }
                    placeholder="0"
                    className="w-full px-2.5 py-1.5 bg-white border border-blue-200 rounded-lg text-xs text-red-700"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-xs bg-white/80 p-2.5 rounded-lg border border-blue-200/60 font-bold text-blue-950">
                <span>Calculated Net Payable Salary:</span>
                <span className="text-blue-700 text-sm font-black">
                  {formatCurrency(salaryData.netSalary || 0)}
                </span>
              </div>
            </div>
          )}

          {/* Standard Expense Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {formMode === 'general' || formMode === 'additional' ? (
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Expense Category *
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500"
                >
                  {EXPENSE_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}

            <div className={formMode === 'general' || formMode === 'additional' ? '' : 'sm:col-span-2'}>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Expense Date *
              </label>
              <input
                type="date"
                name="date"
                required
                value={formData.date}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Total Amount (₹) *
            </label>
            <input
              type="number"
              name="amount"
              min="0"
              required
              value={formData.amount}
              onChange={handleChange}
              placeholder="e.g. 500 or 1500"
              className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-base font-extrabold text-gray-900 focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Description / Notes
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="2"
              placeholder="e.g. Paid monthly rent / Purchased water bottles..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
            <Button variant="secondary" onClick={onClose} type="button">
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              {editData ? 'Update Expense' : 'Save Expense Record'}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
