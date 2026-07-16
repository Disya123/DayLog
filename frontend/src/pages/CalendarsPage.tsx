import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Plus,
  CalendarDots,
  ShareNetwork,
  X,
  Copy,
  Check,
  Trash,
} from '@phosphor-icons/react';
import { AppHeader } from '@/components/AppHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { calendarsApi } from '@/api/calendars';
import type { Calendar, ShareLink } from '@/api/types';
import { useAuthStore } from '@/store/auth-store';

export function CalendarsPage() {
  const { actor } = useAuthStore();
  const isGuest = actor?.type === 'guest';

  const { data: calendars, isLoading } = useQuery({
    queryKey: ['calendars'],
    queryFn: calendarsApi.list,
  });

  return (
    <div className="min-h-[100dvh] bg-[var(--color-bg)]">
      <AppHeader />
      <main className="mx-auto max-w-[1400px] px-6 py-12">
        <div className="flex flex-col gap-2 mb-10">
          <h1 className="text-3xl font-semibold tracking-tight text-[var(--color-text)] leading-none">
            Календари
          </h1>
          <p className="text-sm text-[var(--color-text-muted)]">
            {isGuest
              ? 'Календарь, которым с вами поделились.'
              : 'Создавайте рабочие календари и делитесь ими с коллегами.'}
          </p>
        </div>

        {isLoading ? (
          <CalendarGridSkeleton />
        ) : calendars && calendars.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {!isGuest && <CreateCalendarCard />}
            {calendars.map((c, i) => (
              <CalendarCard key={c.id} calendar={c} index={i} />
            ))}
          </div>
        ) : (
          <EmptyState />
        )}
      </main>
    </div>
  );
}

function CalendarGridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {[...Array(3)].map((_, i) => (
        <Skeleton key={i} className="h-44 rounded-[var(--radius-card)]" />
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-[var(--radius-card)] border border-dashed border-[var(--color-border-strong)] px-6 py-20 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-surface-2)] text-[var(--color-text-subtle)]">
        <CalendarDots size={28} weight="duotone" />
      </span>
      <h3 className="mt-6 text-lg font-medium text-[var(--color-text)]">
        Пока нет календарей
      </h3>
      <p className="mt-2 text-sm text-[var(--color-text-muted)] max-w-[40ch]">
        Создайте первый календарь, чтобы начать вести задачи по дням.
      </p>
    </div>
  );
}

function CreateCalendarCard() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const createMutation = useMutation({
    mutationFn: () =>
      calendarsApi.create({ title, description: description || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendars'] });
      setOpen(false);
      setTitle('');
      setDescription('');
    },
  });

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex min-h-44 flex-col items-center justify-center gap-3 rounded-[var(--radius-card)] border border-dashed border-[var(--color-border-strong)] text-[var(--color-text-muted)] transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] press"
      >
        <Plus size={28} weight="duotone" />
        <span className="text-sm font-medium">Новый календарь</span>
      </button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 100, damping: 20 }}
      className="flex flex-col gap-4 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-diffuse"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-base font-medium text-[var(--color-text)]">Новый календарь</h3>
        <button
          onClick={() => setOpen(false)}
          className="text-[var(--color-text-subtle)] hover:text-[var(--color-text)]"
        >
          <X size={18} />
        </button>
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (title.trim()) createMutation.mutate();
        }}
        className="flex flex-col gap-4"
      >
        <Input
          label="Название"
          name="title"
          placeholder="Например: Спринт 15"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <Input
          label="Описание (необязательно)"
          name="description"
          placeholder="Короткое описание календаря"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        {createMutation.isError && (
          <p className="text-xs text-[var(--color-danger)]">Не удалось создать календарь</p>
        )}
        <Button type="submit" size="md" loading={createMutation.isPending}>
          <Plus size={16} weight="bold" />
          Создать
        </Button>
      </form>
    </motion.div>
  );
}

