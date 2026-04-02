// Mock API data for mobile app offline functionality
export interface MockUserProgress {
  id: string;
  sessionId: string;
  sinCategory?: string;
  covenantSigned?: boolean;
  covenantDate?: string;
  streak: number;
  streakDays: number;
  completedTasks: number;
  lastActive: string;
  lastActiveDate: string;
  level: number;
  experience: number;
  totalDaysSober: number;
  currentStreak: number;
  longestStreak: number;
  lastSinDate?: string;
  currentPhase?: string;
  day40Progress?: number;
  firstDayTasksCompleted?: boolean;
  day40StartDate?: string;
}

export interface MockHabitEntry {
  id: string;
  habitId: string;
  name: string;
  completed: boolean;
  date: string;
}

export interface MockDhikrCount {
  count: number;
  date: string;
}

// Generate mock data
export function getMockUserProgress(): MockUserProgress {
  return {
    id: Math.floor(Math.random() * 1000000).toString(),
    sessionId: localStorage.getItem('tawbah_session_id') || 'mock-user',
    sinCategory: 'general',
    covenantSigned: true,
    covenantDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    streak: 7,
    streakDays: 7,
    completedTasks: 42,
    lastActive: new Date().toISOString(),
    lastActiveDate: new Date().toISOString().split('T')[0],
    level: 3,
    experience: 1250,
    totalDaysSober: 7,
    currentStreak: 7,
    longestStreak: 15,
    lastSinDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    currentPhase: 'recovery',
    day40Progress: 7,
    firstDayTasksCompleted: true,
    day40StartDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  };
}

export function getMockHabits(): MockHabitEntry[] {
  const habits = [
    { habitId: 'morning-dhikr', name: 'أذكار الصباح' },
    { habitId: 'evening-dhikr', name: 'أذكار المساء' },
    { habitId: 'quran-reading', name: 'قراءة القرآن' },
    { habitId: 'night-prayer', name: 'صلاة الليل' },
    { habitId: 'fasting', name: 'الصيام' }
  ];
  
  return habits.map((habit, index) => ({
    id: `habit-${index}`,
    ...habit,
    completed: Math.random() > 0.3,
    date: new Date().toISOString().split('T')[0]
  }));
}

export function getMockDhikrCount(): MockDhikrCount {
  return {
    count: Math.floor(Math.random() * 1000) + 100,
    date: new Date().toISOString().split('T')[0]
  };
}
