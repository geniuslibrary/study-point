import React, { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import Button from '../components/common/Button';
import ConfirmDialog from '../components/common/ConfirmDialog';
import ExpenseForm from '../components/expenses/ExpenseForm';
import ExpenseList from '../components/expenses/ExpenseList';
import ExpenseSummary from '../components/expenses/ExpenseSummary';
import { Plus, Loader2, Zap, Users, Receipt, Calendar } from 'lucide-react';
import { COLLECTIONS } from '../utils/constants';
import { getMonthName } from '../utils/helpers';
import {
  fetchCollectionData,
  createDocument,
  updateDocument,
  removeDocument,
} from '../firebase/storageService';

export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [revenue, setRevenue] = useState(0);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [deleteData, setDeleteData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [customCategories, setCustomCategories] = useState([]);

  // Month filter: format YYYY-MM
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [expensesData, feesData] = await Promise.all([
        fetchCollectionData(COLLECTIONS.EXPENSES),
        fetchCollectionData(COLLECTIONS.FEES),
      ]);

      const extractedCats = [...new Set(expensesData.map((e) => e.category))].filter(Boolean);
      setCustomCategories(extractedCats);

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
              Monthly electricity meter bills, staff salaries, rent & additional repairs calculation
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

            {/* Quick Action: Staff Salary */}
            <button
              onClick={() => handleAdd('Staff Salary')}
              className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              title="Calculate & Add Monthly Staff Salary"
            >
              <Users className="w-3.5 h-3.5" />
              <span>👥 Staff Salary</span>
            </button>

            {/* Add General Expense Button */}
            <Button icon={<Plus className="w-4 h-4" />} onClick={() => handleAdd()}>
              Add Expense
            </Button>
          </div>
        </div>

        {/* 4 Cards & Visual Chart Breakdown */}
        <ExpenseSummary expenses={expenses} revenue={revenue} />

        {/* Detailed Itemized Expense List */}
        <ExpenseList
          expenses={expenses}
          onEdit={handleEdit}
          onDelete={handleDeleteClick}
          allCategories={customCategories}
        />
      </div>

      <ExpenseForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleFormSubmit}
        editData={editData}
        customCategories={customCategories}
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
