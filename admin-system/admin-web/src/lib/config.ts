/**
 * Centralized API configuration for the Admin Dashboard.
 * This allows the dashboard to switch between local development
 * and production (Render) environments easily.
 */

// In Vite, environment variables are accessed via import.meta.env
// VITE_API_URL can be set in the deployment environment (e.g., Render)
const VITE_API_URL = import.meta.env.VITE_API_URL;

// Fallback to localhost:5001 for development if no environment variable is set
export const API_BASE_URL = VITE_API_URL || 'http://localhost:5001';

console.log(`[Admin] API Base URL: ${API_BASE_URL}`);
