import {
  Venus,
  Mars,
  Users,
  BookOpen,
  Library,
  GraduationCap,
  Building2,
  Laptop,
  Wifi,
  Snowflake,
  Wind,
  Crown,
  Star,
  Sparkles,
  Armchair,
  Moon,
  Sun,
  Coffee,
} from 'lucide-react';

export const SECTION_ICONS = [
  {
    id: 'girls',
    label: 'Girls (गर्ल्स)',
    icon: Venus,
    color: 'text-rose-600',
    bg: 'bg-rose-50',
    border: 'border-rose-100',
    activeBg: 'bg-rose-600 text-white border-rose-600',
  },
  {
    id: 'boys',
    label: 'Boys (बॉयज़)',
    icon: Mars,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-100',
    activeBg: 'bg-blue-600 text-white border-blue-600',
  },
  {
    id: 'common',
    label: 'Common (कॉमन)',
    icon: Users,
    color: 'text-indigo-600',
    bg: 'bg-indigo-50',
    border: 'border-indigo-100',
    activeBg: 'bg-indigo-600 text-white border-indigo-600',
  },
  {
    id: 'book',
    label: 'Reading (पढ़ाई)',
    icon: BookOpen,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    border: 'border-amber-100',
    activeBg: 'bg-amber-600 text-white border-amber-600',
  },
  {
    id: 'library',
    label: 'Library (लाइब्रेरी)',
    icon: Library,
    color: 'text-indigo-600',
    bg: 'bg-indigo-50',
    border: 'border-indigo-100',
    activeBg: 'bg-indigo-600 text-white border-indigo-600',
  },
  {
    id: 'snowflake',
    label: 'AC Silent (एसी)',
    icon: Snowflake,
    color: 'text-cyan-600',
    bg: 'bg-cyan-50',
    border: 'border-cyan-100',
    activeBg: 'bg-cyan-600 text-white border-cyan-600',
  },
  {
    id: 'crown',
    label: 'VIP / Cabin (केबिन)',
    icon: Crown,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    border: 'border-amber-100',
    activeBg: 'bg-amber-600 text-white border-amber-600',
  },
  {
    id: 'graduation',
    label: 'Student (छात्र)',
    icon: GraduationCap,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    border: 'border-emerald-100',
    activeBg: 'bg-emerald-600 text-white border-emerald-600',
  },
  {
    id: 'sparkles',
    label: 'Silent Zone (शांत)',
    icon: Sparkles,
    color: 'text-purple-600',
    bg: 'bg-purple-50',
    border: 'border-purple-100',
    activeBg: 'bg-purple-600 text-white border-purple-600',
  },
  {
    id: 'armchair',
    label: 'Comfort (आरामदायक)',
    icon: Armchair,
    color: 'text-teal-600',
    bg: 'bg-teal-50',
    border: 'border-teal-100',
    activeBg: 'bg-teal-600 text-white border-teal-600',
  },
  {
    id: 'laptop',
    label: 'Laptop / PC (लैपटॉप)',
    icon: Laptop,
    color: 'text-slate-700',
    bg: 'bg-slate-100',
    border: 'border-slate-200',
    activeBg: 'bg-slate-800 text-white border-slate-800',
  },
  {
    id: 'building',
    label: 'Hall (हॉल)',
    icon: Building2,
    color: 'text-indigo-600',
    bg: 'bg-indigo-50',
    border: 'border-indigo-100',
    activeBg: 'bg-indigo-600 text-white border-indigo-600',
  },
  {
    id: 'wifi',
    label: 'WiFi (इंटरनेट)',
    icon: Wifi,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-100',
    activeBg: 'bg-blue-600 text-white border-blue-600',
  },
  {
    id: 'moon',
    label: 'Night Shift (रात)',
    icon: Moon,
    color: 'text-violet-600',
    bg: 'bg-violet-50',
    border: 'border-violet-100',
    activeBg: 'bg-violet-600 text-white border-violet-600',
  },
  {
    id: 'sun',
    label: 'Day Shift (दिन)',
    icon: Sun,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    border: 'border-amber-100',
    activeBg: 'bg-amber-600 text-white border-amber-600',
  },
  {
    id: 'coffee',
    label: 'Café (कैफे)',
    icon: Coffee,
    color: 'text-orange-600',
    bg: 'bg-orange-50',
    border: 'border-orange-100',
    activeBg: 'bg-orange-600 text-white border-orange-600',
  },
  {
    id: 'wind',
    label: 'Air Flow (हवादार)',
    icon: Wind,
    color: 'text-sky-600',
    bg: 'bg-sky-50',
    border: 'border-sky-100',
    activeBg: 'bg-sky-600 text-white border-sky-600',
  },
  {
    id: 'star',
    label: 'Special (खास)',
    icon: Star,
    color: 'text-amber-500',
    bg: 'bg-amber-50',
    border: 'border-amber-100',
    activeBg: 'bg-amber-500 text-white border-amber-500',
  },
];

export const getSectionIconConfig = (iconId, sectionName = '') => {
  if (iconId) {
    const found = SECTION_ICONS.find((item) => item.id === iconId);
    if (found) return found;
  }
  const lower = (sectionName || '').toLowerCase();
  if (lower.includes('girl') || lower.includes('female') || lower.includes('women') || lower.includes('mahila')) {
    return SECTION_ICONS.find((item) => item.id === 'girls');
  }
  if (lower.includes('boy') || lower.includes('male') || lower.includes('men') || lower.includes('purush')) {
    return SECTION_ICONS.find((item) => item.id === 'boys');
  }
  if (lower.includes('common') || lower.includes('joint') || lower.includes('combine') || lower.includes('coed')) {
    return SECTION_ICONS.find((item) => item.id === 'common');
  }
  if (lower.includes('read') || lower.includes('study') || lower.includes('book')) {
    return SECTION_ICONS.find((item) => item.id === 'book');
  }
  if (lower.includes('ac') || lower.includes('cool')) {
    return SECTION_ICONS.find((item) => item.id === 'snowflake');
  }
  if (lower.includes('vip') || lower.includes('cabin') || lower.includes('premium')) {
    return SECTION_ICONS.find((item) => item.id === 'crown');
  }
  if (lower.includes('night')) {
    return SECTION_ICONS.find((item) => item.id === 'moon');
  }
  if (lower.includes('laptop') || lower.includes('computer')) {
    return SECTION_ICONS.find((item) => item.id === 'laptop');
  }
  return SECTION_ICONS.find((item) => item.id === 'building') || SECTION_ICONS[0];
};

export const getSectionIconComponent = (iconId, sectionName = '') => {
  const config = getSectionIconConfig(iconId, sectionName);
  return config ? config.icon : BookOpen;
};
