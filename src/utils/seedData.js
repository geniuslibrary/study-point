import {
  collection,
  doc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { COLLECTIONS, SEAT_STATUS, STUDENT_STATUS } from './constants';
import { setLocalCollection, clearAllDatabaseData } from '../firebase/storageService';

export const clearSampleData = async () => {
  return await clearAllDatabaseData();
};

export const seedSampleData = async () => {
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  // 1. Settings & Study Point Profile
  const ownerProfileData = {
    studyPointName: 'Royal Study Point & Library',
    ownerName: 'Manish',
    phone: '9876543210',
    email: 'study@gmail.com',
    address: 'Near Metro Station, Main Road, Study Zone',
    updatedAt: now.toISOString(),
  };
  setLocalCollection(COLLECTIONS.SETTINGS, [ownerProfileData]);

  // 2. Add-on Pricing
  const addonPricing = [
    { id: 'addon_locker', name: 'Locker', monthlyCharge: 200, isActive: true },
    { id: 'addon_wifi', name: 'WiFi', monthlyCharge: 100, isActive: true },
    { id: 'addon_light', name: 'Desk Light', monthlyCharge: 150, isActive: true },
  ];
  setLocalCollection(COLLECTIONS.ADDON_PRICING, addonPricing);

  // 3. Membership Plans
  const plans = [
    {
      id: 'plan_1m_fullday',
      name: '1 Month Full Day',
      durationMonths: 1,
      price: 1000,
      originalPrice: 1000,
      shiftType: 'full_day',
      isOffer: false,
      isActive: true,
    },
    {
      id: 'plan_1m_halfday',
      name: '1 Month Half Day',
      durationMonths: 1,
      price: 600,
      originalPrice: 600,
      shiftType: 'half_day',
      isOffer: false,
      isActive: true,
    },
    {
      id: 'plan_3m_offer',
      name: '3 Months Mega Offer',
      durationMonths: 3,
      price: 1000,
      originalPrice: 1800,
      shiftType: 'all',
      isOffer: true,
      isActive: true,
    },
    {
      id: 'plan_6m_vip',
      name: '6 Months Long Term',
      durationMonths: 6,
      price: 2500,
      originalPrice: 3600,
      shiftType: 'all',
      isOffer: true,
      isActive: true,
    },
  ];
  setLocalCollection(COLLECTIONS.MEMBERSHIP_PLANS, plans);

  // 4. Sections & Seats
  const sections = [
    { id: 'sec_boys', name: 'Boys Section', totalSeats: 15, description: 'Dedicated section for male students' },
    { id: 'sec_girls', name: 'Girls Section', totalSeats: 12, description: 'Dedicated section for female students' },
    { id: 'sec_ac_hall', name: 'AC Quiet Hall (Common)', totalSeats: 12, description: 'Air Conditioned Silent Reading Hall' },
  ];
  setLocalCollection(COLLECTIONS.SECTIONS, sections);

  const allSeats = [];
  for (const sec of sections) {
    for (let i = 1; i <= sec.totalSeats; i++) {
      const seatId = `${sec.id}_seat_${i}`;
      allSeats.push({
        id: seatId,
        sectionId: sec.id,
        seatNumber: i,
        status: SEAT_STATUS.AVAILABLE,
        studentId: null,
        addons: { locker: i % 3 === 1, wifi: true, light: i % 2 === 0 },
        createdAt: now.toISOString(),
      });
    }
  }

  // 5. Sample Students with Different Shifts
  const studentsData = [
    {
      id: 'stu_1',
      name: 'Rahul Kumar',
      phone: '9812345678',
      email: 'rahul.k@gmail.com',
      sectionId: 'sec_boys',
      seatId: 'sec_boys_seat_1',
      shift: 'full_day',
      shiftTiming: '6:00 AM - 11:00 PM (Full Day)',
      membershipPlanId: 'plan_1m_fullday',
      status: STUDENT_STATUS.ACTIVE,
      joinDate: now.toISOString(),
      membershipStart: now.toISOString(),
      membershipEnd: new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString(),
    },
    {
      id: 'stu_2',
      name: 'Amit Sharma',
      phone: '9823456789',
      email: 'amit.sharma@gmail.com',
      sectionId: 'sec_boys',
      seatId: 'sec_boys_seat_2',
      shift: 'first_half',
      shiftTiming: '6:00 AM - 2:00 PM (1st Half)',
      membershipPlanId: 'plan_1m_halfday',
      status: STUDENT_STATUS.ACTIVE,
      joinDate: now.toISOString(),
      membershipStart: now.toISOString(),
      membershipEnd: new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString(),
    },
    {
      id: 'stu_3',
      name: 'Vikram Singh',
      phone: '9834567890',
      email: 'vikram.singh@gmail.com',
      sectionId: 'sec_boys',
      seatId: 'sec_boys_seat_2',
      shift: 'second_half',
      shiftTiming: '2:00 PM - 11:00 PM (2nd Half)',
      membershipPlanId: 'plan_1m_halfday',
      status: STUDENT_STATUS.ACTIVE,
      joinDate: now.toISOString(),
      membershipStart: now.toISOString(),
      membershipEnd: new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString(),
    },
    {
      id: 'stu_4',
      name: 'Priya Sharma',
      phone: '9845678901',
      email: 'priya.sharma@gmail.com',
      sectionId: 'sec_girls',
      seatId: 'sec_girls_seat_1',
      shift: 'full_day',
      shiftTiming: '6:00 AM - 11:00 PM (Full Day)',
      membershipPlanId: 'plan_3m_offer',
      status: STUDENT_STATUS.ACTIVE,
      joinDate: now.toISOString(),
      membershipStart: now.toISOString(),
      membershipEnd: new Date(now.getFullYear(), now.getMonth() + 3, 1).toISOString(),
    },
    {
      id: 'stu_5',
      name: 'Anjali Verma',
      phone: '9856789012',
      email: 'anjali.v@gmail.com',
      sectionId: 'sec_girls',
      seatId: 'sec_girls_seat_2',
      shift: 'first_half',
      shiftTiming: '6:00 AM - 2:00 PM (1st Half)',
      membershipPlanId: 'plan_1m_halfday',
      status: STUDENT_STATUS.ACTIVE,
      joinDate: now.toISOString(),
      membershipStart: now.toISOString(),
      membershipEnd: new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString(),
    },
    {
      id: 'stu_6',
      name: 'Sneha Patel',
      phone: '9867890123',
      email: 'sneha.p@gmail.com',
      sectionId: 'sec_girls',
      seatId: 'sec_girls_seat_2',
      shift: 'second_half',
      shiftTiming: '2:00 PM - 11:00 PM (2nd Half)',
      membershipPlanId: 'plan_1m_halfday',
      status: STUDENT_STATUS.ACTIVE,
      joinDate: now.toISOString(),
      membershipStart: now.toISOString(),
      membershipEnd: new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString(),
    },
    {
      id: 'stu_7',
      name: 'Rohit Meena',
      phone: '9878901234',
      email: 'rohit.m@gmail.com',
      sectionId: 'sec_ac_hall',
      seatId: 'sec_ac_hall_seat_1',
      shift: 'full_day',
      shiftTiming: '6:00 AM - 11:00 PM (Full Day)',
      membershipPlanId: 'plan_3m_offer',
      status: STUDENT_STATUS.ACTIVE,
      joinDate: now.toISOString(),
      membershipStart: now.toISOString(),
      membershipEnd: new Date(now.getFullYear(), now.getMonth() + 3, 1).toISOString(),
    },
    {
      id: 'stu_8',
      name: 'Neha Gupta',
      phone: '9889012345',
      email: 'neha.g@gmail.com',
      sectionId: 'sec_ac_hall',
      seatId: 'sec_ac_hall_seat_2',
      shift: 'first_half',
      shiftTiming: '6:00 AM - 2:00 PM (1st Half)',
      membershipPlanId: 'plan_1m_halfday',
      status: STUDENT_STATUS.ACTIVE,
      joinDate: now.toISOString(),
      membershipStart: now.toISOString(),
      membershipEnd: new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString(),
    },
  ];
  setLocalCollection(COLLECTIONS.STUDENTS, studentsData);

  const seat1 = allSeats.find((s) => s.id === 'sec_boys_seat_1');
  if (seat1) { seat1.status = SEAT_STATUS.OCCUPIED; seat1.studentId = 'stu_1'; }

  const seat2 = allSeats.find((s) => s.id === 'sec_boys_seat_2');
  if (seat2) { seat2.status = SEAT_STATUS.OCCUPIED; seat2.studentId = 'stu_2'; }

  const seat3 = allSeats.find((s) => s.id === 'sec_girls_seat_1');
  if (seat3) { seat3.status = SEAT_STATUS.OCCUPIED; seat3.studentId = 'stu_4'; }

  const seat4 = allSeats.find((s) => s.id === 'sec_girls_seat_2');
  if (seat4) { seat4.status = SEAT_STATUS.OCCUPIED; seat4.studentId = 'stu_5'; }

  const seat5 = allSeats.find((s) => s.id === 'sec_ac_hall_seat_1');
  if (seat5) { seat5.status = SEAT_STATUS.OCCUPIED; seat5.studentId = 'stu_7'; }

  const seat6 = allSeats.find((s) => s.id === 'sec_ac_hall_seat_2');
  if (seat6) { seat6.status = SEAT_STATUS.PARTIALLY_OCCUPIED; seat6.studentId = 'stu_8'; }

  setLocalCollection(COLLECTIONS.SEATS, allSeats);

  // 6. Fees Records
  const feesData = [
    {
      id: `fee_${currentMonth}_stu1`,
      studentId: 'stu_1',
      amount: 1300,
      baseFee: 1000,
      addonCharges: { Locker: 200, WiFi: 100 },
      dueDate: new Date(now.getFullYear(), now.getMonth(), 10).toISOString(),
      paidDate: new Date(now.getFullYear(), now.getMonth(), 2).toISOString(),
      status: 'paid',
      paymentMode: 'upi',
      month: currentMonth,
      notes: 'Paid via GPay',
    },
    {
      id: `fee_${currentMonth}_stu2`,
      studentId: 'stu_2',
      amount: 700,
      baseFee: 600,
      addonCharges: { WiFi: 100 },
      dueDate: new Date(now.getFullYear(), now.getMonth(), 10).toISOString(),
      paidDate: new Date(now.getFullYear(), now.getMonth(), 3).toISOString(),
      status: 'paid',
      paymentMode: 'cash',
      month: currentMonth,
      notes: 'Cash received',
    },
    {
      id: `fee_${currentMonth}_stu3`,
      studentId: 'stu_3',
      amount: 800,
      baseFee: 600,
      addonCharges: { Locker: 200 },
      dueDate: new Date(now.getFullYear(), now.getMonth(), 10).toISOString(),
      paidDate: null,
      status: 'pending',
      paymentMode: '',
      month: currentMonth,
      notes: '',
    },
    {
      id: `fee_${currentMonth}_stu4`,
      studentId: 'stu_4',
      amount: 1350,
      baseFee: 1000,
      addonCharges: { Locker: 200, 'Desk Light': 150 },
      dueDate: new Date(now.getFullYear(), now.getMonth(), 10).toISOString(),
      paidDate: new Date(now.getFullYear(), now.getMonth(), 4).toISOString(),
      status: 'paid',
      paymentMode: 'upi',
      month: currentMonth,
      notes: 'PhonePe QR',
    },
    {
      id: `fee_${currentMonth}_stu5`,
      studentId: 'stu_5',
      amount: 600,
      baseFee: 600,
      addonCharges: {},
      dueDate: new Date(now.getFullYear(), now.getMonth(), 10).toISOString(),
      paidDate: null,
      status: 'pending',
      paymentMode: '',
      month: currentMonth,
      notes: '',
    },
    {
      id: `fee_${currentMonth}_stu7`,
      studentId: 'stu_7',
      amount: 1000,
      baseFee: 1000,
      addonCharges: {},
      dueDate: new Date(now.getFullYear(), now.getMonth(), 10).toISOString(),
      paidDate: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(),
      status: 'paid',
      paymentMode: 'bank',
      month: currentMonth,
      notes: 'Bank Transfer NetBanking',
    },
  ];
  setLocalCollection(COLLECTIONS.FEES, feesData);

  // 7. Monthly Expenses
  const expensesData = [
    {
      id: `exp_${currentMonth}_1`,
      category: 'Electricity',
      amount: 4500,
      date: new Date(now.getFullYear(), now.getMonth(), 5).toISOString(),
      description: 'Electricity bill (500 units @ ₹9/unit)',
      month: currentMonth,
    },
    {
      id: `exp_${currentMonth}_2`,
      category: 'Staff Salary',
      amount: 8000,
      date: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(),
      description: 'Caretaker & cleaning staff monthly salary',
      month: currentMonth,
    },
    {
      id: `exp_${currentMonth}_3`,
      category: 'Internet/WiFi',
      amount: 1200,
      date: new Date(now.getFullYear(), now.getMonth(), 7).toISOString(),
      description: 'Commercial optical fiber broadband',
      month: currentMonth,
    },
    {
      id: `exp_${currentMonth}_4`,
      category: 'Water & RO Dispenser',
      amount: 600,
      date: new Date(now.getFullYear(), now.getMonth(), 10).toISOString(),
      description: 'RO water dispenser cans & filter service',
      month: currentMonth,
    },
  ];
  setLocalCollection(COLLECTIONS.EXPENSES, expensesData);

  // Background Cloud Firestore sync (if enabled)
  try {
    const settingsRef = doc(db, COLLECTIONS.SETTINGS, 'ownerProfile');
    setDoc(settingsRef, {
      ...ownerProfileData,
      updatedAt: serverTimestamp(),
    }).catch(() => {});

    for (const addon of addonPricing) {
      setDoc(doc(db, COLLECTIONS.ADDON_PRICING, addon.id), addon).catch(() => {});
    }

    for (const plan of plans) {
      setDoc(doc(db, COLLECTIONS.MEMBERSHIP_PLANS, plan.id), plan).catch(() => {});
    }

    for (const sec of sections) {
      setDoc(doc(db, COLLECTIONS.SECTIONS, sec.id), {
        name: sec.name,
        totalSeats: sec.totalSeats,
        description: sec.description,
        createdAt: serverTimestamp(),
      }).catch(() => {});
    }

    for (const seat of allSeats) {
      setDoc(doc(db, COLLECTIONS.SEATS, seat.id), {
        ...seat,
        createdAt: serverTimestamp(),
      }).catch(() => {});
    }

    for (const stu of studentsData) {
      setDoc(doc(db, COLLECTIONS.STUDENTS, stu.id), {
        ...stu,
        createdAt: serverTimestamp(),
      }).catch(() => {});
    }

    for (const fee of feesData) {
      setDoc(doc(db, COLLECTIONS.FEES, fee.id), {
        ...fee,
        createdAt: serverTimestamp(),
      }).catch(() => {});
    }

    for (const exp of expensesData) {
      setDoc(doc(db, COLLECTIONS.EXPENSES, exp.id), {
        ...exp,
        createdAt: serverTimestamp(),
      }).catch(() => {});
    }
  } catch (cloudErr) {
    console.warn('Firestore cloud sync skipped (offline/local mode active)');
  }

  return { success: true, message: 'Sample demo data initialized!' };
};
