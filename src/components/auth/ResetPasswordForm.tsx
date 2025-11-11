import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AuthError } from './AuthError';
import { useResetPasswordForm } from '@/lib/hooks/useResetPasswordForm';

interface ResetPasswordFormProps {
  token: string | null;
}

const ResetPasswordForm: React.FC<ResetPasswordFormProps> = ({ token }) => {
  const {
    formState,
    formErrors,
    isSubmitting,
    tokenError,
    touchedFields,
    handlePasswordChange,
    handleConfirmPasswordChange,
    handleFieldBlur,
    handleSubmit,
  } = useResetPasswordForm(token);

  if (tokenError) {
    return (
      <div className="w-full">
        <h1 className="text-2xl font-bold mb-2 text-foreground">Resetowanie hasła</h1>
        <AuthError
          message={tokenError}
          className="mb-6"
        />
        <div className="text-center">
          <a
            href="/forgot-password"
            className="text-primary hover:underline font-medium"
          >
            Poproś o nowy link resetujący
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <h1 className="text-2xl font-bold mb-2 text-foreground">Resetowanie hasła</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Wprowadź nowe hasło dla swojego konta
      </p>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {formErrors.general && (
          <AuthError message={formErrors.general} />
        )}

        <div className="space-y-2">
          <Label htmlFor="password">Nowe hasło</Label>
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
            {isSubmitting ? 'Resetowanie...' : 'Zresetuj hasło'}
          </Button>

          <div className="text-center">
            <a
              href="/login"
              className="text-sm text-primary hover:underline"
            >
              Wróć do logowania
            </a>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ResetPasswordForm;

