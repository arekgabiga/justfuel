import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';

const AuthHeader: React.FC = () => {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);

    try {
      // TODO: Replace with actual API call when backend is implemented
      // const response = await fetch('/api/auth/logout', {
      //   method: 'POST',
      //   credentials: 'include',
      // });

      // Placeholder for now - will be implemented with backend
      console.log('Logout attempt');

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      // For now, just redirect to login
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    } catch (error) {
      console.error('Error during logout:', error);
      // Even on error, redirect to login
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <header className="w-full flex justify-end items-center p-4">
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
    </header>
  );
};

export default AuthHeader;
