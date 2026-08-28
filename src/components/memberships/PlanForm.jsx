import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';

export default function PlanForm({ isOpen, onClose, onSubmit, editData }) {
  const [formData, setFormData] = useState({
    name: '',
    durationMonths: 1,
    price: 0,
    originalPrice: 0,
    shiftType: 'all',
    isOffer: false,
    isActive: true,
  });

  useEffect(() => {
    if (editData) {
      setFormData({
        name: editData.name || '',
        durationMonths: editData.durationMonths || 1,
        price: editData.price || 0,
        originalPrice: editData.originalPrice || 0,
        shiftType: editData.shiftType || 'all',
        isOffer: !!editData.isOffer,
        isActive: editData.isActive !== false,
      });
    } else {
      setFormData({
        name: '',
        durationMonths: 1,
        price: 0,
        originalPrice: 0,
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
      [name]: type === 'checkbox' ? checked : type === 'number' ? Number(value) : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editData ? 'Edit Membership Plan' : 'Add Membership Plan'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Plan Name *</label>
          <input
            type="text"
            name="name"
            required
            value={formData.name}
            onChange={handleChange}
            placeholder="e.g. 1 Month Full Day, 3 Month Half Day Offer"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Duration (Months) *</label>
            <input
              type="number"
              name="durationMonths"
              min="1"
              required
              value={formData.durationMonths}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Shift Suitability</label>
            <select
              name="shiftType"
              value={formData.shiftType}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
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
            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
          <label htmlFor="isOffer" className="text-sm font-medium text-gray-700">
            Is this a Special Promotional Offer? (e.g. ₹1000 for 3 months)
          </label>
        </div>

        {formData.isOffer && (
          <div>
            <label className="block text-sm font-medium text-gray-700">Original Price (₹)</label>
            <input
              type="number"
              name="originalPrice"
              min="0"
              value={formData.originalPrice}
              onChange={handleChange}
              placeholder="e.g. 1500"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700">Plan Price (₹) *</label>
          <input
            type="number"
            name="price"
            min="0"
            required
            value={formData.price}
            onChange={handleChange}
            placeholder="e.g. 500 or 1000"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
          />
        </div>

        {formData.isOffer && formData.originalPrice > formData.price && (
          <div className="text-xs text-green-700 font-bold bg-green-50 p-2.5 rounded-lg border border-green-200">
            🔥 Student Savings: ₹{formData.originalPrice - formData.price}
          </div>
        )}

        <div className="mt-5 flex justify-end gap-3">
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
