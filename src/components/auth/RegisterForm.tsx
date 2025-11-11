import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AuthError } from './AuthError';
import { useRegisterForm } from '@/lib/hooks/useRegisterForm';

const RegisterForm: React.FC = () => {
  const {
    formState,
    formErrors,
    isSubmitting,
    touchedFields,
    handleEmailChange,
    handlePasswordChange,
    handleConfirmPasswordChange,
    handleFieldBlur,
    handleSubmit,
  } = useRegisterForm();

  return (
    <div className="w-full">
      <h1 className="text-2xl font-bold mb-2 text-foreground">Rejestracja</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Utwórz konto, aby rozpocząć zarządzanie samochodami
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
            placeholder="Minimum 6 znaków"
            autoComplete="new-password"
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

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Potwierdzenie hasła</Label>
          <Input
            id="confirmPassword"
            type="password"
            name="confirmPassword"
            value={formState.confirmPassword}
            onChange={(e) => handleConfirmPasswordChange(e.target.value)}
            onBlur={() => handleFieldBlur('confirmPassword')}
            placeholder="Powtórz hasło"
            autoComplete="new-password"
            aria-invalid={touchedFields.has('confirmPassword') && !!formErrors.confirmPassword}
            aria-describedby={touchedFields.has('confirmPassword') && formErrors.confirmPassword ? 'confirm-password-error' : undefined}
            required
          />
          {touchedFields.has('confirmPassword') && formErrors.confirmPassword && (
            <p id="confirm-password-error" className="text-sm text-destructive" role="alert">
              {formErrors.confirmPassword}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full"
          >
            {isSubmitting ? 'Rejestrowanie...' : 'Zarejestruj się'}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Masz już konto?{' '}
            <a
              href="/login"
              className="text-primary hover:underline font-medium"
            >
              Zaloguj się
            </a>
          </p>
        </div>
      </form>
    </div>
  );
};

export default RegisterForm;

