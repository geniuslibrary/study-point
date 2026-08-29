import { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';

export default function SectionForm({ isOpen, onClose, onSubmit, editData = null, existingSeatsCount = 0 }) {
  const [formData, setFormData] = useState({ name: '', totalSeats: '', description: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editData) {
      setFormData({
        name: editData.name || '',
        totalSeats: editData.totalSeats !== undefined && editData.totalSeats !== null ? String(editData.totalSeats) : String(existingSeatsCount || 10),
        description: editData.description || '',
      });
    } else {
      setFormData({ name: '', totalSeats: '', description: '' });
    }
  }, [editData, existingSeatsCount, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    setLoading(true);
    try {
      const seatsNum = formData.totalSeats === '' ? (existingSeatsCount || 10) : parseInt(formData.totalSeats) || 10;
      await onSubmit({
        ...formData,
        name: formData.name.trim(),
        totalSeats: Math.max(1, seatsNum),
      });
      onClose();
    } catch (err) {
      console.error('Section submit error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editData ? 'Edit Section Details & Seats' : 'Add New Section'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
            Section Name *
          </label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm"
            placeholder="e.g. Boys Section, Girls Section, AC Quiet Hall"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
            Total Physical Seats *
          </label>
          <input
            type="number"
            required
            min="1"
            max="500"
            value={formData.totalSeats}
            onChange={(e) => setFormData({ ...formData, totalSeats: e.target.value })}
            placeholder="e.g. 20 or 50"
            className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm font-semibold text-slate-900"
          />
          {editData && (
            <p className="text-[11px] text-slate-500 mt-1">
              Currently has <strong>{existingSeatsCount}</strong> seats. Increasing this will automatically add new physical seats.
            </p>
          )}
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
            Section Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm"
            rows="2"
            placeholder="Optional description (e.g. Air Conditioned, silent zone, personal sockets)..."
          />
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
          <Button variant="secondary" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            {editData ? 'Update Section & Seats' : 'Create Section'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