function CalendarCard({ calendar, index }: { calendar: Calendar; index: number }) {
  const isGuest = useAuthStore((s) => s.actor?.type === 'guest');
  const [shareOpen, setShareOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        type: 'spring',
        stiffness: 100,
        damping: 20,
        delay: index * 0.06,
      }}
      className="group relative flex flex-col rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-diffuse transition-shadow hover:shadow-diffuse-lg"
    >
      {/* Цветная полоса сверху */}
      <div
        className="absolute inset-x-0 top-0 h-1 rounded-t-[var(--radius-card)]"
        style={{ backgroundColor: calendar.color }}
      />

      <div className="flex items-start justify-between gap-3">
        <Link
          to={`/calendars/${calendar.id}`}
          className="flex-1 text-lg font-medium tracking-tight text-[var(--color-text)] hover:text-[var(--color-accent)]"
        >
          {calendar.title}
        </Link>
        {!isGuest && (
          <button
            onClick={() => setShareOpen(true)}
            className="text-[var(--color-text-subtle)] opacity-0 transition-opacity hover:text-[var(--color-accent)] group-hover:opacity-100"
            title="Поделиться"
          >
            <ShareNetwork size={18} weight="duotone" />
          </button>
        )}
      </div>

      {calendar.description && (
        <p className="mt-2 text-sm text-[var(--color-text-muted)] leading-relaxed line-clamp-2">
          {calendar.description}
        </p>
      )}

      <div className="mt-auto flex items-center gap-4 pt-6 text-xs text-[var(--color-text-subtle)]">
        <span className="inline-flex items-center gap-1.5">
          <CalendarDots size={14} weight="duotone" />
          {calendar._count?.days ?? calendar.days?.length ?? 0} дней
        </span>
        {!isGuest && (calendar._count?.shareLinks ?? 0) > 0 && (
          <span className="inline-flex items-center gap-1.5">
            <ShareNetwork size={14} weight="duotone" />
            {calendar._count?.shareLinks} ссылок
          </span>
        )}
      </div>

      {shareOpen && <ShareDialog calendar={calendar} onClose={() => setShareOpen(false)} />}
    </motion.div>
  );
}

function ShareDialog({ calendar, onClose }: { calendar: Calendar; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState<string | null>(null);

  const { data: links, isLoading } = useQuery({
    queryKey: ['share-links', calendar.id],
    queryFn: () => calendarsApi.listShareLinks(calendar.id),
  });

  const createMutation = useMutation({
    mutationFn: () => calendarsApi.createShareLink(calendar.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['share-links', calendar.id] });
      queryClient.invalidateQueries({ queryKey: ['calendars'] });
    },
  });

  const revokeMutation = useMutation({
    mutationFn: (linkId: string) => calendarsApi.revokeShareLink(calendar.id, linkId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['share-links', calendar.id] });
      queryClient.invalidateQueries({ queryKey: ['calendars'] });
    },
  });

  function copyLink(token: string) {
    const url = `${window.location.origin}/share/${token}`;
    navigator.clipboard.writeText(url);
    setCopied(token);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 100, damping: 20 }}
        className="w-full max-w-lg rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-diffuse-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-base font-medium text-[var(--color-text)]">
              Поделиться календарём
            </h3>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">
              {calendar.title}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-[var(--color-text-subtle)] hover:text-[var(--color-text)]"
          >
            <X size={20} />
          </button>
        </div>

        <p className="text-sm text-[var(--color-text-muted)] mb-4 leading-relaxed">
          Любой, кто откроет ссылку, сможет редактировать задачи и описание дней
          после ввода своего имени.
        </p>

        {isLoading ? (
          <Skeleton className="h-16 w-full" />
        ) : (
          <div className="flex flex-col gap-3">
            {links?.map((link: ShareLink) => (
              <div
                key={link.id}
                className="flex items-center gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 py-3"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-xs text-[var(--color-text-muted)] truncate">
                    /share/{link.token.slice(0, 8)}…
                  </p>
                  <p className="text-xs text-[var(--color-text-subtle)] mt-0.5">
                    {link._count?.guests ?? 0} гостей
                  </p>
                </div>
                <button
                  onClick={() => copyLink(link.token)}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--color-text-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-accent)] press"
                  title="Копировать ссылку"
                >
                  {copied === link.token ? (
                    <Check size={16} weight="bold" className="text-[var(--color-accent)]" />
                  ) : (
                    <Copy size={16} />
                  )}
                </button>
                <button
                  onClick={() => revokeMutation.mutate(link.id)}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--color-text-muted)] hover:bg-[var(--color-danger-subtle)] hover:text-[var(--color-danger)] press"
                  title="Отозвать ссылку"
                >
                  <Trash size={16} />
                </button>
              </div>
            ))}

            {(!links || links.length === 0) && (
              <p className="text-sm text-[var(--color-text-subtle)] py-4 text-center">
                Пока нет активных ссылок.
              </p>
            )}
          </div>
        )}

        <Button
          variant="secondary"
          size="md"
          className="w-full mt-5"
          loading={createMutation.isPending}
          onClick={() => createMutation.mutate()}
        >
          <Plus size={16} weight="bold" />
          Создать ссылку
        </Button>
      </motion.div>
    </div>
  );
}
