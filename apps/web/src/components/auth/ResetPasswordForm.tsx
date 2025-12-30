import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AuthError } from './AuthError';
import { useResetPasswordForm } from '@/lib/hooks/useResetPasswordForm';
import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '../../db/database.types.ts';

interface ResetPasswordFormProps {
  hasValidSession: boolean;
  sessionError: string | null;
  supabaseUrl?: string;
  supabaseKey?: string;
}

const ResetPasswordForm: React.FC<ResetPasswordFormProps> = ({
  hasValidSession: initialHasValidSession,
  sessionError: initialSessionError,
  supabaseUrl,
  supabaseKey,
}) => {
  const [hasValidSession, setHasValidSession] = useState(initialHasValidSession);
  const [sessionError, setSessionError] = useState<string | null>(initialSessionError);

  // Handle hash fragments on client side (fallback if server-side check failed)
  useEffect(() => {
    // If server-side already validated session, we're good
    if (initialHasValidSession) {
      return;
    }

    // If server-side check failed, try client-side hash fragment handling
    if (!hasValidSession && supabaseUrl && supabaseKey) {
      const handleHashFragments = async () => {
        // Check hash fragments (only available on client side)
        const hash = window.location.hash.substring(1);
        if (hash) {
          const hashParams = new URLSearchParams(hash);
          const accessToken = hashParams.get('access_token');
          const refreshToken = hashParams.get('refresh_token');

          if (accessToken && refreshToken) {
            try {
              const supabase = createBrowserClient<Database>(supabaseUrl, supabaseKey);

              const { data, error } = await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken,
              });

              if (error) {
                throw error;
              }

              if (data.session) {
                setHasValidSession(true);
                setSessionError(null);
                // Clear hash from URL
                window.history.replaceState(null, '', window.location.pathname);
              } else {
                throw new Error('Nie udało się ustawić sesji resetującej');
              }
            } catch (error) {
              console.error('Hash fragment handling error:', error);
              setSessionError(
                error instanceof Error ? error.message : 'Token resetowania jest nieprawidłowy lub wygasł'
              );
            }
          } else if (!initialHasValidSession && !initialSessionError) {
            // No hash fragments and no server-side error - might be loading
            // Wait a bit for potential redirect
            setTimeout(() => {
              if (!hasValidSession) {
                setSessionError('Token resetowania jest nieprawidłowy lub wygasł');
              }
            }, 1000);
          }
        } else if (!initialHasValidSession && !initialSessionError) {
          // No hash fragments and no server-side error
          setSessionError('Token resetowania jest nieprawidłowy lub wygasł');
        }
      };

      handleHashFragments();
    } else if (initialSessionError) {
      // Use server-side error if available
      setSessionError(initialSessionError);
    }
  }, [initialHasValidSession, initialSessionError, hasValidSession, supabaseUrl, supabaseKey]);

  const {
    formState,
    formErrors,
    isSubmitting,
    touchedFields,
    handlePasswordChange,
    handleConfirmPasswordChange,
    handleFieldBlur,
    handleSubmit,
  } = useResetPasswordForm(null);

  if (sessionError || !hasValidSession) {
    return (
      <div className="w-full">
        <h1 className="text-2xl font-bold mb-2 text-foreground">Resetowanie hasła</h1>
        <AuthError message={sessionError || 'Token resetowania jest nieprawidłowy lub wygasł'} className="mb-6" />
        <div className="text-center">
          <a href="/auth/forgot-password" className="text-primary hover:underline font-medium">
            Poproś o nowy link resetujący
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <h1 className="text-2xl font-bold mb-2 text-foreground">Resetowanie hasła</h1>
      <p className="text-sm text-muted-foreground mb-6">Wprowadź nowe hasło dla swojego konta</p>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {formErrors.general && <AuthError message={formErrors.general} />}

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
            aria-describedby={
              touchedFields.has('confirmPassword') && formErrors.confirmPassword ? 'confirm-password-error' : undefined
            }
            required
          />
          {touchedFields.has('confirmPassword') && formErrors.confirmPassword && (
            <p id="confirm-password-error" className="text-sm text-destructive" role="alert">
              {formErrors.confirmPassword}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? 'Resetowanie...' : 'Zresetuj hasło'}
          </Button>

          <div className="text-center">
            <a href="/auth/login" className="text-sm text-primary hover:underline">
              Wróć do logowania
            </a>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ResetPasswordForm;
