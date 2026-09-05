import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { Plus, Trash2, Zap, Users, Receipt, PlayCircle } from 'lucide-react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { COLLECTIONS } from '../../utils/constants';
import { formatCurrency } from '../../utils/helpers';

export default function RecurringExpensesModal({ isOpen, onClose, allCategories, onRecordExpense }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // New Item State
  const [newItem, setNewItem] = useState({ name: '', category: 'Staff Salary', amount: '' });

  useEffect(() => {
    if (isOpen) {
      fetchRecurring();
    }
  }, [isOpen]);

  const fetchRecurring = async () => {
    setLoading(true);
    try {
      const docRef = doc(db, COLLECTIONS.SETTINGS, 'recurringExpenses');
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        setItems(snap.data().items || []);
      } else {
        setItems([]);
      }
    } catch (error) {
      console.error('Error fetching recurring expenses:', error);
    }
    setLoading(false);
  };

  const handleSave = async (updatedItems) => {
    setIsSaving(true);
    try {
      const docRef = doc(db, COLLECTIONS.SETTINGS, 'recurringExpenses');
      await setDoc(docRef, { items: updatedItems });
      setItems(updatedItems);
    } catch (error) {
      console.error('Error saving recurring expenses:', error);
      alert('Failed to save.');
    }
    setIsSaving(false);
  };

  const handleAddItem = (e) => {
    e.preventDefault();
    if (!newItem.name || !newItem.amount) return;
    
    const newEntry = {
      id: Date.now().toString(),
      name: newItem.name.trim(),
      category: newItem.category,
      amount: Number(newItem.amount)
    };
    
    handleSave([...items, newEntry]);
    setNewItem({ name: '', category: 'Staff Salary', amount: '' });
  };

  const handleDeleteItem = (id) => {
    if (window.confirm('Are you sure you want to remove this fixed expense?')) {
      handleSave(items.filter(item => item.id !== id));
    }
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Manage Fixed / Recurring Expenses">
      <div className="p-5 sm:p-6 bg-white flex flex-col h-[75vh] max-h-[600px]">
        <div className="mb-4 text-xs text-gray-500">
          Save your fixed monthly expenses here (like Staff Salaries, WiFi, Rent). If a staff leaves, just delete them from this list. You can quickly record these expenses every month.
        </div>

        {/* Add New Fixed Expense Form */}
        <form onSubmit={handleAddItem} className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100 flex flex-col sm:flex-row gap-3 mb-6 flex-shrink-0">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Name (e.g. Ramesh - Staff, Jio WiFi)"
              required
              value={newItem.name}
              onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
              className="w-full px-3 py-2 border border-indigo-200 rounded-lg text-sm bg-white"
            />
          </div>
          <div className="sm:w-1/4">
            <select
              value={newItem.category}
              onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
              className="w-full px-3 py-2 border border-indigo-200 rounded-lg text-sm bg-white"
            >
              {allCategories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div className="sm:w-1/4">
            <input
              type="number"
              min="0"
              placeholder="Amount (?)"
              required
              value={newItem.amount}
              onChange={(e) => setNewItem({ ...newItem, amount: e.target.value })}
              className="w-full px-3 py-2 border border-indigo-200 rounded-lg text-sm bg-white font-bold"
            />
          </div>
          <Button type="submit" disabled={isSaving} className="bg-indigo-600 hover:bg-indigo-700 text-white whitespace-nowrap">
            <Plus size={16} /> Add
          </Button>
        </form>

        {/* List of Fixed Expenses */}
        <div className="flex-1 overflow-y-auto min-h-0 border border-gray-200 rounded-xl bg-gray-50/50">
          {loading ? (
            <div className="flex items-center justify-center h-full text-gray-400 text-sm">Loading...</div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 text-sm p-6 text-center">
              No fixed expenses added yet. Add your staff members or fixed utility bills above.
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {items.map(item => (
                <li key={item.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white hover:bg-slate-50 transition-colors">
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm">{item.name}</h4>
                    <span className="inline-flex items-center gap-1 mt-1 text-xs font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                      {item.category}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-4">
                    <span className="font-extrabold text-red-600">
                      {formatCurrency(item.amount)}/mo
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          onRecordExpense(item);
                          onClose();
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-700 hover:bg-green-200 hover:text-green-800 rounded-lg text-xs font-bold transition-colors"
                        title="Record this expense now"
                      >
                        <PlayCircle size={14} />
                        Record Pay
                      </button>
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="p-1.5 text-rose-500 hover:bg-rose-100 rounded-lg transition-colors"
                        title="Remove if staff leaves or bill stops"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        
        <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end">
          <Button variant="secondary" onClick={onClose}>Close</Button>
        </div>
      </div>
    </Modal>
  );
}
