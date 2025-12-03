import React, { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '../../db/database.types.ts';

interface ConfirmEmailProps {
  status: 'processing' | 'success' | 'error';
  message: string;
  redirectTo: string;
  supabaseUrl?: string;
  supabaseKey?: string;
}

const ConfirmEmail: React.FC<ConfirmEmailProps> = ({
  status: initialStatus,
  message: initialMessage,
  redirectTo,
  supabaseUrl,
  supabaseKey,
}) => {
  const [status, setStatus] = useState(initialStatus);
  const [message, setMessage] = useState(initialMessage);

  useEffect(() => {
    // If server-side already handled it, just redirect on success
    if (initialStatus === 'success') {
      // Clear query parameters and hash from URL
      window.history.replaceState(null, '', window.location.pathname);

      // Redirect after a short delay
      const timer = setTimeout(() => {
        window.location.href = redirectTo;
      }, 2000);

      return () => clearTimeout(timer);
    }

    // If server-side couldn't handle it (e.g., hash fragments), try client-side
    if (initialStatus === 'processing' && supabaseUrl && supabaseKey) {
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
                setStatus('success');
                setMessage('E-mail został potwierdzony pomyślnie!');
                // Clear hash from URL
                window.history.replaceState(null, '', window.location.pathname);
                // Redirect after a short delay
                setTimeout(() => {
                  window.location.href = redirectTo;
                }, 2000);
              } else {
                throw new Error('Nie udało się potwierdzić e-maila');
              }
            } catch (error) {
              console.error('Email confirmation error:', error);
              setStatus('error');
              setMessage(
                error instanceof Error
                  ? error.message
                  : 'Wystąpił błąd podczas potwierdzania e-maila. Spróbuj ponownie.'
              );
            }
          }
        }
      };

      handleHashFragments();
    }
  }, [initialStatus, redirectTo, supabaseUrl, supabaseKey]);

  return (
    <div className="w-full">
      <h1 className="text-2xl font-bold mb-2 text-foreground">Potwierdzenie e-maila</h1>
      <p className="text-sm text-muted-foreground mb-6">
        {status === 'processing' && 'Trwa potwierdzanie Twojego adresu e-mail...'}
        {status === 'success' && 'Twój adres e-mail został potwierdzony!'}
        {status === 'error' && 'Wystąpił problem podczas potwierdzania e-maila'}
      </p>

      <div className="p-4 rounded-md border">
        {status === 'processing' && (
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
            <p className="text-sm text-foreground">{message}</p>
          </div>
        )}

        {status === 'success' && (
          <div className="flex items-center gap-3">
            <svg
              className="h-5 w-5 text-green-600 dark:text-green-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <p className="text-sm text-green-600 dark:text-green-400">{message}</p>
          </div>
        )}

        {status === 'error' && (
          <div className="flex items-start gap-3">
            <svg
              className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            <div className="flex-1">
              <p className="text-sm text-red-600 dark:text-red-400">{message}</p>
              <div className="mt-4">
                <a href="/auth/register" className="text-primary hover:underline font-medium text-sm">
                  Zarejestruj się ponownie
                </a>
                {' lub '}
                <a href="/auth/login" className="text-primary hover:underline font-medium text-sm">
                  Zaloguj się
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConfirmEmail;
