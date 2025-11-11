import type { User, Session } from '@supabase/supabase-js';
import type { AppSupabaseClient } from '../../db/supabase.client.ts';

// Custom error classes for better error handling
export class InvalidCredentialsError extends Error {
  constructor(message: string = 'Nieprawidłowy adres e-mail lub hasło') {
    super(message);
    this.name = 'InvalidCredentialsError';
  }
}

export class EmailAlreadyExistsError extends Error {
  constructor(message: string = 'Konto z tym adresem e-mail już istnieje') {
    super(message);
    this.name = 'EmailAlreadyExistsError';
  }
}

export class InvalidTokenError extends Error {
  constructor(message: string = 'Token resetowania jest nieprawidłowy lub wygasł') {
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
  if (
    message.includes('invalid token') ||
    message.includes('token expired') ||
    message.includes('token_not_found')
  ) {
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
  password: string,
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
 * Registers a new user and automatically logs them in
 */
export async function registerUser(
  supabase: AppSupabaseClient,
  email: string,
  password: string,
): Promise<{ user: User; session: Session }> {
  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
  });

  if (error) {
    throw mapSupabaseError(error);
  }

  if (!data.user) {
    throw new SupabaseAuthError('Nie udało się zarejestrować. Spróbuj ponownie.');
  }

  // If session is not automatically created, sign in after signup
  if (!data.session) {
    const loginResult = await loginUser(supabase, email, password);
    return loginResult;
  }

  return {
    user: data.user,
    session: data.session,
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

