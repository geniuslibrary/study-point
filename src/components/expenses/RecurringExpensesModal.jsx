import React, { useState, useEffect } from "react";
import Modal from "../common/Modal";
import Button from "../common/Button";
import { Plus, Trash2, PlayCircle, CalendarClock, AlertCircle, CheckCircle2 } from "lucide-react";
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
    if (isOpen) {
      fetchRecurring();
    }
  }, [isOpen]);

  const fetchRecurring = async () => {
    setLoading(true);
    try {
      const docRef = doc(db, COLLECTIONS.SETTINGS, "recurringExpenses");
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        setItems(snap.data().items || []);
      } else {
        setItems([]);
      }
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
    setNewItem({ 
      name: "", 
      category: "Staff Salary", 
      customCategory: "", 
      amount: "",
      cycle: 1,
      nextDueDate: getTodayStr()
    });
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

      const updatedItems = items.map(it => 
        it.id === item.id ? { ...it, nextDueDate: nextDue } : it
      );
      
      await handleSave(updatedItems);
    } catch (error) {
      console.error("Failed to record and renew:", error);
    }
    
    setProcessingId(null);
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Manage Fixed / Recurring Expenses">
      <div className="p-5 sm:p-6 bg-white flex flex-col h-[85vh] sm:h-[80vh] max-h-[750px]">
        <div className="mb-4 text-xs text-gray-500">
          Set up recurring expenses (like Rent, Staff, 3-Month WiFi). Click "Pay & Auto-Renew" to record the expense and automatically set the next due date!
        </div>

        <form onSubmit={handleAddItem} className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100 flex flex-col gap-3 mb-6 flex-shrink-0">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-4">
              <label className="block text-[10px] font-bold text-indigo-800 uppercase tracking-wider mb-1">Name / Title</label>
              <input
                type="text"
                placeholder="e.g. Ramesh - Staff, Jio Fiber"
                required
                value={newItem.name}
                onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                className="w-full px-3 py-2 border border-indigo-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            
            <div className="sm:col-span-4">
              <label className="block text-[10px] font-bold text-indigo-800 uppercase tracking-wider mb-1">Category</label>
              <select
                value={newItem.category}
                onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                className="w-full px-3 py-2 border border-indigo-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500"
              >
                {allCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
                <option value="Custom...">+ Add Custom Category...</option>
              </select>
            </div>
            
            <div className="sm:col-span-4">
              <label className="block text-[10px] font-bold text-indigo-800 uppercase tracking-wider mb-1">Amount (?)</label>
              <input
                type="number"
                min="0"
                placeholder="? 0"
                required
                value={newItem.amount}
                onChange={(e) => setNewItem({ ...newItem, amount: e.target.value })}
                className="w-full px-3 py-2 border border-indigo-200 rounded-lg text-sm bg-white font-bold focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {newItem.category === "Custom..." && (
            <div className="animate-in fade-in slide-in-from-top-2">
               <label className="block text-[10px] font-bold text-indigo-800 uppercase tracking-wider mb-1">New Category Name</label>
               <input 
                 type="text" 
                 placeholder="e.g. Snacks" 
                 required 
                 value={newItem.customCategory}
                 onChange={(e) => setNewItem({ ...newItem, customCategory: e.target.value })}
                 className="w-full px-3 py-2 border border-indigo-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500"
               />
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 mt-1">
            <div className="sm:col-span-4">
              <label className="block text-[10px] font-bold text-indigo-800 uppercase tracking-wider mb-1">Billing Cycle</label>
              <select
                value={newItem.cycle}
                onChange={(e) => setNewItem({ ...newItem, cycle: e.target.value })}
                className="w-full px-3 py-2 border border-indigo-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500"
              >
                <option value="1">Every 1 Month</option>
                <option value="2">Every 2 Months</option>
                <option value="3">Every 3 Months</option>
                <option value="6">Every 6 Months</option>
                <option value="12">Every 1 Year</option>
              </select>
            </div>

            <div className="sm:col-span-5">
              <label className="block text-[10px] font-bold text-indigo-800 uppercase tracking-wider mb-1">Starting / Next Due Date</label>
              <input
                type="date"
                required
                value={newItem.nextDueDate}
                onChange={(e) => setNewItem({ ...newItem, nextDueDate: e.target.value })}
                className="w-full px-3 py-2 border border-indigo-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="sm:col-span-3 flex items-end">
              <Button type="submit" disabled={isSaving} className="bg-indigo-600 hover:bg-indigo-700 text-white w-full">
                <Plus size={16} className="mr-1" /> Add
              </Button>
            </div>
          </div>
        </form>

        <div className="flex-1 overflow-y-auto min-h-0 border border-gray-200 rounded-xl bg-gray-50/50">
          {loading ? (
            <div className="flex items-center justify-center h-full text-gray-400 text-sm">Loading...</div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 text-sm p-6 text-center">
              No fixed expenses added yet.
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {items.map(item => {
                const dueStr = item.nextDueDate || getTodayStr();
                const isOverdue = new Date(dueStr) < new Date(getTodayStr());
                const isDueToday = dueStr === getTodayStr();
                const cycleText = item.cycle > 1 ? " / " + item.cycle + "mo" : "/mo";
                
                return (
                  <li key={item.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white hover:bg-slate-50 transition-colors">
                    <div>
                      <h4 className="font-bold text-gray-900 text-sm">{item.name}</h4>
                      <div className="flex flex-wrap items-center gap-2 mt-1.5">
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                          {item.category}
                        </span>
                        
                        <span className={"inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md border " + (isOverdue ? "bg-rose-50 text-rose-700 border-rose-200" : isDueToday ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-gray-50 text-gray-600 border-gray-200")}>
                          <CalendarClock size={12} />
                          Due: {formatDate(dueStr)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-3">
                      <span className="font-extrabold text-red-600 text-sm">
                        {formatCurrency(item.amount)}<span className="text-xs text-red-400">{cycleText}</span>
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleRecordAndRenew(item)}
                          disabled={processingId === item.id}
                          className={"flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors " + (processingId === item.id ? "bg-gray-100 text-gray-400" : "bg-green-100 text-green-700 hover:bg-green-200 hover:text-green-800")}
                          title="Record this expense and auto-forward the due date"
                        >
                          {processingId === item.id ? <CheckCircle2 size={14} className="animate-pulse" /> : <PlayCircle size={14} />}
                          Pay & Renew
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="p-1.5 text-rose-500 hover:bg-rose-100 rounded-lg transition-colors"
                          title="Remove"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
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
