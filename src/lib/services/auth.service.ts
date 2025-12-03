import type { User, Session } from '@supabase/supabase-js';
import type { AppSupabaseClient } from '../../db/supabase.client.ts';

// Custom error classes for better error handling
export class InvalidCredentialsError extends Error {
  constructor(message = 'Nieprawidłowy adres e-mail lub hasło') {
    super(message);
    this.name = 'InvalidCredentialsError';
  }
}

export class EmailAlreadyExistsError extends Error {
  constructor(message = 'Konto z tym adresem e-mail już istnieje') {
    super(message);
    this.name = 'EmailAlreadyExistsError';
  }
}

export class InvalidTokenError extends Error {
  constructor(message = 'Token resetowania jest nieprawidłowy lub wygasł') {
    super(message);
    this.name = 'InvalidTokenError';
  }
}

export class SupabaseAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SupabaseAuthError';
  }
}

/**
 * Maps Supabase Auth errors to application-specific errors
 */
function mapSupabaseError(error: { message: string; status?: number }): Error {
  const message = error.message.toLowerCase();

  // Invalid credentials
  if (
    message.includes('invalid login credentials') ||
    message.includes('invalid_credentials') ||
    message.includes('email not confirmed') ||
    error.status === 400
  ) {
    return new InvalidCredentialsError();
  }

  // Email already exists
  if (
    message.includes('user already registered') ||
    message.includes('email already exists') ||
    message.includes('already registered')
  ) {
    return new EmailAlreadyExistsError();
  }

  // Invalid token
  if (message.includes('invalid token') || message.includes('token expired') || message.includes('token_not_found')) {
    return new InvalidTokenError();
  }

  // Generic Supabase error
  return new SupabaseAuthError(error.message || 'Wystąpił błąd podczas autentykacji');
}

/**
 * Logs in a user with email and password
 */
export async function loginUser(
  supabase: AppSupabaseClient,
  email: string,
  password: string
): Promise<{ user: User; session: Session }> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });

  if (error) {
    throw mapSupabaseError(error);
  }

  if (!data.user || !data.session) {
    throw new SupabaseAuthError('Nie udało się zalogować. Spróbuj ponownie.');
  }

  return {
    user: data.user,
    session: data.session,
  };
}

/**
 * Registers a new user
 * Returns session as null if email confirmation is required
 * @param emailRedirectTo - URL to redirect to after email confirmation (optional)
 */
export async function registerUser(
  supabase: AppSupabaseClient,
  email: string,
  password: string,
  emailRedirectTo?: string
): Promise<{ user: User; session: Session | null }> {
  const signUpOptions: {
    email: string;
    password: string;
    options?: { emailRedirectTo?: string };
  } = {
    email: email.trim(),
    password,
  };

  // Add email redirect URL if provided
  // This ensures the confirmation email contains the correct redirect link
  if (emailRedirectTo) {
    signUpOptions.options = {
      emailRedirectTo,
    };
  }

  const { data, error } = await supabase.auth.signUp(signUpOptions);

  if (error) {
    throw mapSupabaseError(error);
  }

  if (!data.user) {
    throw new SupabaseAuthError('Nie udało się zarejestrować. Spróbuj ponownie.');
  }

  // If session is null, it means email confirmation is required
  // Don't try to auto-login in this case, as the user needs to confirm their email first
  return {
    user: data.user,
    session: data.session ?? null,
  };
}

/**
 * Logs out the current user
 */
export async function logoutUser(supabase: AppSupabaseClient): Promise<void> {
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw mapSupabaseError(error);
  }
}

/**
 * Gets the current user from the session
 */
export async function getCurrentUser(supabase: AppSupabaseClient): Promise<User | null> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    return null;
  }

  return user;
}

/**
 * Sends a password reset email to the user
 * @param email - User's email address
 * @param redirectTo - URL to redirect to after password reset (should point to reset-password page)
 */
export async function resetPasswordForEmail(
  supabase: AppSupabaseClient,
  email: string,
  redirectTo?: string
): Promise<void> {
  // Supabase resetPasswordForEmail accepts options as second parameter
  // redirectTo must be a full URL (not relative path) and must be in additional_redirect_urls
  const options = redirectTo ? { redirectTo } : undefined;

  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), options);

  if (error) {
    throw mapSupabaseError(error);
  }
}

/**
 * Updates user password using a password reset token
 * This should be called after the user clicks the reset link from their email
 * @param supabase - Supabase client instance
 * @param newPassword - New password to set
 */
export async function updatePasswordWithToken(supabase: AppSupabaseClient, newPassword: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) {
    throw mapSupabaseError(error);
  }
}
