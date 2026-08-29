import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';

export default function PlanForm({ isOpen, onClose, onSubmit, editData }) {
  const [formData, setFormData] = useState({
    name: '',
    durationMonths: '',
    price: '',
    originalPrice: '',
    shiftType: 'all',
    isOffer: false,
    isActive: true,
  });

  useEffect(() => {
    if (editData) {
      setFormData({
        name: editData.name || '',
        durationMonths: editData.durationMonths !== undefined && editData.durationMonths !== null ? String(editData.durationMonths) : '',
        price: editData.price !== undefined && editData.price !== null ? String(editData.price) : '',
        originalPrice: editData.originalPrice !== undefined && editData.originalPrice !== null ? String(editData.originalPrice) : '',
        shiftType: editData.shiftType || 'all',
        isOffer: !!editData.isOffer,
        isActive: editData.isActive !== false,
      });
    } else {
      setFormData({
        name: '',
        durationMonths: '',
        price: '',
        originalPrice: '',
        shiftType: 'all',
        isOffer: false,
        isActive: true,
      });
    }
  }, [editData, isOpen]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    onSubmit({
      ...formData,
      name: formData.name.trim(),
      durationMonths: formData.durationMonths === '' ? 1 : Number(formData.durationMonths) || 1,
      price: formData.price === '' ? 0 : Number(formData.price) || 0,
      originalPrice: formData.originalPrice === '' ? 0 : Number(formData.originalPrice) || 0,
    });
  };

  const priceNum = Number(formData.price) || 0;
  const origPriceNum = Number(formData.originalPrice) || 0;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editData ? 'Edit Membership Plan' : 'Add Membership Plan'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
            Plan Name *
          </label>
          <input
            type="text"
            name="name"
            required
            value={formData.name}
            onChange={handleChange}
            placeholder="e.g. 1 Month Full Day, 3 Months Golden Offer"
            className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Duration (Months) *
            </label>
            <input
              type="number"
              name="durationMonths"
              min="1"
              required
              value={formData.durationMonths}
              onChange={handleChange}
              placeholder="e.g. 1, 3, 6, 12"
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Shift Suitability
            </label>
            <select
              name="shiftType"
              value={formData.shiftType}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm bg-white focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Shifts</option>
              <option value="full_day">Full Day (6 AM - 11 PM)</option>
              <option value="half_day">Half Day (Morning / Evening)</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <input
            type="checkbox"
            name="isOffer"
            id="isOffer"
            checked={formData.isOffer}
            onChange={handleChange}
            className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
          />
          <label htmlFor="isOffer" className="text-xs font-bold text-slate-700 cursor-pointer">
            Is this a Special Promotional Offer? (e.g. ₹2000 for 3 months)
          </label>
        </div>

        {formData.isOffer && (
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Original Price (₹)
            </label>
            <input
              type="number"
              name="originalPrice"
              min="0"
              value={formData.originalPrice}
              onChange={handleChange}
              placeholder="e.g. 2400"
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        )}

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
            Plan Price (₹) *
          </label>
          <input
            type="number"
            name="price"
            min="0"
            required
            value={formData.price}
            onChange={handleChange}
            placeholder="e.g. 800 or 2200"
            className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {formData.isOffer && origPriceNum > priceNum && priceNum > 0 && (
          <div className="text-xs text-emerald-700 font-bold bg-emerald-50 p-3 rounded-xl border border-emerald-200">
            🔥 Student Total Savings: ₹{origPriceNum - priceNum}
          </div>
        )}

        <div className="pt-2 flex justify-end gap-3 border-t border-slate-100">
          <Button variant="secondary" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button variant="primary" type="submit">
            Save Plan
          </Button>
        </div>
      </form>
    </Modal>
  );
}
