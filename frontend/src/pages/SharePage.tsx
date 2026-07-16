import { useState, FormEvent, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckSquare, SignIn, UserCircle } from '@phosphor-icons/react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { authApi } from '@/api/auth';
import { useAuthStore } from '@/store/auth-store';
import { AxiosError } from 'axios';

export function SharePage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { setAuth, actor, token: existingToken } = useAuthStore();

  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Если гость уже вошёл через эту ссылку — сразу редирект на канбан
  useEffect(() => {
    if (existingToken && actor?.type === 'guest' && actor.calendarId) {
      navigate(`/calendars/${actor.calendarId}`, { replace: true });
    }
  }, [existingToken, actor, navigate]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    setError(null);
    setLoading(true);
    try {
      const res = await authApi.loginAsGuest({ token, name });
      setAuth(res.accessToken, res.actor);
      if (res.actor.calendarId) {
        navigate(`/calendars/${res.actor.calendarId}`, { replace: true });
      }
    } catch (err) {
      const axiosErr = err as AxiosError<{ message?: string }>;
      setError(
        axiosErr.response?.data?.message ||
          'Ссылка недействительна или была отозвана.',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[100dvh] grid place-items-center bg-[var(--color-bg)] px-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 100, damping: 20 }}
        className="w-full max-w-md rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-8 shadow-diffuse"
      >
        <div className="flex items-center gap-2.5 mb-8">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--color-accent)]">
            <CheckSquare size={18} weight="bold" className="text-white" />
          </span>
          <span className="text-lg font-semibold tracking-tight text-[var(--color-text)]">
            DayLog
          </span>
        </div>

        <div className="mb-6">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-surface-2)] text-[var(--color-text-muted)]">
            <UserCircle size={24} weight="duotone" />
          </span>
          <h1 className="mt-5 text-2xl font-semibold tracking-tight text-[var(--color-text)] leading-none">
            Вас пригласили
          </h1>
          <p className="mt-3 text-sm text-[var(--color-text-muted)] leading-relaxed">
            Введите ваше имя, чтобы получить доступ к календарю. Вы сможете
            редактировать задачи и описание дней наравне с владельцем.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <Input
            label="Ваше имя"
            name="name"
            placeholder="Например: Игорь Петров"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />

          {error && (
            <div className="rounded-xl bg-[var(--color-danger-subtle)] px-4 py-3 text-sm text-[var(--color-danger)]">
              {error}
            </div>
          )}

          <Button type="submit" size="lg" loading={loading} className="w-full">
            <SignIn size={18} weight="bold" />
            Продолжить
          </Button>
        </form>
      </motion.div>
    </div>
  );
}
