import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { EXPENSE_CATEGORIES } from '../../utils/constants';

export default function ExpenseForm({ isOpen, onClose, onSubmit, editData, prefillData, customCategories = [] }) {
  const [formData, setFormData] = useState({
    category: 'Internet/WiFi',
    customCategory: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
  });

  const allCategories = [...new Set([...EXPENSE_CATEGORIES, ...customCategories])];

  useEffect(() => {
    if (isOpen) {
      const dataToLoad = editData || prefillData;
      if (dataToLoad) {
        const dStr = dataToLoad.date instanceof Date
          ? dataToLoad.date.toISOString().split('T')[0]
          : dataToLoad.date?.seconds
            ? new Date(dataToLoad.date.seconds * 1000).toISOString().split('T')[0]
            : typeof dataToLoad.date === 'string'
              ? dataToLoad.date
              : new Date().toISOString().split('T')[0];

        const cat = dataToLoad.category || 'Internet/WiFi';
        const isCustom = !EXPENSE_CATEGORIES.includes(cat) && !customCategories.includes(cat);

        setFormData({
          category: isCustom ? 'Custom...' : cat,
          customCategory: isCustom ? cat : '',
          amount: dataToLoad.amount || '',
          date: dStr,
          description: dataToLoad.description || '',
        });
      } else {
        setFormData({
          category: 'Internet/WiFi',
          customCategory: '',
          amount: '',
          date: new Date().toISOString().split('T')[0],
          description: '',
        });
      }
    }
  }, [editData, prefillData, isOpen, customCategories]);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const finalCategory = formData.category === 'Custom...' ? formData.customCategory.trim() : formData.category;
    
    if (!finalCategory) {
      alert('Please specify an expense category.');
      return;
    }

    onSubmit({
      category: finalCategory,
      amount: Number(formData.amount),
      date: formData.date,
      description: formData.description,
    });
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editData ? 'Edit Expense Record' : 'Add New Expense'}>
      <div className="p-5 sm:p-6 bg-white">
        <form onSubmit={handleSubmit} className="space-y-5">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                {allCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
                <option value="Custom...">+ Add Custom Category...</option>
              </select>
            </div>

            <div>
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

          {formData.category === 'Custom...' && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-200">
              <label className="block text-xs font-bold text-indigo-700 uppercase tracking-wider mb-1">
                New Category Name *
              </label>
              <input
                type="text"
                name="customCategory"
                required
                value={formData.customCategory}
                onChange={handleChange}
                placeholder="e.g. Festival Decoration"
                className="w-full px-3 py-2 border border-indigo-300 rounded-lg text-sm bg-indigo-50/30 focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Total Amount (?) *
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
              rows="3"
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
