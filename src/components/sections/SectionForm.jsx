import { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { SECTION_ICONS, getSectionIconConfig } from './sectionIcons';

export default function SectionForm({ isOpen, onClose, onSubmit, editData = null, existingSeatsCount = 0 }) {
  const [formData, setFormData] = useState({ name: '', totalSeats: '', description: '', icon: 'common' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editData) {
      const defaultIcon = editData.icon || getSectionIconConfig(null, editData.name).id;
      setFormData({
        name: editData.name || '',
        totalSeats: editData.totalSeats !== undefined && editData.totalSeats !== null ? String(editData.totalSeats) : String(existingSeatsCount || 10),
        description: editData.description || '',
        icon: defaultIcon,
      });
    } else {
      setFormData({ name: '', totalSeats: '', description: '', icon: 'common' });
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
        icon: formData.icon || 'common',
      });
      onClose();
    } catch (err) {
      console.error('Section submit error:', err);
    } finally {
      setLoading(false);
    }
  };

  const selectedConfig = getSectionIconConfig(formData.icon, formData.name);
  const SelectedIcon = selectedConfig.icon;

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
            placeholder="e.g. Girls Section, Boys Cabin, Common Hall"
          />
        </div>

        {/* Section Icon Selection */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Section Icon (आइकन चुनें)
            </label>
            <span className="text-[11px] text-slate-500 font-medium">Click to select icon</span>
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 p-2 bg-slate-50 border border-slate-200 rounded-2xl max-h-52 overflow-y-auto">
            {SECTION_ICONS.map((item) => {
              const isSelected = (formData.icon || 'common') === item.id;
              const IconComp = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setFormData({ ...formData, icon: item.id })}
                  className={`p-2 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs ring-2 ring-slate-400'
                      : `bg-white ${item.color} border-slate-200 hover:bg-slate-100 hover:border-slate-300`
                  }`}
                  title={item.label}
                >
                  <IconComp className="w-5 h-5 shrink-0" />
                  <span className={`text-[9px] font-bold truncate w-full text-center leading-none ${isSelected ? 'text-white' : 'text-slate-700'}`}>
                    {item.label.split(' ')[0]}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Live Icon Preview */}
          <div className="flex items-center gap-3 p-2.5 mt-2 bg-slate-50 border border-slate-200 rounded-xl">
            <div className={`w-10 h-10 ${selectedConfig.bg} border ${selectedConfig.border} rounded-xl flex items-center justify-center shrink-0 shadow-2xs`}>
              <SelectedIcon className={`w-5 h-5 ${selectedConfig.color}`} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                Live Preview on Section Card • {selectedConfig.label}
              </p>
              <p className="text-sm font-extrabold text-slate-900 truncate">
                {formData.name.trim() || 'Section Name'}
              </p>
            </div>
          </div>
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
