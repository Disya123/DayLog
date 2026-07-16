import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus } from '@phosphor-icons/react';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { authApi } from '@/api/auth';
import { useAuthStore } from '@/store/auth-store';
import { AxiosError } from 'axios';

export function RegisterPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError('Пароль должен быть не короче 8 символов');
      return;
    }
    setLoading(true);
    try {
      const res = await authApi.register({ name, email, password });
      setAuth(res.accessToken, res.actor);
      navigate('/calendars', { replace: true });
    } catch (err) {
      const axiosErr = err as AxiosError<{ message?: string }>;
      setError(axiosErr.response?.data?.message || 'Не удалось зарегистрироваться');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Создать аккаунт"
      subtitle="Один аккаунт — сколько угодно календарей. Начните вести дневник задач."
      footer={
        <>
          Уже есть аккаунт?{' '}
          <Link
            to="/login"
            className="font-medium text-[var(--color-accent)] hover:underline"
          >
            Войти
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <Input
          label="Имя"
          name="name"
          placeholder="Как вас зовут"
          autoComplete="name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Input
          label="Email"
          name="email"
          type="email"
          placeholder="you@company.com"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Input
          label="Пароль"
          name="password"
          type="password"
          placeholder="Минимум 8 символов"
          autoComplete="new-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error && (
          <div className="rounded-xl bg-[var(--color-danger-subtle)] px-4 py-3 text-sm text-[var(--color-danger)]">
            {error}
          </div>
        )}

        <Button type="submit" size="lg" loading={loading} className="w-full">
          <UserPlus size={18} weight="bold" />
          Создать аккаунт
        </Button>
      </form>
    </AuthLayout>
  );
}
