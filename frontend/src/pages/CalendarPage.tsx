import { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import { AnimatePresence } from 'framer-motion';
import { CaretLeft, CaretRight, ArrowLeft, CalendarDots } from '@phosphor-icons/react';
import { AppHeader } from '@/components/AppHeader';
import { Skeleton } from '@/components/ui/Skeleton';
import { DayColumn } from '@/components/kanban/DayColumn';
import { DayPanel } from '@/components/kanban/DayPanel';
import { AuditModal } from '@/components/kanban/AuditModal';
import { calendarsApi } from '@/api/calendars';
import { daysApi } from '@/api/days';
import { tasksApi } from '@/api/tasks';
import {
  startOfWeek,
  periodDays,
  addWeeks,
  formatWeekRange,
  findDayByDate,
} from '@/lib/date-utils';
import type { Day, Task, Calendar } from '@/api/types';

export function CalendarPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [openDay, setOpenDay] = useState<Day | null>(null);
  const [historyTaskId, setHistoryTaskId] = useState<string | null>(null);
  const [activeTask, setActiveTask] = useState<{ task: Task; day: Day } | null>(null);

  const { data: calendar, isLoading } = useQuery({
    queryKey: ['calendar', id],
    queryFn: () => calendarsApi.findOne(id!),
    enabled: !!id,
  });

  const days = useMemo(() => periodDays(weekStart, 28), [weekStart]);
  // Текущая ли неделя: сегодня попадает в диапазон [weekStart, weekStart+6]
  const isCurrentWeek = useMemo(() => {
    const today = new Date();
    const weekEnd = addWeeks(weekStart, 0);
    weekEnd.setUTCDate(weekEnd.getUTCDate() + 6);
    const t = today.getTime();
    return t >= weekStart.getTime() && t <= weekEnd.getTime() + 86_400_000;
  }, [weekStart]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
  );

  const moveMutation = useMutation({
    mutationFn: ({ taskId, toDayId }: { taskId: string; toDayId: string }) =>
      tasksApi.move(taskId, toDayId),
    onMutate: async ({ taskId, toDayId }) => {
      await queryClient.cancelQueries({ queryKey: ['calendar', id] });
      const previousCalendar = queryClient.getQueryData(['calendar', id]);
      
      queryClient.setQueryData<Calendar>(['calendar', id], (old) => {
        if (!old || !old.days) return old;
        let taskToMove: Task | null = null;
        let fromDayId: string | null = null;
        
        old.days.forEach((d: Day) => {
          const t = d.tasks.find(x => x.id === taskId);
          if (t) {
            taskToMove = t;
            fromDayId = d.id;
          }
        });
        
        if (!taskToMove || fromDayId === toDayId) return old;

        return {
          ...old,
          days: old.days.map((d: Day) => {
            if (d.id === fromDayId) {
              return { ...d, tasks: d.tasks.filter(t => t.id !== taskId) };
            }
            if (d.id === toDayId) {
              return { ...d, tasks: [...d.tasks, taskToMove!] };
            }
            return d;
          })
        };
      });
      return { previousCalendar };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousCalendar) {
        queryClient.setQueryData(['calendar', id], context.previousCalendar);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar', id] });
    },
  });

  function handleDragStart(event: DragStartEvent) {
    const data = event.active.data.current as { dayId: string; task: Task } | undefined;
    if (data && calendar) {
      const day = calendar.days?.find((d) => d.id === data.dayId);
      if (day) setActiveTask({ task: data.task, day });
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveTask(null);
    if (!over || !calendar) return;

    const activeData = active.data.current as { dayId: string; task: Task } | undefined;
    if (!activeData) return;

    const overId = String(over.id);
    // over.id — это либо dayId существующего дня, либо `empty-YYYY-MM-DD`
    let targetDayId: string | undefined;

    if (overId.startsWith('empty-')) {
      // Dropped на колонку без дня — нужно создать день сначала
      const dateStr = overId.replace('empty-', '');
      const targetDate = new Date(dateStr + 'T00:00:00.000Z');
      daysApi.create(calendar.id, targetDate).then((newDay) => {
        moveMutation.mutate({ taskId: activeData.task.id, toDayId: newDay.id });
      });
      return;
    }

    // over.id может быть id другой задачи (сортировка внутри колонки)
    // или id дня. Проверяем, является ли over задачей.
    const overTaskData = over.data.current as { dayId: string; task: Task } | undefined;
    if (overTaskData) {
      targetDayId = overTaskData.dayId;
    } else {
      targetDayId = overId;
    }

    if (targetDayId && targetDayId !== activeData.dayId) {
      moveMutation.mutate({ taskId: activeData.task.id, toDayId: targetDayId });
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-[100dvh] bg-[var(--color-bg)]">
        <AppHeader />
        <main className="mx-auto max-w-[1400px] px-6 py-8">
          <Skeleton className="h-10 w-64 mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
            {[...Array(7)].map((_, i) => (
              <Skeleton key={i} className="h-64 rounded-2xl" />
            ))}
          </div>
        </main>
      </div>
    );
  }

  if (!calendar) {
    return (
      <div className="min-h-[100dvh] bg-[var(--color-bg)]">
        <AppHeader />
        <main className="mx-auto max-w-[1400px] px-6 py-20 text-center">
          <p className="text-sm text-[var(--color-text-muted)]">
            Календарь не найден или доступ запрещён.
          </p>
          <Link to="/calendars" className="mt-4 inline-block text-[var(--color-accent)] hover:underline">
            Вернуться к списку
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-[var(--color-bg)]">
      <AppHeader />
      <main className="mx-auto max-w-[1400px] px-6 py-8">
        {/* Header bar */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link
              to="/calendars"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] press"
            >
              <ArrowLeft size={16} />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: calendar.color }}
                />
                <h1 className="text-xl font-semibold tracking-tight text-[var(--color-text)]">
                  {calendar.title}
                </h1>
              </div>
              {calendar.description && (
                <p className="text-sm text-[var(--color-text-muted)] mt-0.5">
                  {calendar.description}
                </p>
              )}
            </div>
          </div>

          {/* Week switcher */}
          <div className="flex items-center gap-1.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-1">
            <button
              onClick={() => setWeekStart((w) => addWeeks(w, -1))}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)] press"
            >
              <CaretLeft size={16} weight="bold" />
            </button>
            <button
              onClick={() => setWeekStart(startOfWeek(new Date()))}
              className="px-3 h-8 text-sm font-medium text-[var(--color-text)] hover:bg-[var(--color-surface-2)] rounded-lg press"
            >
              {isCurrentWeek ? 'Эта неделя' : 'Сегодня'}
            </button>
            <span className="px-2 text-sm text-[var(--color-text-muted)] tabular-nums">
              {formatWeekRange(weekStart)}
            </span>
            <button
              onClick={() => setWeekStart((w) => addWeeks(w, 1))}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)] press"
            >
              <CaretRight size={16} weight="bold" />
            </button>
          </div>
        </div>

        {/* Kanban grid */}
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {days.map((date) => {
              const day = findDayByDate(calendar.days ?? [], date) as Day | undefined;
              return (
                <DayColumn
                  key={date.toISOString()}
                  date={date}
                  calendar={calendar}
                  day={day}
                  onOpenDay={(d) => setOpenDay(d)}
                  onShowHistory={(taskId) => setHistoryTaskId(taskId)}
                />
              );
            })}
          </div>

          <DragOverlay dropAnimation={{ duration: 200, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' }}>
            {activeTask && (
              <div className="rounded-xl border border-[var(--color-accent)]/40 bg-[var(--color-surface)] p-3 shadow-diffuse-lg opacity-90">
                <p className="text-sm text-[var(--color-text)]">{activeTask.task.title}</p>
              </div>
            )}
          </DragOverlay>
        </DndContext>

        {/* Legend */}
        <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-[var(--color-text-muted)]">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
            просрочена (невыполнена в прошедшем дне)
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[var(--color-done)]" />
            выполнена (серый зачёркнутый)
          </span>
          <span className="inline-flex items-center gap-1.5">
            <CalendarDots size={12} weight="duotone" />
            перетаскивайте задачи между днями
          </span>
        </div>
      </main>

      {/* Day panel */}
      <AnimatePresence>
        {openDay && (
          <DayPanel
            key={openDay.id}
            day={openDay}
            calendar={calendar}
            onShowHistory={(taskId) => setHistoryTaskId(taskId)}
            onClose={() => setOpenDay(null)}
          />
        )}
      </AnimatePresence>

      {/* Audit modal */}
      {historyTaskId && (
        <AuditModal
          taskId={historyTaskId}
          calendarId={calendar.id}
          onClose={() => setHistoryTaskId(null)}
        />
      )}
    </div>
  );
}
