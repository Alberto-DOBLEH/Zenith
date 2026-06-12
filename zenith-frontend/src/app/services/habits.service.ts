import { Injectable, signal, effect, inject } from '@angular/core';
import { AuthService } from './auth.service';

export interface Habit {
  id: string;
  name: string;
  type: 'boolean' | 'time' | 'count';
  target?: number;
  unit?: string;
  category: 'good' | 'bad';
  color: string;
  createdAt: string;
}

export interface HabitLog {
  habitId: string;
  date: string;
  completed: boolean;
  value?: number;
}

export interface DailyNote {
  date: string;
  strengths: string;
  improvements: string;
}

@Injectable({
  providedIn: 'root'
})
export class HabitsService {
  private readonly authService = inject(AuthService);

  public readonly habits = signal<Habit[]>([]);
  public readonly logs = signal<HabitLog[]>([]);
  public readonly notes = signal<DailyNote[]>([]);

  constructor() {
    // Sync lists when the user changes
    effect(() => {
      const user = this.authService.user();
      if (user && typeof window !== 'undefined' && window.localStorage) {
        const storedHabits = localStorage.getItem(`habits_${user.id}`);
        const storedLogs = localStorage.getItem(`logs_${user.id}`);
        const storedNotes = localStorage.getItem(`notes_${user.id}`);

        this.habits.set(storedHabits ? JSON.parse(storedHabits) : []);
        this.logs.set(storedLogs ? JSON.parse(storedLogs) : []);
        this.notes.set(storedNotes ? JSON.parse(storedNotes) : []);
      } else {
        this.habits.set([]);
        this.logs.set([]);
        this.notes.set([]);
      }
    }, { allowSignalWrites: true });

    // Auto-save habits when modified
    effect(() => {
      const user = this.authService.user();
      const habits = this.habits();
      if (user && typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(`habits_${user.id}`, JSON.stringify(habits));
      }
    });

    // Auto-save logs when modified
    effect(() => {
      const user = this.authService.user();
      const logs = this.logs();
      if (user && typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(`logs_${user.id}`, JSON.stringify(logs));
      }
    });

    // Auto-save notes when modified
    effect(() => {
      const user = this.authService.user();
      const notes = this.notes();
      if (user && typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(`notes_${user.id}`, JSON.stringify(notes));
      }
    });
  }

  public addHabit(habit: Omit<Habit, 'id' | 'createdAt'>): void {
    const newHabit: Habit = {
      ...habit,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    };
    this.habits.update(h => [...h, newHabit]);
  }

  public removeHabit(id: string): void {
    this.habits.update(h => h.filter(x => x.id !== id));
    this.logs.update(l => l.filter(x => x.habitId !== id));
  }

  public logHabit(habitId: string, date: string, completed: boolean, value?: number): void {
    this.logs.update(currentLogs => {
      const existingIndex = currentLogs.findIndex(l => l.habitId === habitId && l.date === date);
      if (existingIndex > -1) {
        const updated = [...currentLogs];
        updated[existingIndex] = { ...updated[existingIndex], completed, value };
        return updated;
      } else {
        return [...currentLogs, { habitId, date, completed, value }];
      }
    });
  }

  public getHabitLog(habitId: string, date: string): HabitLog | undefined {
    return this.logs().find(l => l.habitId === habitId && l.date === date);
  }

  public saveNote(date: string, strengths: string, improvements: string): void {
    this.notes.update(currentNotes => {
      const existingIndex = currentNotes.findIndex(n => n.date === date);
      if (existingIndex > -1) {
        const updated = [...currentNotes];
        updated[existingIndex] = { date, strengths, improvements };
        return updated;
      } else {
        return [...currentNotes, { date, strengths, improvements }];
      }
    });
  }

  public getNote(date: string): DailyNote | undefined {
    return this.notes().find(n => n.date === date);
  }

  public getStreak(habitId: string): number {
    const habit = this.habits().find(h => h.id === habitId);
    if (!habit) return 0;

    const habitLogs = this.logs()
      .filter(l => l.habitId === habitId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 365; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - i);
      const dateStr = checkDate.toISOString().split('T')[0];

      const log = habitLogs.find(l => l.date === dateStr);

      if (habit.category === 'good') {
        if (log && log.completed) {
          streak++;
        } else if (i > 0) {
          break;
        }
      } else {
        if (!log || !log.completed) {
          streak++;
        } else {
          break;
        }
      }
    }

    return streak;
  }
}
