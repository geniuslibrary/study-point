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
    meterNumber: 'MTR-1082',
    prevReading: '',
    currReading: '',
    ratePerUnit: '9',
    unitsConsumed: 0,
    fixedCharges: '250',
    directBillAmount: '',
    isAutoCalculate: true,
  });

  // Staff Salary specific calculator fields
  const [salaryData, setSalaryData] = useState({
    staffName: 'Ramesh Kumar (Caretaker)',
    role: 'Caretaker & Front Desk',
    baseSalary: '8000',
    daysInMonth: '30',
    daysWorked: '30',
    bonus: '0',
    deductions: '0',
    netSalary: 8000,
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
        amount: editData.amount || '',
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
            amount: total,
            category: 'Electricity',
            description: `Electricity Bill (${units} units @ ₹${rate}/unit + ₹${fixed} fixed charges)`,
          }));
        }
      } else if (meterData.directBillAmount) {
        setFormData((prevD) => ({
          ...prevD,
          amount: Number(meterData.directBillAmount),
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
      setFormData((prevD) => ({
        ...prevD,
        amount: finalNet,
        category: 'Staff Salary',
        description: `Salary for ${salaryData.staffName} (${salaryData.role}) [${daysWorked}/${daysTotal} days + Bonus ₹${bonus} - Deduct ₹${deductions}]`,
      }));
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
      [name]: name === 'amount' ? (value === '' ? '' : Number(value)) : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      amount: Number(formData.amount),
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
              <span>⚡ Light Bill</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setFormMode('salary');
                setFormData((prev) => ({ ...prev, category: 'Staff Salary' }));
              }}
              className={`py-2 px-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                formMode === 'salary'
                  ? 'bg-indigo-600 text-white shadow-xs'
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
                setFormData((prev) => ({ ...prev, category: 'Maintenance / Repairs' }));
              }}
              className={`py-2 px-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                formMode === 'additional'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>🛠️ Additional</span>
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* ================================================================= */}
          {/* ELECTRICITY BILL CALCULATOR VIEW                                  */}
          {/* ================================================================= */}
          {formMode === 'electricity' && (
            <div className="bg-amber-50/70 border border-amber-200 p-4 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-amber-600" />
                  Monthly Electricity Bill Calculator (बिजली बिल)
                </h4>
                <label className="flex items-center gap-1.5 text-xs text-amber-900 cursor-pointer font-medium">
                  <input
                    type="checkbox"
                    checked={meterData.isAutoCalculate}
                    onChange={(e) =>
                      setMeterData((prev) => ({ ...prev, isAutoCalculate: e.target.checked }))
                    }
                    className="rounded border-amber-300 text-amber-600"
                  />
                  <span>Meter Reading Mode</span>
                </label>
              </div>

              {meterData.isAutoCalculate ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">
                      Prev Reading (Units)
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 12400"
                      value={meterData.prevReading}
                      onChange={(e) =>
                        setMeterData((prev) => ({ ...prev, prevReading: e.target.value }))
                      }
                      className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded-lg text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">
                      Current Reading
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 12950"
                      value={meterData.currReading}
                      onChange={(e) =>
                        setMeterData((prev) => ({ ...prev, currReading: e.target.value }))
                      }
                      className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded-lg text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">
                      Rate / Unit (₹)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      value={meterData.ratePerUnit}
                      onChange={(e) =>
                        setMeterData((prev) => ({ ...prev, ratePerUnit: e.target.value }))
                      }
                      className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded-lg text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">
                      Fixed/Surcharge (₹)
                    </label>
                    <input
                      type="number"
                      value={meterData.fixedCharges}
                      onChange={(e) =>
                        setMeterData((prev) => ({ ...prev, fixedCharges: e.target.value }))
                      }
                      className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Direct Bill Invoice Amount (₹)
                  </label>
                  <input
                    type="number"
                    placeholder="Enter total bill amount as per EB invoice"
                    value={meterData.directBillAmount}
                    onChange={(e) =>
                      setMeterData((prev) => ({ ...prev, directBillAmount: e.target.value }))
                    }
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm"
                  />
                </div>
              )}

              {meterData.isAutoCalculate && meterData.unitsConsumed > 0 && (
                <div className="bg-white p-2.5 rounded-lg border border-amber-200 text-xs flex items-center justify-between text-amber-900">
                  <span>
                    ⚡ Consumption: <strong>{meterData.unitsConsumed} Units</strong> (@ ₹
                    {meterData.ratePerUnit}/unit)
                  </span>
                  <span className="font-bold text-amber-700">
                    Calculated: {formatCurrency(formData.amount)}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* ================================================================= */}
          {/* STAFF SALARY CALCULATOR VIEW                                      */}
          {/* ================================================================= */}
          {formMode === 'salary' && (
            <div className="bg-indigo-50/70 border border-indigo-200 p-4 rounded-xl space-y-3">
              <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-4 h-4 text-indigo-600" />
                Monthly Staff Salary Calculator (स्टाफ सैलरी)
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">Staff Name *</label>
                  <input
                    type="text"
                    required
                    value={salaryData.staffName}
                    onChange={(e) => setSalaryData((prev) => ({ ...prev, staffName: e.target.value }))}
                    className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-sm"
                    placeholder="e.g. Ramesh Kumar"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">Designation / Role</label>
                  <select
                    value={salaryData.role}
                    onChange={(e) => setSalaryData((prev) => ({ ...prev, role: e.target.value }))}
                    className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="Caretaker & Front Desk">Caretaker & Front Desk</option>
                    <option value="Night Shift Guard">Night Shift Guard</option>
                    <option value="Housekeeping & Cleaning Staff">Housekeeping & Cleaning Staff</option>
                    <option value="Library Assistant">Library Assistant</option>
                    <option value="Manager / Operator">Manager / Operator</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">
                    Monthly Base (₹)
                  </label>
                  <input
                    type="number"
                    value={salaryData.baseSalary}
                    onChange={(e) => setSalaryData((prev) => ({ ...prev, baseSalary: e.target.value }))}
                    className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded-lg text-sm"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">Days Worked</label>
                  <input
                    type="number"
                    max="31"
                    value={salaryData.daysWorked}
                    onChange={(e) => setSalaryData((prev) => ({ ...prev, daysWorked: e.target.value }))}
                    className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded-lg text-sm"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">Bonus/OT (₹)</label>
                  <input
                    type="number"
                    value={salaryData.bonus}
                    onChange={(e) => setSalaryData((prev) => ({ ...prev, bonus: e.target.value }))}
                    className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded-lg text-sm"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">Deductions (₹)</label>
                  <input
                    type="number"
                    value={salaryData.deductions}
                    onChange={(e) =>
                      setSalaryData((prev) => ({ ...prev, deductions: e.target.value }))
                    }
                    className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div className="bg-white p-2.5 rounded-lg border border-indigo-200 text-xs flex items-center justify-between text-indigo-900">
                <span>
                  💼 Net Payable Salary: <strong>{salaryData.staffName}</strong>
                </span>
                <span className="font-bold text-base text-indigo-700">
                  {formatCurrency(salaryData.netSalary)}
                </span>
              </div>
            </div>
          )}

          {/* Standard Fields (Category, Amount, Date, Description) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Category *
              </label>
              <select
                name="category"
                required
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

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Final Amount (₹) *
              </label>
              <input
                type="number"
                name="amount"
                min="0"
                required
                placeholder="0"
                value={formData.amount}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-bold text-gray-900 focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Expense / Payment Date *
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

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Description / Memo Details
            </label>
            <textarea
              name="description"
              rows={2}
              value={formData.description}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500"
              placeholder="e.g. Electricity bill with meter units, staff salary, AC repair service, RO filter..."
            />
          </div>

          <div className="mt-5 flex justify-end gap-3 pt-3 border-t border-gray-100">
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
