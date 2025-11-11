import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AuthError } from './AuthError';
import { useLoginForm } from '@/lib/hooks/useLoginForm';

interface LoginFormProps {
  redirectUrl?: string;
}

const LoginForm: React.FC<LoginFormProps> = ({ redirectUrl = '/' }) => {
  const {
    formState,
    formErrors,
    isSubmitting,
    touchedFields,
    handleEmailChange,
    handlePasswordChange,
    handleFieldBlur,
    handleSubmit,
  } = useLoginForm({ redirectUrl });

  return (
    <div className="w-full">
      <h1 className="text-2xl font-bold mb-2 text-foreground">Logowanie</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Zaloguj się, aby zarządzać swoimi samochodami
      </p>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {formErrors.general && (
          <AuthError message={formErrors.general} />
        )}

        <div className="space-y-2">
          <Label htmlFor="email">Adres e-mail</Label>
          <Input
            id="email"
            type="email"
            name="email"
            value={formState.email}
            onChange={(e) => handleEmailChange(e.target.value)}
            onBlur={() => handleFieldBlur('email')}
            placeholder="twoj@email.pl"
            autoComplete="email"
            aria-invalid={touchedFields.has('email') && !!formErrors.email}
            aria-describedby={touchedFields.has('email') && formErrors.email ? 'email-error' : undefined}
            required
          />
          {touchedFields.has('email') && formErrors.email && (
            <p id="email-error" className="text-sm text-destructive" role="alert">
              {formErrors.email}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Hasło</Label>
          <Input
            id="password"
            type="password"
            name="password"
            value={formState.password}
            onChange={(e) => handlePasswordChange(e.target.value)}
            onBlur={() => handleFieldBlur('password')}
            placeholder="••••••••"
            autoComplete="current-password"
            aria-invalid={touchedFields.has('password') && !!formErrors.password}
            aria-describedby={touchedFields.has('password') && formErrors.password ? 'password-error' : undefined}
            required
          />
          {touchedFields.has('password') && formErrors.password && (
            <p id="password-error" className="text-sm text-destructive" role="alert">
              {formErrors.password}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full"
          >
            {isSubmitting ? 'Logowanie...' : 'Zaloguj się'}
          </Button>

          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              Nie masz konta?{' '}
              <a
                href="/auth/register"
                className="text-primary hover:underline font-medium"
              >
                Zarejestruj się
              </a>
            </p>
          </div>
        </div>
      </form>
    </div>
  );
};

export default LoginForm;

