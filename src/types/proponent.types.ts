// Represents a research proponent/user submitting applications/protocols
export interface ProponentsType {
    id: string;               // Unique user ID (usually from Firebase Auth or your user table)
    email: string;            // User's email address (must be unique)
    name: string;             // Full name of the proponent
    createdAt: string;        // ISO timestamp (when profile/account was created)
  }
  