import React, { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import Button from '../components/common/Button';
import ConfirmDialog from '../components/common/ConfirmDialog';
import PlanForm from '../components/memberships/PlanForm';
import PlanList from '../components/memberships/PlanList';
import { Plus, Loader2 } from 'lucide-react';
import { COLLECTIONS } from '../utils/constants';
import {
  fetchCollectionData,
  createDocument,
  updateDocument,
  removeDocument,
} from '../firebase/storageService';

export default function Memberships() {
  const [plans, setPlans] = useState([]);
  const [students, setStudents] = useState([]);
  const [studentCounts, setStudentCounts] = useState({});
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [deleteData, setDeleteData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [plansData, studentsData] = await Promise.all([
        fetchCollectionData(COLLECTIONS.MEMBERSHIP_PLANS),
        fetchCollectionData(COLLECTIONS.STUDENTS),
      ]);
      setPlans(plansData);
      setStudents(studentsData);

      const counts = {};
      studentsData.forEach((student) => {
        const pId = student.membershipPlanId || student.planId;
        if (pId) {
          counts[pId] = (counts[pId] || 0) + 1;
        }
      });
      setStudentCounts(counts);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAdd = () => {
    setEditData(null);
    setIsFormOpen(true);
  };

  const handleEdit = (plan) => {
    setEditData(plan);
    setIsFormOpen(true);
  };

  const handleDeleteClick = (plan) => {
    setDeleteData(plan);
  };

  const handleToggle = async (plan) => {
    await updateDocument(COLLECTIONS.MEMBERSHIP_PLANS, plan.id, { isActive: !plan.isActive });
    fetchData();
  };

  const handleFormSubmit = async (data) => {
    if (editData) {
      await updateDocument(COLLECTIONS.MEMBERSHIP_PLANS, editData.id, data);
    } else {
      await createDocument(COLLECTIONS.MEMBERSHIP_PLANS, data);
    }
    setIsFormOpen(false);
    fetchData();
  };

  const confirmDelete = async () => {
    if (deleteData) {
      await removeDocument(COLLECTIONS.MEMBERSHIP_PLANS, deleteData.id);
      setDeleteData(null);
      fetchData();
    }
  };

  if (loading) {
    return (
      <Layout title="Membership Plans">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Membership Plans">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Membership Plans & Offers</h1>
            <p className="text-gray-500 text-sm mt-0.5">Manage pricing tiers, multi-month offers, and shift plans</p>
          </div>
          <Button icon={<Plus className="w-4 h-4" />} onClick={handleAdd}>
            Add Membership Plan
          </Button>
        </div>

        <PlanList
          plans={plans}
          studentCounts={studentCounts}
          onEdit={handleEdit}
          onDelete={handleDeleteClick}
          onToggle={handleToggle}
        />
      </div>

      <PlanForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleFormSubmit}
        editData={editData}
      />

      <ConfirmDialog
        isOpen={!!deleteData}
        title="Delete Plan"
        message={`Are you sure you want to delete the plan "${deleteData?.name}"?`}
        onConfirm={confirmDelete}
        onClose={() => setDeleteData(null)}
        variant="danger"
      />
    </Layout>
  );
}
