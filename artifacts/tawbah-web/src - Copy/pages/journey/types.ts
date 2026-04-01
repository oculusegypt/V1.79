export interface JourneyDay {
  day: number;
  title: string;
  tasks: string[];
  verse: string;
  completed: boolean;
  isCurrent: boolean;
  isLocked: boolean;
  taskChecks: boolean[];
}

export interface JourneyData {
  days: JourneyDay[];
  completedCount: number;
  currentDay: number;
  streakDays: number;
}
