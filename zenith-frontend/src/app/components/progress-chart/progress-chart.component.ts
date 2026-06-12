import { Component, input, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HabitsService } from '../../services/habits.service';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { es } from 'date-fns/locale';

interface DayChartData {
  date: string;
  'Hábitos Buenos': number;
  'Hábitos Evitados': number;
  'Hábitos Malos': number;
}

@Component({
  selector: 'app-progress-chart',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-white rounded-xl shadow-sm p-6 animate-fade-in">
      <h3 class="text-xl font-bold text-gray-900 mb-6">
        @if (view() === 'today') { Resumen de Hoy }
        @else if (view() === 'week') { Progreso Semanal }
        @else { Progreso Mensual }
      </h3>

      <!-- Stat Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div class="bg-green-50 rounded-lg p-4">
          <div class="text-green-600 text-sm font-medium mb-1">Hábitos Buenos</div>
          <div class="text-3xl font-bold text-green-700">{{ todayStats()['Hábitos Buenos'] }}</div>
          @if (view() !== 'today') {
            <div class="text-xs text-green-600 mt-1">Promedio: {{ avgGoodHabits() }}</div>
          }
        </div>

        <div class="bg-blue-50 rounded-lg p-4">
          <div class="text-blue-600 text-sm font-medium mb-1">Hábitos Evitados</div>
          <div class="text-3xl font-bold text-blue-700">{{ todayStats()['Hábitos Evitados'] }}</div>
        </div>

        <div class="bg-red-50 rounded-lg p-4">
          <div class="text-red-600 text-sm font-medium mb-1">Hábitos Malos</div>
          <div class="text-3xl font-bold text-red-700">{{ todayStats()['Hábitos Malos'] }}</div>
        </div>
      </div>

      <!-- Chart Display -->
      @if (view() !== 'today' && chartData().length > 0) {
        <div class="relative pt-6">
          <!-- Grid Background lines -->
          <div class="absolute inset-0 flex flex-col justify-between pointer-events-none border-b border-gray-200 h-64 text-gray-300 text-[10px] pb-6">
            <div class="border-t border-dashed border-gray-100 w-full h-0"></div>
            <div class="border-t border-dashed border-gray-100 w-full h-0"></div>
            <div class="border-t border-dashed border-gray-100 w-full h-0"></div>
            <div class="border-t border-dashed border-gray-100 w-full h-0"></div>
          </div>

          <!-- Pure CSS/HTML Side-by-Side Bar Chart -->
          <div class="h-64 flex items-end gap-3 px-2 pb-6 overflow-x-auto relative z-10 scrollbar-thin">
            @for (day of chartData(); track day.date) {
              <div class="flex-1 flex flex-col items-center justify-end h-full min-w-[50px]">
                
                <!-- Bars Group container -->
                <div class="flex items-end gap-[3px] h-full w-full justify-center relative group">
                  <!-- Good Habits Bar -->
                  <div
                    [style.height.%]="getHeightPercent(day['Hábitos Buenos'])"
                    class="w-2.5 sm:w-3.5 bg-green-500 rounded-t transition-all duration-500 hover:bg-green-600"
                  ></div>
                  
                  <!-- Avoided Bad Habits Bar -->
                  <div
                    [style.height.%]="getHeightPercent(day['Hábitos Evitados'])"
                    class="w-2.5 sm:w-3.5 bg-blue-500 rounded-t transition-all duration-500 hover:bg-blue-600"
                  ></div>
                  
                  <!-- Performed Bad Habits Bar -->
                  <div
                    [style.height.%]="getHeightPercent(day['Hábitos Malos'])"
                    class="w-2.5 sm:w-3.5 bg-red-500 rounded-t transition-all duration-500 hover:bg-red-600"
                  ></div>

                  <!-- Popover tooltip on group hover -->
                  <div class="absolute bottom-full mb-2 bg-gray-900/90 backdrop-blur-sm text-white text-[11px] rounded-lg p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-20 whitespace-nowrap shadow-xl border border-gray-700">
                    <p class="font-bold border-b border-gray-700 pb-1 mb-1 text-gray-300">{{ day.date }}</p>
                    <p class="flex justify-between gap-4"><span class="text-green-400">Buenos:</span> <b>{{ day['Hábitos Buenos'] }}</b></p>
                    <p class="flex justify-between gap-4"><span class="text-blue-400">Evitados:</span> <b>{{ day['Hábitos Evitados'] }}</b></p>
                    <p class="flex justify-between gap-4"><span class="text-red-400">Malos:</span> <b>{{ day['Hábitos Malos'] }}</b></p>
                  </div>
                </div>

                <!-- Day label -->
                <span class="text-[10px] text-gray-500 mt-2 font-medium truncate max-w-full">
                  {{ day.date }}
                </span>
              </div>
            }
          </div>
        </div>
        
        <!-- Legend -->
        <div class="flex justify-center gap-6 mt-4 text-xs font-medium text-gray-600">
          <div class="flex items-center gap-2">
            <span class="w-3 h-3 bg-green-500 rounded-sm"></span>
            <span>Hábitos Buenos</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="w-3 h-3 bg-blue-500 rounded-sm"></span>
            <span>Hábitos Evitados</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="w-3 h-3 bg-red-500 rounded-sm"></span>
            <span>Hábitos Malos</span>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .scrollbar-thin::-webkit-scrollbar {
      height: 4px;
    }
    .scrollbar-thin::-webkit-scrollbar-track {
      background: #f1f1f1;
      border-radius: 4px;
    }
    .scrollbar-thin::-webkit-scrollbar-thumb {
      background: #cbd5e1;
      border-radius: 4px;
    }
    .animate-fade-in {
      animation: fadeIn 0.3s ease-out forwards;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(4px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class ProgressChartComponent {
  public readonly view = input.required<'today' | 'week' | 'month'>();

  private readonly habitsService = inject(HabitsService);

  // Computed signal to calculate dates in the range
  protected readonly dates = computed(() => {
    const activeView = this.view();
    const today = new Date();

    if (activeView === 'today') {
      return [today];
    } else if (activeView === 'week') {
      return eachDayOfInterval({
        start: startOfWeek(today, { weekStartsOn: 1 }),
        end: endOfWeek(today, { weekStartsOn: 1 })
      });
    } else {
      return eachDayOfInterval({
        start: startOfMonth(today),
        end: endOfMonth(today)
      });
    }
  });

  // Compiled chart data for the calculated dates
  protected readonly chartData = computed<DayChartData[]>(() => {
    const listDates = this.dates();
    const logs = this.habitsService.logs();
    const habits = this.habitsService.habits();
    const activeView = this.view();

    const goodHabits = habits.filter(h => h.category === 'good');
    const badHabits = habits.filter(h => h.category === 'bad');

    return listDates.map(date => {
      // Get local string format 'yyyy-MM-dd'
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;

      const dayLogs = logs.filter(l => l.date === dateStr);

      const completedGood = dayLogs.filter(l => {
        const h = goodHabits.find(x => x.id === l.habitId);
        return h && l.completed;
      }).length;

      const completedBad = dayLogs.filter(l => {
        const h = badHabits.find(x => x.id === l.habitId);
        return h && l.completed;
      }).length;

      const avoidedBad = badHabits.length - completedBad;

      let label = '';
      if (activeView === 'today') {
        label = 'Hoy';
      } else if (activeView === 'week') {
        label = format(date, 'EEE', { locale: es });
      } else {
        label = format(date, 'd MMM', { locale: es });
      }

      return {
        date: label,
        'Hábitos Buenos': completedGood,
        'Hábitos Evitados': avoidedBad,
        'Hábitos Malos': completedBad
      };
    });
  });

  // Calculate highest count value to scale chart bar heights
  protected readonly maxChartValue = computed(() => {
    const data = this.chartData();
    let max = 0;
    data.forEach(day => {
      max = Math.max(
        max,
        day['Hábitos Buenos'],
        day['Hábitos Evitados'],
        day['Hábitos Malos']
      );
    });
    return max || 1; // Minimum 1 to avoid divide by zero
  });

  // Stats computed from chart data
  protected readonly todayStats = computed<DayChartData>(() => {
    const data = this.chartData();
    if (data.length > 0) {
      return data[data.length - 1];
    }
    return { date: 'Hoy', 'Hábitos Buenos': 0, 'Hábitos Evitados': 0, 'Hábitos Malos': 0 };
  });

  protected readonly avgGoodHabits = computed(() => {
    const data = this.chartData();
    if (data.length === 0) return 0;
    const sum = data.reduce((total, day) => total + day['Hábitos Buenos'], 0);
    return Math.round(sum / data.length);
  });

  protected getHeightPercent(val: number): number {
    return Math.round((val / this.maxChartValue()) * 100);
  }
}
