import React, { useState, useEffect } from "react";
import Modal from "../common/Modal";
import Button from "../common/Button";
import { Plus, Trash2, PlayCircle, CalendarClock, CheckCircle2, Receipt, Users, Zap, Building, Wifi, CreditCard } from "lucide-react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../../firebase/config";
import { COLLECTIONS } from "../../utils/constants";
import { formatCurrency, formatDate } from "../../utils/helpers";

export default function RecurringExpensesModal({ isOpen, onClose, allCategories, onAutoRecordExpense }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [processingId, setProcessingId] = useState(null);

  const getTodayStr = () => new Date().toISOString().split("T")[0];

  const [newItem, setNewItem] = useState({ 
    name: "", 
    category: "Staff Salary", 
    customCategory: "", 
    amount: "",
    cycle: 1,
    nextDueDate: getTodayStr()
  });

  useEffect(() => {
    if (isOpen) fetchRecurring();
  }, [isOpen]);

  const fetchRecurring = async () => {
    setLoading(true);
    try {
      const docRef = doc(db, COLLECTIONS.SETTINGS, "recurringExpenses");
      const snap = await getDoc(docRef);
      if (snap.exists()) setItems(snap.data().items || []);
      else setItems([]);
    } catch (error) {
      console.error("Error fetching recurring expenses:", error);
    }
    setLoading(false);
  };

  const handleSave = async (updatedItems) => {
    setIsSaving(true);
    try {
      const docRef = doc(db, COLLECTIONS.SETTINGS, "recurringExpenses");
      await setDoc(docRef, { items: updatedItems });
      setItems(updatedItems);
    } catch (error) {
      console.error("Error saving recurring expenses:", error);
      alert("Failed to save.");
    }
    setIsSaving(false);
  };

  const handleAddItem = (e) => {
    e.preventDefault();
    if (!newItem.name || !newItem.amount) return;
    
    const finalCategory = newItem.category === "Custom..." ? newItem.customCategory.trim() : newItem.category;
    if (!finalCategory) {
      alert("Please specify a category.");
      return;
    }

    const newEntry = {
      id: Date.now().toString(),
      name: newItem.name.trim(),
      category: finalCategory,
      amount: Number(newItem.amount),
      cycle: Number(newItem.cycle),
      nextDueDate: newItem.nextDueDate
    };
    
    handleSave([...items, newEntry]);
    setNewItem({ name: "", category: "Staff Salary", customCategory: "", amount: "", cycle: 1, nextDueDate: getTodayStr() });
  };

  const handleDeleteItem = (id) => {
    if (window.confirm("Are you sure you want to remove this fixed expense?")) {
      handleSave(items.filter(item => item.id !== id));
    }
  };

  const handleRecordAndRenew = async (item) => {
    setProcessingId(item.id);
    try {
      const payDate = item.nextDueDate || getTodayStr();
      await onAutoRecordExpense(item, payDate);

      const d = new Date(payDate);
      d.setMonth(d.getMonth() + (Number(item.cycle) || 1));
      const nextDue = d.toISOString().split("T")[0];

      const updatedItems = items.map(it => it.id === item.id ? { ...it, nextDueDate: nextDue } : it);
      await handleSave(updatedItems);
    } catch (error) {
      console.error("Failed to record and renew:", error);
    }
    setProcessingId(null);
  };

  // Dynamic Title Label Helper
  const getTitleInfo = (cat) => {
    if (!cat) return { label: "Expense Title", placeholder: "e.g. Office Cleaning...", icon: <Receipt size={14}/> };
    const lower = cat.toLowerCase();
    if (lower.includes("staff") || lower.includes("salary")) return { label: "Staff Member Name", placeholder: "e.g. Amit, Payal...", icon: <Users size={14}/> };
    if (lower.includes("rent")) return { label: "Property / Rent Details", placeholder: "e.g. Building Rent, Shop 2...", icon: <Building size={14}/> };
    if (lower.includes("wifi") || lower.includes("internet")) return { label: "Provider / Plan Name", placeholder: "e.g. Jio Fiber 150Mbps...", icon: <Wifi size={14}/> };
    if (lower.includes("electricity") || lower.includes("water")) return { label: "Connection / Meter Details", placeholder: "e.g. Ground Floor Meter...", icon: <Zap size={14}/> };
    return { label: "Expense Title / Name", placeholder: "e.g. Monthly Snacks, Cleaning...", icon: <Receipt size={14}/> };
  };

  const titleInfo = getTitleInfo(newItem.category === "Custom..." ? newItem.customCategory : newItem.category);

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Manage Fixed & Recurring Expenses">
      <div className="p-4 sm:p-6 bg-white flex flex-col h-[90vh] sm:h-[85vh] max-h-[800px]">
        <div className="mb-5 text-sm text-gray-600 bg-indigo-50/50 p-3 rounded-lg border border-indigo-100 flex gap-3 items-start">
          <CreditCard className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
          <p>
            Set up your recurring expenses here (like Rent, Staff Salaries, or 3-Month WiFi plans). 
            Click <strong>"Pay & Renew"</strong> when it is due � the system will automatically log the payment and forward the due date for you!
          </p>
        </div>

        {/* Add New Fixed Expense Form */}
        <form onSubmit={handleAddItem} className="bg-slate-50 p-4 sm:p-5 rounded-xl border border-slate-200 mb-6 flex-shrink-0 shadow-sm">
          <h4 className="text-sm font-extrabold text-slate-800 mb-4 flex items-center gap-2 uppercase tracking-wide">
            <Plus size={16} className="text-indigo-600"/> Add New Fixed Expense
          </h4>
          
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
            
            <div className="sm:col-span-5">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Expense Category</label>
              <select
                value={newItem.category}
                onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500 font-medium transition-shadow"
              >
                {allCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                <option value="Custom...">+ Add Custom Category...</option>
              </select>
            </div>
            
            <div className="sm:col-span-7">
              <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                {titleInfo.icon} {titleInfo.label}
              </label>
              <input
                type="text"
                placeholder={titleInfo.placeholder}
                required
                value={newItem.name}
                onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500 font-medium transition-shadow"
              />
            </div>

            {newItem.category === "Custom..." && (
              <div className="sm:col-span-12 animate-in fade-in slide-in-from-top-1">
                 <label className="block text-[11px] font-bold text-indigo-600 uppercase tracking-wider mb-1.5">New Custom Category Name</label>
                 <input 
                   type="text" 
                   placeholder="e.g. Monthly Snacks" 
                   required 
                   value={newItem.customCategory}
                   onChange={(e) => setNewItem({ ...newItem, customCategory: e.target.value })}
                   className="w-full px-3.5 py-2.5 border border-indigo-300 rounded-lg text-sm bg-indigo-50 focus:ring-2 focus:ring-indigo-500 font-medium"
                 />
              </div>
            )}

            <div className="sm:col-span-4">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Amount (?)</label>
              <input
                type="number"
                min="0"
                placeholder="? 0"
                required
                value={newItem.amount}
                onChange={(e) => setNewItem({ ...newItem, amount: e.target.value })}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm bg-white font-extrabold text-slate-900 focus:ring-2 focus:ring-indigo-500 transition-shadow"
              />
            </div>

            <div className="sm:col-span-4">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Billing Cycle</label>
              <select
                value={newItem.cycle}
                onChange={(e) => setNewItem({ ...newItem, cycle: e.target.value })}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500 font-medium transition-shadow"
              >
                <option value="1">Every 1 Month</option>
                <option value="2">Every 2 Months</option>
                <option value="3">Every 3 Months</option>
                <option value="6">Every 6 Months</option>
                <option value="12">Every 1 Year</option>
              </select>
            </div>

            <div className="sm:col-span-4">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">First / Next Due Date</label>
              <input
                type="date"
                required
                value={newItem.nextDueDate}
                onChange={(e) => setNewItem({ ...newItem, nextDueDate: e.target.value })}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500 font-medium transition-shadow"
              />
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-200">
            <Button type="submit" disabled={isSaving} className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-sm">
              <Plus size={18} className="mr-1.5" /> Save to Fixed Expenses List
            </Button>
          </div>
        </form>

        {/* List of Fixed Expenses */}
        <h4 className="text-sm font-extrabold text-slate-800 mb-3 flex items-center gap-2 uppercase tracking-wide px-1">
          <CalendarClock size={16} className="text-indigo-600"/> Active Recurring Expenses
        </h4>
        <div className="flex-1 overflow-y-auto min-h-0 border border-slate-200 rounded-xl bg-slate-50/50 shadow-inner">
          {loading ? (
            <div className="flex items-center justify-center h-full text-slate-400 text-sm font-medium">Loading...</div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 text-sm p-8 text-center">
              <Receipt size={48} className="text-slate-200 mb-3" />
              <p className="font-semibold text-slate-500">No fixed expenses added yet.</p>
              <p className="text-xs mt-1 max-w-xs">Add your staff members, rent, or WiFi bills above to track them easily.</p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-200">
              {items.map(item => {
                const dueStr = item.nextDueDate || getTodayStr();
                const isOverdue = new Date(dueStr) < new Date(getTodayStr());
                const isDueToday = dueStr === getTodayStr();
                const cycleText = item.cycle > 1 ? " / " + item.cycle + "mo" : "/mo";
                
                return (
                  <li key={item.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white hover:bg-slate-50 transition-colors">
                    <div>
                      <h4 className="font-bold text-slate-900 text-base">{item.name}</h4>
                      <div className="flex flex-wrap items-center gap-2.5 mt-2">
                        <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-100 uppercase tracking-wider">
                          {item.category}
                        </span>
                        
                        <span className={"inline-flex items-center gap-1.5 text-[11px] font-extrabold px-2.5 py-1 rounded-md border uppercase tracking-wider " + (isOverdue ? "bg-rose-50 text-rose-700 border-rose-200" : isDueToday ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-slate-50 text-slate-600 border-slate-200")}>
                          <CalendarClock size={13} />
                          {isOverdue ? "Overdue:" : "Due:"} {formatDate(dueStr)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex flex-col sm:items-end justify-between sm:justify-end gap-3 w-full sm:w-auto mt-2 sm:mt-0">
                      <span className="font-black text-slate-800 text-lg">
                        {formatCurrency(item.amount)}<span className="text-xs font-semibold text-slate-400 ml-0.5">{cycleText}</span>
                      </span>
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <button
                          onClick={() => handleRecordAndRenew(item)}
                          disabled={processingId === item.id}
                          className={"flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-extrabold transition-all shadow-sm " + (processingId === item.id ? "bg-slate-100 text-slate-400" : "bg-emerald-500 text-white hover:bg-emerald-600 hover:shadow-md")}
                          title="Record this expense and auto-forward the due date"
                        >
                          {processingId === item.id ? <CheckCircle2 size={15} className="animate-pulse" /> : <PlayCircle size={15} />}
                          Pay & Renew
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="p-2 text-rose-500 hover:bg-rose-100 hover:text-rose-700 rounded-lg transition-colors border border-transparent hover:border-rose-200"
                          title="Remove if staff leaves or bill stops"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        
        <div className="mt-5 pt-4 border-t border-slate-100 flex justify-end shrink-0">
          <Button variant="secondary" onClick={onClose} className="px-6">Close Window</Button>
        </div>
      </div>
    </Modal>
  );
}
