// User Types
export interface User {
  id: string;
  username: string;
  email: string;
  profilePicture?: string;
  createdAt: Date;
  ratings?: Rating[];
}

// Pub Types
export interface Pub {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  phoneNumber?: string;
  website?: string;
  openingHours?: string;
  photos?: Photo[];
  ratings?: Rating[];
  averageRating?: number;
}

// Rating Types
export interface Rating {
  id: string;
  userId: string;
  pubId: string;
  score: number; // 1-10 scale
  comment?: string;
  date: Date;
  photos?: Photo[];
  user?: User;
  pub?: Pub;
}

// Photo Types
export interface Photo {
  id: string;
  url: string;
  userId: string;
  pubId?: string;
  ratingId?: string;
  createdAt: Date;
}

// Authentication Types
export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}