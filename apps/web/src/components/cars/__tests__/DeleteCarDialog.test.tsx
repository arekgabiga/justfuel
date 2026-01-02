import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { customRender, setupUser, createMockCarDetails } from '@/test-utils';
import { DeleteCarDialog } from '../DeleteCarDialog';
import type { DeleteCarCommand } from '@/types';

describe('DeleteCarDialog', () => {
  const mockCar = createMockCarDetails({ name: 'Test Car' });
  const mockOnDelete = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should not render when isOpen is false', () => {
      const { container } = customRender(
        <DeleteCarDialog car={mockCar} isOpen={false} onDelete={mockOnDelete} onCancel={mockOnCancel} />
      );

      expect(container.firstChild).toBeNull();
    });

    it('should render modal when isOpen is true', () => {
      customRender(<DeleteCarDialog car={mockCar} isOpen={true} onDelete={mockOnDelete} onCancel={mockOnCancel} />);

      expect(screen.getByRole('heading', { name: /usuń samochód/i })).toBeInTheDocument();
    });

    it('should display car name in confirmation message', () => {
      customRender(<DeleteCarDialog car={mockCar} isOpen={true} onDelete={mockOnDelete} onCancel={mockOnCancel} />);

      expect(screen.getByText(new RegExp(mockCar.name))).toBeInTheDocument();
    });

    it('should display warning message about irreversibility', () => {
      customRender(<DeleteCarDialog car={mockCar} isOpen={true} onDelete={mockOnDelete} onCancel={mockOnCancel} />);

      expect(screen.getByText(/ta operacja jest nieodwracalna/i)).toBeInTheDocument();
      expect(screen.getByText(/wszystkie tankowania.*zostaną trwale usunięte/i)).toBeInTheDocument();
    });
  });

  describe('Confirmation Validation', () => {
    it('should have submit button disabled when confirmation name is empty', () => {
      customRender(<DeleteCarDialog car={mockCar} isOpen={true} onDelete={mockOnDelete} onCancel={mockOnCancel} />);

      const submitButton = screen.getByRole('button', { name: /usuń samochód/i });
      expect(submitButton).toBeDisabled();
    });

    it('should have submit button disabled when confirmation name does not match', async () => {
      const user = setupUser();
      customRender(<DeleteCarDialog car={mockCar} isOpen={true} onDelete={mockOnDelete} onCancel={mockOnCancel} />);

      const input = screen.getByLabelText(/potwierdź nazwą/i);
      await user.type(input, 'Wrong Name');

      const submitButton = screen.getByRole('button', { name: /usuń samochód/i });
      expect(submitButton).toBeDisabled();
    });

    it('should enable submit button when confirmation name matches car name', async () => {
      const user = setupUser();
      customRender(<DeleteCarDialog car={mockCar} isOpen={true} onDelete={mockOnDelete} onCancel={mockOnCancel} />);

      const input = screen.getByLabelText(/potwierdź nazwą/i);
      await user.type(input, mockCar.name);

      const submitButton = screen.getByRole('button', { name: /usuń samochód/i });
      expect(submitButton).not.toBeDisabled();
    });

    it('should keep submit button disabled when confirmation name does not match', async () => {
      const user = setupUser();
      customRender(<DeleteCarDialog car={mockCar} isOpen={true} onDelete={mockOnDelete} onCancel={mockOnCancel} />);

      const input = screen.getByLabelText(/potwierdź nazwą/i);
      await user.type(input, 'Wrong Name');

      const submitButton = screen.getByRole('button', { name: /usuń samochód/i });
      expect(submitButton).toBeDisabled();

      // Even after enabling and changing back, button should remain disabled
      await user.clear(input);
      await user.type(input, mockCar.name);
      expect(submitButton).not.toBeDisabled();

      await user.clear(input);
      await user.type(input, 'Different Wrong Name');
      expect(submitButton).toBeDisabled();
    });
  });

  describe('Submit Handling', () => {
    it('should call onDelete with DeleteCarCommand when form is submitted', async () => {
      const user = setupUser();
      mockOnDelete.mockResolvedValue(undefined);

      customRender(<DeleteCarDialog car={mockCar} isOpen={true} onDelete={mockOnDelete} onCancel={mockOnCancel} />);

      const input = screen.getByLabelText(/potwierdź nazwą/i);
      await user.type(input, mockCar.name);

      const submitButton = screen.getByRole('button', { name: /usuń samochód/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnDelete).toHaveBeenCalledWith({
          confirmation_name: mockCar.name,
        } as DeleteCarCommand);
      });
    });

    it('should show loading state during deletion', async () => {
      const user = setupUser();
      let resolveDelete: (() => void) | undefined;
      const deletePromise = new Promise<void>((resolve) => {
        resolveDelete = resolve;
      });
      mockOnDelete.mockReturnValue(deletePromise);

      customRender(<DeleteCarDialog car={mockCar} isOpen={true} onDelete={mockOnDelete} onCancel={mockOnCancel} />);

      const input = screen.getByLabelText(/potwierdź nazwą/i);
      await user.type(input, mockCar.name);

      const submitButton = screen.getByRole('button', { name: /usuń samochód/i });
      await user.click(submitButton);

      expect(screen.getByRole('button', { name: /usuwanie/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /usuwanie/i })).toBeDisabled();

      // Resolve and wait for state update to complete
      if (resolveDelete) resolveDelete();
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /usuń samochód/i })).toBeInTheDocument();
      });
    });

    it('should display error message when deletion fails', async () => {
      const user = setupUser();
      const errorMessage = 'Failed to delete car';
      mockOnDelete.mockRejectedValue(new Error(errorMessage));

      customRender(<DeleteCarDialog car={mockCar} isOpen={true} onDelete={mockOnDelete} onCancel={mockOnCancel} />);

      const input = screen.getByLabelText(/potwierdź nazwą/i);
      await user.type(input, mockCar.name);

      const submitButton = screen.getByRole('button', { name: /usuń samochód/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });
    });
  });

  describe('Cancel Handling', () => {
    it('should call onCancel when cancel button is clicked', async () => {
      const user = setupUser();
      customRender(<DeleteCarDialog car={mockCar} isOpen={true} onDelete={mockOnDelete} onCancel={mockOnCancel} />);

      const cancelButton = screen.getByRole('button', { name: /anuluj/i });
      await user.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalled();
    });

    it('should disable cancel button during loading', async () => {
      const user = setupUser();
      let resolveDelete: (() => void) | undefined;
      const deletePromise = new Promise<void>((resolve) => {
        resolveDelete = resolve;
      });
      mockOnDelete.mockReturnValue(deletePromise);

      customRender(<DeleteCarDialog car={mockCar} isOpen={true} onDelete={mockOnDelete} onCancel={mockOnCancel} />);

      const input = screen.getByLabelText(/potwierdź nazwą/i);
      await user.type(input, mockCar.name);

      const submitButton = screen.getByRole('button', { name: /usuń samochód/i });
      await user.click(submitButton);

      const cancelButton = screen.getByRole('button', { name: /anuluj/i });
      expect(cancelButton).toBeDisabled();

      // Resolve and wait for state update to complete
      if (resolveDelete) resolveDelete();
      await waitFor(() => {
        expect(cancelButton).not.toBeDisabled();
      });
    });
  });

  describe('ESC Key Handling', () => {
    it('should call onCancel when ESC key is pressed', async () => {
      const user = setupUser();
      customRender(<DeleteCarDialog car={mockCar} isOpen={true} onDelete={mockOnDelete} onCancel={mockOnCancel} />);

      await user.keyboard('{Escape}');

      expect(mockOnCancel).toHaveBeenCalled();
    });

    it('should not call onCancel on ESC when loading', async () => {
      const user = setupUser();
      let resolveDelete: (() => void) | undefined;
      const deletePromise = new Promise<void>((resolve) => {
        resolveDelete = resolve;
      });
      mockOnDelete.mockReturnValue(deletePromise);

      customRender(<DeleteCarDialog car={mockCar} isOpen={true} onDelete={mockOnDelete} onCancel={mockOnCancel} />);

      const input = screen.getByLabelText(/potwierdź nazwą/i);
      await user.type(input, mockCar.name);

      const submitButton = screen.getByRole('button', { name: /usuń samochód/i });
      await user.click(submitButton);

      await user.keyboard('{Escape}');

      expect(mockOnCancel).not.toHaveBeenCalled();

      // Resolve and wait for state update to complete
      if (resolveDelete) resolveDelete();
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /usuń samochód/i })).toBeInTheDocument();
      });
    });
  });

  describe('State Reset', () => {
    it('should reset state when dialog is closed and reopened', async () => {
      const user = setupUser();
      const { rerender } = customRender(
        <DeleteCarDialog car={mockCar} isOpen={true} onDelete={mockOnDelete} onCancel={mockOnCancel} />
      );

      // Type something in the input
      const input = screen.getByLabelText(/potwierdź nazwą/i);
      await user.type(input, 'Some text');

      // Close dialog
      rerender(<DeleteCarDialog car={mockCar} isOpen={false} onDelete={mockOnDelete} onCancel={mockOnCancel} />);

      // Reopen dialog
      rerender(<DeleteCarDialog car={mockCar} isOpen={true} onDelete={mockOnDelete} onCancel={mockOnCancel} />);

      // Input should be empty
      const newInput = screen.getByLabelText(/potwierdź nazwą/i);
      expect(newInput).toHaveValue('');
    });

    it('should clear error when dialog is closed and reopened', async () => {
      const user = setupUser();
      mockOnDelete.mockRejectedValue(new Error('Test error'));

      const { rerender } = customRender(
        <DeleteCarDialog car={mockCar} isOpen={true} onDelete={mockOnDelete} onCancel={mockOnCancel} />
      );

      const input = screen.getByLabelText(/potwierdź nazwą/i);
      await user.type(input, mockCar.name);

      const submitButton = screen.getByRole('button', { name: /usuń samochód/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Test error')).toBeInTheDocument();
      });

      // Close dialog
      rerender(<DeleteCarDialog car={mockCar} isOpen={false} onDelete={mockOnDelete} onCancel={mockOnCancel} />);

      // Reopen dialog
      rerender(<DeleteCarDialog car={mockCar} isOpen={true} onDelete={mockOnDelete} onCancel={mockOnCancel} />);

      // Error should be cleared
      expect(screen.queryByText('Test error')).not.toBeInTheDocument();
    });
  });

  describe('Input Interaction', () => {
    it('should clear error when user types in input after error', async () => {
      const user = setupUser();
      mockOnDelete.mockRejectedValue(new Error('Test error'));

      customRender(<DeleteCarDialog car={mockCar} isOpen={true} onDelete={mockOnDelete} onCancel={mockOnCancel} />);

      const input = screen.getByLabelText(/potwierdź nazwą/i);
      await user.type(input, mockCar.name);

      const submitButton = screen.getByRole('button', { name: /usuń samochód/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Test error')).toBeInTheDocument();
      });

      // Type in input
      await user.clear(input);
      await user.type(input, 'New text');

      // Error should be cleared
      expect(screen.queryByText('Test error')).not.toBeInTheDocument();
    });
  });
});
