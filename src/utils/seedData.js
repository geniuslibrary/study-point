import {
  writeBatch,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { COLLECTIONS, SEAT_STATUS, STUDENT_STATUS } from './constants';
import {
  setLocalCollection,
  clearAllDatabaseData,
  getActiveTenantId,
  getFirestoreDocRef,
  setTenantItem,
} from '../firebase/storageService';

export const clearSampleData = async () => {
  return await clearAllDatabaseData();
};

/**
 * Generates 1 full year (12 months) of realistic dummy data:
 * - 3 Sections / Reading Halls (50 seats)
 * - 50 Seats with realistic occupancy and reservations
 * - 7 Membership Plans (including 10 Days, 15 Days, Full Day, Half Day, 3 Mo, 6 Mo)
 * - 3 Add-on Facilities (Locker, WiFi, Desk Light)
 * - 36 Students (24 currently active with seats, 12 past left students for realistic churn)
 * - 200+ Fees across all 12 months with paid receipts and current dues
 * - 80+ Expenses categorized over 12 months (Rent, Electricity, WiFi, RO, Cleaning, Supplies)
 * - 12 Visitors / Demo Inquiries
 * Scoped strictly to the active tenant ID so other libraries are never affected.
 */
export const seedOneYearDummyData = async () => {
  const tenantId = getActiveTenantId();
  const now = new Date();

  // 1. Build list of 12 months (from 11 months ago to current month)
  const past12Months = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const mStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    past12Months.push({
      date: d,
      monthStr: mStr,
      year: d.getFullYear(),
      monthIndex: d.getMonth(),
      offset: i, // 11 is oldest, 0 is current month
    });
  }

  // 2. Sections (3 Study Halls)
  const sections = [
    {
      id: 'sec_hall_1',
      name: 'Main Reading Hall (AC Silent Zone)',
      totalSeats: 20,
      description: 'Fully Air Conditioned with ergonomical chairs and power sockets',
      tenantId,
      createdAt: past12Months[0].date.toISOString(),
    },
    {
      id: 'sec_hall_2',
      name: 'Cabin & Focus Cubicles',
      totalSeats: 16,
      description: 'Individual wooden partitioned cubicles for deep focus study',
      tenantId,
      createdAt: past12Months[0].date.toISOString(),
    },
    {
      id: 'sec_hall_3',
      name: '1st Floor Regular Hall',
      totalSeats: 14,
      description: 'Airy study hall with natural sunlight and spacious tables',
      tenantId,
      createdAt: past12Months[0].date.toISOString(),
    },
  ];
  setLocalCollection(COLLECTIONS.SECTIONS, sections);

  // 3. Seats Generation (50 Total Seats)
  const allSeats = [];
  sections.forEach((sec) => {
    for (let i = 1; i <= sec.totalSeats; i++) {
      allSeats.push({
        id: `${sec.id}_seat_${i}`,
        sectionId: sec.id,
        seatNumber: i,
        status: SEAT_STATUS.AVAILABLE,
        studentId: null,
        studentName: null,
        shift: null,
        tenantId,
        createdAt: past12Months[0].date.toISOString(),
      });
    }
  });

  // 4. Membership Plans (Days & Monthly Plans)
  const plans = [
    {
      id: 'plan_10d_crash',
      name: '10 Days Exam Crash',
      durationDays: 10,
      durationUnit: 'days',
      price: 400,
      originalPrice: 500,
      shiftType: 'all',
      isOffer: false,
      isActive: true,
      tenantId,
    },
    {
      id: 'plan_15d_crash',
      name: '15 Days Intensive',
      durationDays: 15,
      durationUnit: 'days',
      price: 550,
      originalPrice: 700,
      shiftType: 'all',
      isOffer: false,
      isActive: true,
      tenantId,
    },
    {
      id: 'plan_1m_full',
      name: '1 Month Full Day',
      durationMonths: 1,
      durationUnit: 'months',
      price: 1000,
      originalPrice: 1000,
      shiftType: 'full_day',
      isOffer: false,
      isActive: true,
      tenantId,
    },
    {
      id: 'plan_1m_morn',
      name: '1 Month 1st Half (Morning)',
      durationMonths: 1,
      durationUnit: 'months',
      price: 600,
      originalPrice: 600,
      shiftType: 'morning',
      isOffer: false,
      isActive: true,
      tenantId,
    },
    {
      id: 'plan_1m_even',
      name: '1 Month 2nd Half (Evening)',
      durationMonths: 1,
      durationUnit: 'months',
      price: 600,
      originalPrice: 600,
      shiftType: 'evening',
      isOffer: false,
      isActive: true,
      tenantId,
    },
    {
      id: 'plan_3m_special',
      name: '3 Months Exam Special',
      durationMonths: 3,
      durationUnit: 'months',
      price: 2500,
      originalPrice: 3000,
      shiftType: 'all',
      isOffer: true,
      isActive: true,
      tenantId,
    },
    {
      id: 'plan_6m_vip',
      name: '6 Months Long-Term VIP',
      durationMonths: 6,
      durationUnit: 'months',
      price: 4500,
      originalPrice: 6000,
      shiftType: 'all',
      isOffer: true,
      isActive: true,
      tenantId,
    },
  ];
  setLocalCollection(COLLECTIONS.MEMBERSHIP_PLANS, plans);

  // 5. Add-on Facilities
  const addonPricing = [
    { id: 'addon_locker', name: 'Personal Locker', monthlyCharge: 200, isActive: true, tenantId },
    { id: 'addon_wifi', name: 'High-Speed WiFi Access', monthlyCharge: 100, isActive: true, tenantId },
    { id: 'addon_light', name: 'Personal Desk Lamp', monthlyCharge: 150, isActive: true, tenantId },
  ];
  setLocalCollection(COLLECTIONS.ADDON_PRICING, addonPricing);

  // 6. Student Pool Definition (36 Students: 24 active, 12 past left)
  const studentSpecs = [
    // --- Active Students (Assigned to Seats) ---
    { id: 'stu_1', name: 'Rahul Sharma', phone: '9829112233', sectionId: 'sec_hall_1', seatNum: 1, shift: 'full_day', shiftLabel: 'Full Day (6 AM - 11 PM)', planId: 'plan_1m_full', fee: 1000, addons: ['addon_locker'], startMonthOffset: 11, status: 'active' },
    { id: 'stu_2', name: 'Priya Verma', phone: '9829223344', sectionId: 'sec_hall_1', seatNum: 2, shift: 'full_day', shiftLabel: 'Full Day (6 AM - 11 PM)', planId: 'plan_1m_full', fee: 1000, addons: ['addon_wifi'], startMonthOffset: 11, status: 'active' },
    { id: 'stu_3', name: 'Amit Patel', phone: '9829334455', sectionId: 'sec_hall_1', seatNum: 3, shift: 'morning', shiftLabel: '1st Shift (6 AM - 2 PM)', planId: 'plan_1m_morn', fee: 600, addons: [], startMonthOffset: 10, status: 'active' },
    { id: 'stu_4', name: 'Neha Singh', phone: '9829445566', sectionId: 'sec_hall_1', seatNum: 4, shift: 'evening', shiftLabel: '2nd Shift (2 PM - 10 PM)', planId: 'plan_1m_even', fee: 600, addons: [], startMonthOffset: 10, status: 'active' },
    { id: 'stu_5', name: 'Vikram Rathore', phone: '9829556677', sectionId: 'sec_hall_1', seatNum: 5, shift: 'full_day', shiftLabel: 'Full Day (6 AM - 11 PM)', planId: 'plan_3m_special', fee: 850, addons: [], startMonthOffset: 9, status: 'active' },
    { id: 'stu_6', name: 'Ananya Gupta', phone: '9829667788', sectionId: 'sec_hall_1', seatNum: 6, shift: 'full_day', shiftLabel: 'Full Day (6 AM - 11 PM)', planId: 'plan_6m_vip', fee: 750, addons: ['addon_locker'], startMonthOffset: 9, status: 'active' },
    { id: 'stu_7', name: 'Deepak Yadav', phone: '9829778899', sectionId: 'sec_hall_1', seatNum: 7, shift: 'morning', shiftLabel: '1st Shift (6 AM - 2 PM)', planId: 'plan_1m_morn', fee: 600, addons: [], startMonthOffset: 8, status: 'active' },
    { id: 'stu_8', name: 'Pooja Joshi', phone: '9829889900', sectionId: 'sec_hall_1', seatNum: 8, shift: 'full_day', shiftLabel: 'Full Day (6 AM - 11 PM)', planId: 'plan_1m_full', fee: 1000, addons: [], startMonthOffset: 8, status: 'active' },
    { id: 'stu_9', name: 'Rohit Meena', phone: '9811112233', sectionId: 'sec_hall_2', seatNum: 1, shift: 'full_day', shiftLabel: 'Full Day (6 AM - 11 PM)', planId: 'plan_1m_full', fee: 1000, addons: [], startMonthOffset: 7, status: 'active' },
    { id: 'stu_10', name: 'Sneha Tiwari', phone: '9811223344', sectionId: 'sec_hall_2', seatNum: 2, shift: 'morning', shiftLabel: '1st Shift (6 AM - 2 PM)', planId: 'plan_1m_morn', fee: 600, addons: [], startMonthOffset: 7, status: 'active' },
    { id: 'stu_11', name: 'Manish Choudhary', phone: '9811334455', sectionId: 'sec_hall_2', seatNum: 3, shift: 'full_day', shiftLabel: 'Full Day (6 AM - 11 PM)', planId: 'plan_1m_full', fee: 1000, addons: ['addon_locker'], startMonthOffset: 6, status: 'active' },
    { id: 'stu_12', name: 'Ritu Saini', phone: '9811445566', sectionId: 'sec_hall_2', seatNum: 4, shift: 'evening', shiftLabel: '2nd Shift (2 PM - 10 PM)', planId: 'plan_1m_even', fee: 600, addons: [], startMonthOffset: 6, status: 'active' },
    { id: 'stu_13', name: 'Gaurav Mishra', phone: '9811556677', sectionId: 'sec_hall_2', seatNum: 5, shift: 'full_day', shiftLabel: 'Full Day (6 AM - 11 PM)', planId: 'plan_3m_special', fee: 850, addons: [], startMonthOffset: 5, status: 'active' },
    { id: 'stu_14', name: 'Simran Kaur', phone: '9811667788', sectionId: 'sec_hall_2', seatNum: 6, shift: 'full_day', shiftLabel: 'Full Day (6 AM - 11 PM)', planId: 'plan_1m_full', fee: 1000, addons: ['addon_wifi'], startMonthOffset: 5, status: 'active' },
    { id: 'stu_15', name: 'Ajay Kumar', phone: '9811778899', sectionId: 'sec_hall_3', seatNum: 1, shift: 'full_day', shiftLabel: 'Full Day (6 AM - 11 PM)', planId: 'plan_1m_full', fee: 1000, addons: [], startMonthOffset: 4, status: 'active' },
    { id: 'stu_16', name: 'Swati Jain', phone: '9811889900', sectionId: 'sec_hall_3', seatNum: 2, shift: 'morning', shiftLabel: '1st Shift (6 AM - 2 PM)', planId: 'plan_1m_morn', fee: 600, addons: [], startMonthOffset: 4, status: 'active' },
    { id: 'stu_17', name: 'Ravi Shankar', phone: '9877112233', sectionId: 'sec_hall_3', seatNum: 3, shift: 'full_day', shiftLabel: 'Full Day (6 AM - 11 PM)', planId: 'plan_1m_full', fee: 1000, addons: [], startMonthOffset: 3, status: 'active' },
    { id: 'stu_18', name: 'Nisha Solanki', phone: '9877223344', sectionId: 'sec_hall_3', seatNum: 4, shift: 'evening', shiftLabel: '2nd Shift (2 PM - 10 PM)', planId: 'plan_1m_even', fee: 600, addons: [], startMonthOffset: 3, status: 'active' },
    { id: 'stu_19', name: 'Sachin Rajput', phone: '9877334455', sectionId: 'sec_hall_3', seatNum: 5, shift: 'full_day', shiftLabel: 'Full Day (6 AM - 11 PM)', planId: 'plan_1m_full', fee: 1000, addons: [], startMonthOffset: 2, status: 'active' },
    { id: 'stu_20', name: 'Kavita Meena', phone: '9877445566', sectionId: 'sec_hall_3', seatNum: 6, shift: 'morning', shiftLabel: '1st Shift (6 AM - 2 PM)', planId: 'plan_1m_morn', fee: 600, addons: [], startMonthOffset: 2, status: 'active' },
    { id: 'stu_21', name: 'Manoj Bansal', phone: '9877556677', sectionId: 'sec_hall_1', seatNum: 9, shift: 'full_day', shiftLabel: 'Full Day (6 AM - 11 PM)', planId: 'plan_1m_full', fee: 1000, addons: [], startMonthOffset: 1, status: 'active' },
    { id: 'stu_22', name: 'Divya Chauhan', phone: '9877667788', sectionId: 'sec_hall_1', seatNum: 10, shift: 'full_day', shiftLabel: 'Full Day (6 AM - 11 PM)', planId: 'plan_10d_crash', fee: 400, addons: [], startMonthOffset: 0, status: 'active', isDayCrash: true, crashDays: 10, expireInDays: 2 },
    { id: 'stu_23', name: 'Sandeep Bishnoi', phone: '9877778899', sectionId: 'sec_hall_2', seatNum: 7, shift: 'full_day', shiftLabel: 'Full Day (6 AM - 11 PM)', planId: 'plan_15d_crash', fee: 550, addons: [], startMonthOffset: 0, status: 'active', isDayCrash: true, crashDays: 15, expireInDays: 9 },
    { id: 'stu_24', name: 'Archana Dubey', phone: '9877889900', sectionId: 'sec_hall_3', seatNum: 7, shift: 'morning', shiftLabel: '1st Shift (6 AM - 2 PM)', planId: 'plan_1m_morn', fee: 600, addons: [], startMonthOffset: 0, status: 'active' },

    // --- Past Students (Left / Inactive - Realistic historical churn) ---
    { id: 'stu_25', name: 'Pankaj Soni', phone: '9899112233', sectionId: 'sec_hall_1', seatNum: 11, shift: 'full_day', shiftLabel: 'Full Day', planId: 'plan_1m_full', fee: 1000, addons: [], startMonthOffset: 11, endMonthOffset: 8, status: 'left' },
    { id: 'stu_26', name: 'Monika Agarwal', phone: '9899223344', sectionId: 'sec_hall_1', seatNum: 12, shift: 'morning', shiftLabel: '1st Shift', planId: 'plan_1m_morn', fee: 600, addons: [], startMonthOffset: 11, endMonthOffset: 7, status: 'left' },
    { id: 'stu_27', name: 'Harsh Vardhan', phone: '9899334455', sectionId: 'sec_hall_2', seatNum: 8, shift: 'full_day', shiftLabel: 'Full Day', planId: 'plan_3m_special', fee: 850, addons: [], startMonthOffset: 10, endMonthOffset: 6, status: 'left' },
    { id: 'stu_28', name: 'Sonam Kumari', phone: '9899445566', sectionId: 'sec_hall_2', seatNum: 9, shift: 'evening', shiftLabel: '2nd Shift', planId: 'plan_1m_even', fee: 600, addons: [], startMonthOffset: 9, endMonthOffset: 5, status: 'left' },
    { id: 'stu_29', name: 'Ashish Tyagi', phone: '9899556677', sectionId: 'sec_hall_3', seatNum: 8, shift: 'full_day', shiftLabel: 'Full Day', planId: 'plan_1m_full', fee: 1000, addons: [], startMonthOffset: 8, endMonthOffset: 4, status: 'left' },
    { id: 'stu_30', name: 'Preeti Jangid', phone: '9899667788', sectionId: 'sec_hall_3', seatNum: 9, shift: 'morning', shiftLabel: '1st Shift', planId: 'plan_1m_morn', fee: 600, addons: [], startMonthOffset: 7, endMonthOffset: 3, status: 'left' },
    { id: 'stu_31', name: 'Mohit Saxena', phone: '9899778899', sectionId: 'sec_hall_1', seatNum: 13, shift: 'full_day', shiftLabel: 'Full Day', planId: 'plan_1m_full', fee: 1000, addons: [], startMonthOffset: 6, endMonthOffset: 2, status: 'left' },
    { id: 'stu_32', name: 'Aarti Rawat', phone: '9899889900', sectionId: 'sec_hall_2', seatNum: 10, shift: 'evening', shiftLabel: '2nd Shift', planId: 'plan_1m_even', fee: 600, addons: [], startMonthOffset: 5, endMonthOffset: 1, status: 'left' },
    { id: 'stu_33', name: 'Varun Tripathy', phone: '9766112233', sectionId: 'sec_hall_3', seatNum: 10, shift: 'full_day', shiftLabel: 'Full Day', planId: 'plan_1m_full', fee: 1000, addons: [], startMonthOffset: 4, endMonthOffset: 1, status: 'left' },
    { id: 'stu_34', name: 'Payal Saini', phone: '9766223344', sectionId: 'sec_hall_1', seatNum: 14, shift: 'morning', shiftLabel: '1st Shift', planId: 'plan_1m_morn', fee: 600, addons: [], startMonthOffset: 3, endMonthOffset: 0, status: 'left' },
    { id: 'stu_35', name: 'Devendra Bhati', phone: '9766334455', sectionId: 'sec_hall_2', seatNum: 11, shift: 'full_day', shiftLabel: 'Full Day', planId: 'plan_1m_full', fee: 1000, addons: [], startMonthOffset: 10, endMonthOffset: 9, status: 'left' },
    { id: 'stu_36', name: 'Komal Sharma', phone: '9766445566', sectionId: 'sec_hall_3', seatNum: 11, shift: 'morning', shiftLabel: '1st Shift', planId: 'plan_1m_morn', fee: 600, addons: [], startMonthOffset: 8, endMonthOffset: 7, status: 'left' },
  ];

  const studentsData = [];
  studentSpecs.forEach((spec) => {
    const startM = past12Months[11 - spec.startMonthOffset];
    const joinDateObj = new Date(startM.year, startM.monthIndex, 2 + (parseInt(spec.id.split('_')[1], 10) % 20));
    
    let validityStart = `${joinDateObj.getFullYear()}-${String(joinDateObj.getMonth() + 1).padStart(2, '0')}-01`;
    let validityEnd = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-28`;

    if (spec.isDayCrash) {
      const expDate = new Date(now.getTime() + (spec.expireInDays || 2) * 24 * 60 * 60 * 1000);
      const startCrashDate = new Date(expDate.getTime() - spec.crashDays * 24 * 60 * 60 * 1000);
      validityStart = startCrashDate.toISOString().split('T')[0];
      validityEnd = expDate.toISOString().split('T')[0];
    } else if (spec.status === 'left') {
      const endM = past12Months[11 - (spec.endMonthOffset || 1)];
      validityEnd = `${endM.year}-${String(endM.monthIndex + 1).padStart(2, '0')}-28`;
    }

    const assignedSeatId = spec.status === 'active' ? `${spec.sectionId}_seat_${spec.seatNum}` : null;

    const stuRecord = {
      id: spec.id,
      name: spec.name,
      phone: spec.phone,
      email: `${spec.name.toLowerCase().replace(/\s+/g, '')}@gmail.com`,
      sectionId: spec.sectionId,
      seatId: assignedSeatId,
      seatNumber: spec.status === 'active' ? spec.seatNum : null,
      shift: spec.shift,
      shiftTiming: spec.shiftLabel,
      membershipPlanId: spec.planId,
      planName: plans.find((p) => p.id === spec.planId)?.name || 'Monthly',
      monthlyFee: spec.fee,
      totalFee: spec.fee,
      balanceDue: 0,
      assignedAddons: spec.addons,
      joinDate: joinDateObj.toISOString(),
      validityStart,
      validityEnd,
      status: spec.status === 'active' ? STUDENT_STATUS.ACTIVE : STUDENT_STATUS.LEFT,
      tenantId,
      createdAt: joinDateObj.toISOString(),
      updatedAt: now.toISOString(),
    };
    studentsData.push(stuRecord);

    // Update Seat Status if active
    if (spec.status === 'active') {
      const seatIdx = allSeats.findIndex((s) => s.id === assignedSeatId);
      if (seatIdx >= 0) {
        allSeats[seatIdx].status = SEAT_STATUS.OCCUPIED;
        allSeats[seatIdx].studentId = stuRecord.id;
        allSeats[seatIdx].studentName = stuRecord.name;
        allSeats[seatIdx].shift = spec.shift;
      }
    }
  });

  // Reserve 2 random available seats for demo
  const availableSeats = allSeats.filter((s) => s.status === SEAT_STATUS.AVAILABLE);
  if (availableSeats.length >= 2) {
    availableSeats[0].status = SEAT_STATUS.RESERVED;
    availableSeats[1].status = SEAT_STATUS.RESERVED;
  }

  setLocalCollection(COLLECTIONS.STUDENTS, studentsData);
  setLocalCollection(COLLECTIONS.SEATS, allSeats);

  // 7. Fees Generation (Across 12 Full Months)
  const feesData = [];
  let feeCounter = 1000;

  past12Months.forEach((m) => {
    // Determine which students were enrolled during this month
    const enrolledStudents = studentSpecs.filter((spec) => {
      const started = spec.startMonthOffset >= m.offset;
      const notLeftYet = spec.status === 'active' || (spec.endMonthOffset !== undefined && spec.endMonthOffset <= m.offset);
      return started && notLeftYet;
    });

    enrolledStudents.forEach((spec, idx) => {
      feeCounter++;
      const isCurrentMonth = m.offset === 0;
      // In current month, make 2 students have dues for Pending Dues alert testing
      const isDue = isCurrentMonth && (spec.id === 'stu_7' || spec.id === 'stu_16');
      
      const paymentDay = Math.min(26, 2 + ((idx * 3) % 22));
      const payDate = new Date(m.year, m.monthIndex, paymentDay, 11, 30, 0);
      const receiptNo = `REC-${m.year}${String(m.monthIndex + 1).padStart(2, '0')}-${String(feeCounter).slice(-4)}`;
      const pMode = idx % 3 === 0 ? 'upi' : idx % 3 === 1 ? 'cash' : 'online';

      const feeItem = {
        id: `fee_${m.monthStr}_${spec.id}`,
        studentId: spec.id,
        studentName: spec.name,
        studentPhone: spec.phone,
        amount: spec.fee,
        baseFee: spec.fee,
        discountAmount: 0,
        finalAmount: spec.fee,
        paymentMode: isDue ? '' : pMode,
        paymentDate: isDue ? null : payDate.toISOString(),
        date: isDue ? `${m.year}-${String(m.monthIndex + 1).padStart(2, '0')}-10` : `${m.year}-${String(m.monthIndex + 1).padStart(2, '0')}-${String(paymentDay).padStart(2, '0')}`,
        month: m.monthStr,
        status: isDue ? 'due' : 'paid',
        planId: spec.planId,
        planName: plans.find((p) => p.id === spec.planId)?.name || 'Monthly',
        receiptNumber: isDue ? '' : receiptNo,
        validityStart: `${m.year}-${String(m.monthIndex + 1).padStart(2, '0')}-01`,
        validityEnd: `${m.year}-${String(m.monthIndex + 1).padStart(2, '0')}-28`,
        notes: isDue ? 'Pending monthly renewal fee' : `${pMode.toUpperCase()} Payment Verified`,
        tenantId,
        createdAt: payDate.toISOString(),
      };
      feesData.push(feeItem);
    });
  });

  setLocalCollection(COLLECTIONS.FEES, feesData);

  // 8. Expenses Generation (Across 12 Full Months)
  const expensesData = [];
  let expCounter = 500;

  past12Months.forEach((m) => {
    // Summer months have higher electricity bills
    const isSummer = m.monthIndex >= 3 && m.monthIndex <= 8;
    const electricAmt = isSummer ? 5800 + (m.monthIndex * 150) : 3400 + (m.monthIndex * 100);

    const monthlyExpItems = [
      {
        category: 'Room Rent & Maintenance',
        amount: 14000,
        day: 1,
        desc: 'Monthly Library Building Premises Rent',
        mode: 'bank_transfer',
      },
      {
        category: 'Electricity Bill',
        amount: electricAmt,
        day: 7,
        desc: `Commercial electricity bill (${isSummer ? 'High AC usage' : 'Normal usage'})`,
        mode: 'upi',
      },
      {
        category: 'High-Speed Internet / WiFi',
        amount: 1299,
        day: 5,
        desc: 'Airtel Optical Fiber 200 Mbps unlimited plan',
        mode: 'upi',
      },
      {
        category: 'RO Water & Dispenser',
        amount: 850 + (m.monthIndex % 4) * 50,
        day: 10,
        desc: '20L Cold Drinking Water Cans delivery & dispenser filter',
        mode: 'cash',
      },
      {
        category: 'Cleaning & Sanitation',
        amount: 800,
        day: 15,
        desc: 'Sweeping, phenyl, room freshener & dustbins cleaning',
        mode: 'cash',
      },
      {
        category: 'Newspaper & Magazines',
        amount: 520,
        day: 3,
        desc: 'The Hindu, Dainik Bhaskar, Pratiyogita Darpan & Chronicle',
        mode: 'cash',
      },
    ];

    // Every 3 months add maintenance/repair
    if (m.monthIndex % 3 === 0) {
      monthlyExpItems.push({
        category: 'Maintenance & Repairs',
        amount: 1800,
        day: 18,
        desc: 'AC gas servicing, LED bulb replacement and chair cushion fixing',
        mode: 'cash',
      });
    }

    monthlyExpItems.forEach((exp) => {
      expCounter++;
      const expDate = new Date(m.year, m.monthIndex, exp.day, 14, 0, 0);
      expensesData.push({
        id: `exp_${m.monthStr}_${expCounter}`,
        category: exp.category,
        amount: exp.amount,
        date: expDate.toISOString(),
        month: m.monthStr,
        description: exp.desc,
        paymentMode: exp.mode,
        tenantId,
        createdAt: expDate.toISOString(),
      });
    });
  });

  setLocalCollection(COLLECTIONS.EXPENSES, expensesData);

  // 9. Visitors / Inquiries (12 Demo Inquiries across recent months)
  const visitorsData = [
    { id: 'vis_1', name: 'Amit Kumar', phone: '9822114455', visitDate: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-02`, purpose: 'UPSC Preparation - Needs Quiet Corner', status: 'admitted', interestedShift: 'full_day', notes: 'Enrolled in Hall 1', tenantId },
    { id: 'vis_2', name: 'Sunita Sharma', phone: '9822225566', visitDate: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-03`, purpose: 'SSC CGL Exam practice', status: 'demo_active', interestedShift: 'morning', notes: 'Taking 2-day free demo', tenantId },
    { id: 'vis_3', name: 'Pankaj Meena', phone: '9822336677', visitDate: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-04`, purpose: 'Banking PO Exam preparation', status: 'follow_up', interestedShift: 'evening', notes: 'Will join from next Monday', tenantId },
    { id: 'vis_4', name: 'Rajesh Verma', phone: '9822447788', visitDate: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-05`, purpose: 'State PCS Preparation', status: 'admitted', interestedShift: 'full_day', notes: 'Took 3 months plan', tenantId },
    { id: 'vis_5', name: 'Pooja Choudhary', phone: '9822558899', visitDate: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-06`, purpose: 'NEET Dropper Study', status: 'demo_active', interestedShift: 'full_day', notes: 'Sitting on Seat 14 demo', tenantId },
    { id: 'vis_6', name: 'Manish Gurjar', phone: '9822669900', visitDate: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-07`, purpose: 'Railway NTPC Exam', status: 'follow_up', interestedShift: 'morning', notes: 'Enquired about locker facility', tenantId },
  ];
  setLocalCollection(COLLECTIONS.VISITORS, visitorsData);

  // 10. Update Library Info in LocalStorage
  setTenantItem('library_name', 'Royal Study Point & Library');
  setTenantItem('library_phone', '9876543210');

  // 11. Concurrently Push to Cloud Firestore (Tenant-Scoped) using writeBatch
  try {
    const allOps = [
      ...sections.map((s) => ({ ref: getFirestoreDocRef(COLLECTIONS.SECTIONS, s.id, tenantId), data: s })),
      ...plans.map((p) => ({ ref: getFirestoreDocRef(COLLECTIONS.MEMBERSHIP_PLANS, p.id, tenantId), data: p })),
      ...addonPricing.map((a) => ({ ref: getFirestoreDocRef(COLLECTIONS.ADDON_PRICING, a.id, tenantId), data: a })),
      ...allSeats.map((st) => ({ ref: getFirestoreDocRef(COLLECTIONS.SEATS, st.id, tenantId), data: st })),
      ...studentsData.map((stu) => ({ ref: getFirestoreDocRef(COLLECTIONS.STUDENTS, stu.id, tenantId), data: stu })),
      ...feesData.map((f) => ({ ref: getFirestoreDocRef(COLLECTIONS.FEES, f.id, tenantId), data: f })),
      ...expensesData.map((e) => ({ ref: getFirestoreDocRef(COLLECTIONS.EXPENSES, e.id, tenantId), data: e })),
      ...visitorsData.map((v) => ({ ref: getFirestoreDocRef(COLLECTIONS.VISITORS, v.id, tenantId), data: v })),
    ];

    const chunkSize = 200;
    for (let i = 0; i < allOps.length; i += chunkSize) {
      const chunk = allOps.slice(i, i + chunkSize);
      const batch = writeBatch(db);
      chunk.forEach((op) => {
        batch.set(op.ref, op.data, { merge: true });
      });
      await batch.commit();
    }
  } catch (err) {
    console.warn('Firestore writeBatch sync error during dummy data seed:', err);
  }

  return {
    success: true,
    totalMonths: 12,
    totalStudents: studentsData.length,
    totalSeats: allSeats.length,
    totalFees: feesData.length,
    totalExpenses: expensesData.length,
    message: '1 Full Year (12 Months) Dummy Data loaded successfully!',
  };
};

export const seedSampleData = seedOneYearDummyData;
