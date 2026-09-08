import {
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
  Users,
  Moon,
  Sun,
  Coffee,
} from 'lucide-react';

export const SECTION_ICONS = [
  { id: 'book', label: 'Reading (पढ़ाई)', icon: BookOpen },
  { id: 'library', label: 'Library (लाइब्रेरी)', icon: Library },
  { id: 'snowflake', label: 'AC Silent (एसी)', icon: Snowflake },
  { id: 'crown', label: 'VIP / Cabin (केबिन)', icon: Crown },
  { id: 'graduation', label: 'Student (छात्र)', icon: GraduationCap },
  { id: 'sparkles', label: 'Silent Zone (शांत)', icon: Sparkles },
  { id: 'armchair', label: 'Comfort (आरामदायक)', icon: Armchair },
  { id: 'laptop', label: 'Laptop / PC (लैपटॉप)', icon: Laptop },
  { id: 'building', label: 'Hall (हॉल)', icon: Building2 },
  { id: 'wifi', label: 'WiFi (इंटरनेट)', icon: Wifi },
  { id: 'users', label: 'Discussion (ग्रुप)', icon: Users },
  { id: 'moon', label: 'Night Shift (रात)', icon: Moon },
  { id: 'sun', label: 'Day Shift (दिन)', icon: Sun },
  { id: 'coffee', label: 'Café (कैफे)', icon: Coffee },
  { id: 'wind', label: 'Air Flow (हवादार)', icon: Wind },
  { id: 'star', label: 'Special (खास)', icon: Star },
];

export const getSectionIconComponent = (iconId, sectionName = '') => {
  if (iconId) {
    const found = SECTION_ICONS.find((item) => item.id === iconId);
    if (found) return found.icon;
  }
  const lower = (sectionName || '').toLowerCase();
  if (lower.includes('read') || lower.includes('study') || lower.includes('book')) return BookOpen;
  if (lower.includes('ac') || lower.includes('cool')) return Snowflake;
  if (lower.includes('vip') || lower.includes('cabin') || lower.includes('premium')) return Crown;
  if (lower.includes('night')) return Moon;
  if (lower.includes('laptop') || lower.includes('computer')) return Laptop;
  if (lower.includes('girl') || lower.includes('boy')) return GraduationCap;
  return Building2;
};
