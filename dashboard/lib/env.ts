// ==============================================================================
// OpenDX-Lab Dashboard - Environment Variable Validation
// SPDX-License-Identifier: GPL-3.0-or-later
// ==============================================================================

/**
 * Get a required environment variable or throw at startup.
 * Provides consistent error messages and catches missing config early.
 */
export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

/**
 * Get an optional environment variable with a default value.
 */
export function optionalEnv(name: string, defaultValue: string): string {
  return process.env[name] ?? defaultValue;
}
