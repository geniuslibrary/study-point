import React, { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import ExpenseForm from '../components/expenses/ExpenseForm';
import ExpenseList from '../components/expenses/ExpenseList';
import ExpenseSummary from '../components/expenses/ExpenseSummary';
import { Plus, Loader2, Zap, Users, Receipt, Calendar, IndianRupee, Sparkles, UserX, Edit2 } from 'lucide-react';
import { COLLECTIONS } from '../utils/constants';
import { getMonthName, formatCurrency, formatDate } from '../utils/helpers';
import {
  fetchCollectionData,
  createDocument,
  updateDocument,
  removeDocument,
} from '../firebase/storageService';

export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [revenue, setRevenue] = useState(0);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [editStaffSalary, setEditStaffSalary] = useState(null);
  const [tempSalaryInput, setTempSalaryInput] = useState('');
  const [editData, setEditData] = useState(null);
  const [deleteData, setDeleteData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Month filter: format YYYY-MM
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [expensesData, feesData, staffData] = await Promise.all([
        fetchCollectionData(COLLECTIONS.EXPENSES),
        fetchCollectionData(COLLECTIONS.FEES),
        fetchCollectionData(COLLECTIONS.STAFF_USERS),
      ]);

      setStaffList(staffData || []);

      // 1. Auto-Sync Recurring General Expenses
      let hasNewRecurring = false;
      const today = new Date().toISOString().split('T')[0];
      const activeRecurring = expensesData.filter((e) => e.isRecurring && e.nextDueDate && e.nextDueDate <= today);

      for (const exp of activeRecurring) {
        let currentNextDue = exp.nextDueDate;
        let currentOldId = exp.id;

        while (currentNextDue <= today) {
          const d = new Date(currentNextDue);
          d.setMonth(d.getMonth() + 1);
          const nextNextDueStr = d.toISOString().split('T')[0];

          const newExpense = {
            category: exp.category,
            amount: exp.amount,
            date: currentNextDue,
            description: (exp.description || '').replace(' (Auto-generated)', '') + ' (Auto-generated)',
            expenseType: exp.expenseType,
            isRecurring: true,
            nextDueDate: nextNextDueStr,
            meterDetails: exp.meterDetails || null,
            salaryDetails: exp.salaryDetails || null,
            month: currentNextDue.substring(0, 7),
          };

          const newId = await createDocument(COLLECTIONS.EXPENSES, newExpense).then((res) => res.id || res);

          await updateDocument(COLLECTIONS.EXPENSES, currentOldId, {
            isRecurring: false,
            nextDueDate: null,
          });

          currentOldId = newId;
          currentNextDue = nextNextDueStr;
          hasNewRecurring = true;
        }
      }

      // 2. Auto-Sync Staff Monthly Salaries from Starting Date (unless staff left)
      let hasNewStaffSalary = false;
      for (const staff of (staffData || [])) {
        const salary = Number(staff.monthlySalary) || 0;
        if (salary <= 0) continue;

        // Check starting date/month
        const staffStartDate = staff.startDate || (staff.createdAt?.seconds ? new Date(staff.createdAt.seconds * 1000).toISOString().split('T')[0] : null);
        const startMonth = staffStartDate ? staffStartDate.substring(0, 7) : null;

        // If selectedMonth is before the staff's start month, do not generate
        if (startMonth && selectedMonth < startMonth) {
          continue;
        }

        // If staff is marked 'left', check leftDate
        if (staff.status === 'left') {
          const leftMonth = staff.leftDate ? staff.leftDate.substring(0, 7) : null;
          if (leftMonth && selectedMonth > leftMonth) {
            continue;
          }
          if (!leftMonth && selectedMonth >= currentMonth) {
            continue;
          }
        }

        // Check if salary expense already exists for this staff in selectedMonth
        const alreadyHasSalary = expensesData.some((exp) => {
          const isSalary = exp.category === 'Staff Salary' || exp.expenseType === 'salary';
          if (!isSalary) return false;

          let expMonth = exp.month;
          if (!expMonth && exp.date) {
            const d = exp.date?.seconds ? new Date(exp.date.seconds * 1000) : new Date(exp.date);
            if (!isNaN(d.getTime())) {
              expMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            }
          }
          if (expMonth !== selectedMonth) return false;

          const matchId = exp.staffId === staff.id || exp.salaryDetails?.staffId === staff.id;
          const matchName = (exp.salaryDetails?.staffName?.toLowerCase() || exp.description?.toLowerCase())?.includes(
            staff.name.toLowerCase()
          );
          return matchId || matchName;
        });

        if (!alreadyHasSalary) {
          const newSalaryExpense = {
            category: 'Staff Salary',
            amount: salary,
            date: `${selectedMonth}-01`,
            month: selectedMonth,
            description: `Staff Salary: ${staff.name} (${staff.roleLabel || staff.role || 'Staff'}) [Auto-Scheduled]`,
            expenseType: 'salary',
            staffId: staff.id,
            isStaffSalaryAuto: true,
            isRecurring: true,
            salaryDetails: {
              staffId: staff.id,
              staffName: staff.name,
              role: staff.roleLabel || staff.role || 'Staff',
              baseSalary: salary,
              daysInMonth: 30,
              daysWorked: 30,
              bonus: 0,
              deductions: 0,
              netSalary: salary,
              paymentMode: 'cash',
            },
          };

          await createDocument(COLLECTIONS.EXPENSES, newSalaryExpense);
          hasNewStaffSalary = true;
        }
      }

      if (hasNewRecurring || hasNewStaffSalary) {
        const refreshedExpenses = await fetchCollectionData(COLLECTIONS.EXPENSES);
        expensesData.length = 0;
        expensesData.push(...refreshedExpenses);
      }

      const [year, month] = selectedMonth.split('-');

      const filteredExpenses = expensesData.filter((exp) => {
        let expMonth = exp.month;
        if (!expMonth && exp.date) {
          const d = exp.date?.seconds
            ? new Date(exp.date.seconds * 1000)
            : new Date(exp.date);
          if (!isNaN(d.getTime())) {
            expMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
          }
        }
        return expMonth === selectedMonth;
      });
      setExpenses(filteredExpenses);

      const filteredFees = feesData.filter((fee) => {
        if (fee.status !== 'paid') return false;
        let fMonth = fee.month;
        if (!fMonth && fee.paidDate) {
          const d = fee.paidDate?.seconds
            ? new Date(fee.paidDate.seconds * 1000)
            : new Date(fee.paidDate);
          if (!isNaN(d.getTime())) {
            fMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
          }
        }
        return fMonth === selectedMonth;
      });
      const totalRev = filteredFees.reduce((sum, fee) => sum + (Number(fee.amount) || 0), 0);
      setRevenue(totalRev);
    } catch (error) {
      console.error('Error fetching expenses data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedMonth]);

  const handleAdd = (prefillCategory = null) => {
    if (prefillCategory) {
      setEditData({
        category: prefillCategory,
        amount: '',
        date: new Date().toISOString().split('T')[0],
        description: '',
      });
    } else {
      setEditData(null);
    }
    setIsFormOpen(true);
  };

  const handleEdit = (expense) => {
    setEditData(expense);
    setIsFormOpen(true);
  };

  const handleDeleteClick = (expense) => {
    setDeleteData(expense);
  };

  const handleFormSubmit = async (data) => {
    let recordMonth = selectedMonth;
    if (data.date) {
      const dStr = typeof data.date === 'string' ? data.date : new Date(data.date).toISOString().split('T')[0];
      if (dStr.includes('-')) {
        recordMonth = dStr.substring(0, 7);
      }
    }

    const expenseRecord = {
      ...data,
      month: recordMonth,
    };

    if (editData && editData.id) {
      await updateDocument(COLLECTIONS.EXPENSES, editData.id, expenseRecord);
    } else {
      await createDocument(COLLECTIONS.EXPENSES, expenseRecord);
    }
    setIsFormOpen(false);
    fetchData();
  };

  const confirmDelete = async () => {
    if (deleteData) {
      await removeDocument(COLLECTIONS.EXPENSES, deleteData.id);
      setDeleteData(null);
      fetchData();
    }
  };

  const handleToggleStaffStatusInExpenses = async (staff, targetStatus) => {
    try {
      await updateDocument(COLLECTIONS.STAFF_USERS, staff.id, {
        status: targetStatus,
        leftDate: targetStatus === 'left' ? new Date().toISOString() : null,
      });
      fetchData();
    } catch (err) {
      console.error('Error toggling staff status in expenses:', err);
    }
  };

  const handleSaveStaffSalaryInExpenses = async (staffId, newSalary) => {
    try {
      await updateDocument(COLLECTIONS.STAFF_USERS, staffId, {
        monthlySalary: Number(newSalary) || 0,
      });
      setEditStaffSalary(null);
      fetchData();
    } catch (err) {
      console.error('Error updating staff salary:', err);
    }
  };

  const activeStaffWithSalary = staffList.filter((s) => {
    const isLeft = s.status === 'left' || s.status === 'inactive';
    const salary = Number(s.monthlySalary) || 0;
    return !isLeft && salary > 0;
  });

  const totalMonthlySalaries = activeStaffWithSalary.reduce(
    (sum, s) => sum + (Number(s.monthlySalary) || 0),
    0
  );

  if (loading) {
    return (
      <Layout title="Expenses">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Expenses & Financials">
      <div className="space-y-6">
        {/* Top Header & Actions */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Expenses & Utility Management</h1>
            <p className="text-gray-500 text-sm mt-0.5">
              Monthly electricity meter bills, staff salaries, rent & recurring expenses
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Month Filter */}
            <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-gray-200 shadow-2xs">
              <Calendar className="w-4 h-4 text-indigo-600 ml-2" />
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="text-xs font-bold text-gray-800 bg-transparent border-none focus:ring-0 cursor-pointer p-1"
              />
            </div>

            {/* Quick Action: Light Bill */}
            <button
              onClick={() => handleAdd('Electricity')}
              className="px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              title="Add Monthly Electricity Bill with Meter Reading"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>⚡ Light Bill</span>
            </button>

            {/* Quick Action: Staff Salaries Roster & Auto-Repeat */}
            <button
              onClick={() => setIsStaffModalOpen(true)}
              className="px-3 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              title="Manage Staff Monthly Salaries & Auto-Repeat"
            >
              <Users className="w-3.5 h-3.5" />
              <span>👥 Staff Salaries ({activeStaffWithSalary.length})</span>
            </button>

            {/* Add General Expense Button */}
            <Button icon={<Plus className="w-4 h-4" />} onClick={() => handleAdd()}>
              Add Expense
            </Button>
          </div>
        </div>

        {/* Staff Salary Auto-Repeat Info Banner */}
        {activeStaffWithSalary.length > 0 && (
          <div className="bg-indigo-50/80 border border-indigo-200 p-3.5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <p className="font-extrabold text-indigo-950 text-xs sm:text-sm">
                  Staff Monthly Salaries Auto-Sync Active ({activeStaffWithSalary.length} Staff: {formatCurrency(totalMonthlySalaries)}/month)
                </p>
                <p className="text-[11px] text-indigo-700 mt-0.5">
                  एक्टिव स्टाफ की सैलरी हर महीने अपने-आप इस लिस्ट में जुड़ती है। अगर किसी ने <strong>छुट्टी</strong> मारी हो, तो नीचे लिस्ट में <strong>Edit (पेंसिल)</strong> दबाकर उस महीने की सैलरी कटौती (deduction) सेव कर सकते हैं। जब कोई स्टाफ छोड़ दे, तो <strong>'Mark Left'</strong> करें।
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsStaffModalOpen(true)}
              className="px-3 py-1.5 bg-white hover:bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-xl font-bold shadow-2xs transition-colors shrink-0 cursor-pointer self-start sm:self-auto"
            >
              Manage Staff Salaries
            </button>
          </div>
        )}

        {/* 4 Cards & Visual Chart Breakdown */}
        <ExpenseSummary expenses={expenses} revenue={revenue} />

        {/* Detailed Itemized Expense List */}
        <ExpenseList
          expenses={expenses}
          onEdit={handleEdit}
          onDelete={handleDeleteClick}
        />
      </div>

      {/* Staff Salary Roster Modal */}
      <Modal
        isOpen={isStaffModalOpen}
        onClose={() => {
          setIsStaffModalOpen(false);
          setEditStaffSalary(null);
        }}
        title="Staff Monthly Salaries & Auto-Schedule (मासिक वेतन)"
        size="lg"
      >
        <div className="space-y-4">
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-2xl text-xs text-blue-900 leading-relaxed">
            💡 <strong>यह कैसे काम करता है:</strong>
            <ul className="list-disc list-inside mt-1 space-y-0.5">
              <li>यहाँ जिस स्टाफ की मंथली सैलरी सेट होगी, वह <strong>शुरुआत की तारीख से हर महीने Expenses में अपने-आप जुड़ेगी</strong>।</li>
              <li>अगर किसी महीने में स्टाफ ने <strong>छुट्टी (Leave/Absent)</strong> मारी हो, तो उस महीने के खर्च में जाकर <strong>Edit</strong> दबाएं और कटौती (deduction) दर्ज करें।</li>
              <li>जब कोई स्टाफ नौकरी छोड़ दे, तो बस <strong>'Mark Left'</strong> दबाएं — उसकी सैलरी अगले महीनों में अपने-आप नहीं जुड़ेगी।</li>
            </ul>
          </div>

          {staffList.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              No staff members found. Please add staff in <strong>Staff & Roles</strong> first.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-2xs max-h-96 overflow-y-auto">
              {staffList.map((st) => {
                const isLeft = st.status === 'left';
                const salary = Number(st.monthlySalary) || 0;
                const isEditingThis = editStaffSalary?.id === st.id;

                return (
                  <div
                    key={st.id}
                    className={`p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                      isLeft ? 'bg-slate-50/70' : 'hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-extrabold text-sm text-slate-900">{st.name}</span>
                        <span className="text-xs text-slate-500 font-medium">
                          ({st.roleLabel || st.role || 'Staff'})
                        </span>
                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                            isLeft
                              ? 'bg-rose-100 text-rose-700 border border-rose-200'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          }`}
                        >
                          {isLeft ? '🔴 Left (छोड़ दिया)' : '🟢 Active'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        User ID: {st.email} {st.startDate ? `• 📅 Started: ${formatDate(st.startDate)}` : ''}
                      </p>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                      {isEditingThis ? (
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            min="0"
                            value={tempSalaryInput}
                            onChange={(e) => setTempSalaryInput(e.target.value)}
                            placeholder="₹ Salary"
                            className="w-24 px-2 py-1 border border-indigo-300 rounded-lg text-xs font-bold text-indigo-900 bg-white"
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveStaffSalaryInExpenses(st.id, tempSalaryInput)}
                            className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditStaffSalary(null)}
                            className="px-2 py-1 bg-slate-200 text-slate-700 rounded-lg text-xs font-bold cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${
                              salary > 0 && !isLeft
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : 'bg-slate-100 text-slate-500 border-slate-200'
                            }`}
                          >
                            {salary > 0 ? (
                              <span className="flex items-center gap-1">
                                <IndianRupee className="w-3 h-3" />
                                <span>₹{salary.toLocaleString('en-IN')}/month</span>
                              </span>
                            ) : (
                              'No salary set'
                            )}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setEditStaffSalary(st);
                              setTempSalaryInput(String(salary || ''));
                            }}
                            className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg cursor-pointer transition-colors"
                            title="Edit Monthly Salary"
                          >
                            <Edit2 size={13} />
                          </button>
                        </div>
                      )}

                      {isLeft ? (
                        <button
                          type="button"
                          onClick={() => handleToggleStaffStatusInExpenses(st, 'active')}
                          className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold cursor-pointer transition-colors"
                          title="Reactivate staff member and resume monthly salary"
                        >
                          🟢 Reactivate
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleToggleStaffStatusInExpenses(st, 'left')}
                          className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold cursor-pointer transition-colors flex items-center gap-1"
                          title="Mark staff as Left (stops monthly salary from automatically adding to expenses)"
                        >
                          <UserX size={12} />
                          <span>Mark Left</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
            <span className="text-slate-500">
              Total Active Monthly Staff Salary: <strong>{formatCurrency(totalMonthlySalaries)}</strong>
            </span>
            <button
              type="button"
              onClick={() => {
                setIsStaffModalOpen(false);
                setEditStaffSalary(null);
              }}
              className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold cursor-pointer transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </Modal>

      <ExpenseForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleFormSubmit}
        editData={editData}
        staffList={staffList}
      />

      <ConfirmDialog
        isOpen={!!deleteData}
        title="Delete Expense"
        message="Are you sure you want to delete this expense record?"
        onConfirm={confirmDelete}
        onClose={() => setDeleteData(null)}
        variant="danger"
      />
    </Layout>
  );
}
