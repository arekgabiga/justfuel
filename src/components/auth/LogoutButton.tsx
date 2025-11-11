import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';

const LogoutButton: React.FC = () => {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);

    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error?.message || 'Błąd podczas wylogowywania');
      }

      // Redirect to login page after successful logout
      if (typeof window !== 'undefined') {
        window.location.href = '/auth/login';
      }
    } catch (error) {
      console.error('Error during logout:', error);
      // Even on error, redirect to login
      if (typeof window !== 'undefined') {
        window.location.href = '/auth/login';
      }
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleLogout}
      disabled={isLoggingOut}
      className="gap-2"
      aria-label="Wyloguj się"
    >
      <LogOut className="size-4" aria-hidden="true" />
      {isLoggingOut ? 'Wylogowywanie...' : 'Wyloguj'}
    </Button>
  );
};

export default LogoutButton;

