import { ApiResponse, User, Pub, Rating, Photo } from '@/types';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Base API configuration
const API_URL = 'http://localhost:3000/api';

// Prepare headers with authentication if token exists
const getHeaders = async () => {
  const token = await AsyncStorage.getItem('auth_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

// Generic API request function
const apiRequest = async <T>(
  endpoint: string,
  method: string = 'GET',
  data?: any
): Promise<ApiResponse<T>> => {
  try {
    const headers = await getHeaders();
    const url = `${API_URL}${endpoint}`;
    
    const requestOptions: RequestInit = {
      method,
      headers,
      ...(data ? { body: JSON.stringify(data) } : {}),
    };
    
    const response = await fetch(url, requestOptions);
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || 'An error occurred');
    }
    
    return {
      success: true,
      data: result,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

// Auth API functions
export const authAPI = {
  login: (email: string, password: string) => 
    apiRequest<{ user: User; token: string }>('/auth/login', 'POST', { email, password }),
  
  register: (username: string, email: string, password: string) => 
    apiRequest<{ user: User; token: string }>('/auth/register', 'POST', { username, email, password }),
  
  logout: () => AsyncStorage.removeItem('auth_token'),
  
  getCurrentUser: () => apiRequest<User>('/auth/me'),
};

// Pubs API functions
export const pubsAPI = {
  getAllPubs: () => apiRequest<Pub[]>('/pubs'),
  
  getPubById: (id: string) => apiRequest<Pub>(`/pubs/${id}`),
  
  getNearbyPubs: (latitude: number, longitude: number, radius: number = 5) => 
    apiRequest<Pub[]>(`/pubs/nearby?lat=${latitude}&lng=${longitude}&radius=${radius}`),
  
  searchPubs: (query: string) => apiRequest<Pub[]>(`/pubs/search?q=${encodeURIComponent(query)}`),
};

// Ratings API functions
export const ratingsAPI = {
  getRatingsByPubId: (pubId: string) => 
    apiRequest<Rating[]>(`/ratings/pub/${pubId}`),
  
  getRatingsByUserId: (userId: string) => 
    apiRequest<Rating[]>(`/ratings/user/${userId}`),
  
  addRating: (pubId: string, score: number, comment?: string) => 
    apiRequest<Rating>('/ratings', 'POST', { pubId, score, comment }),
  
  updateRating: (ratingId: string, score: number, comment?: string) => 
    apiRequest<Rating>(`/ratings/${ratingId}`, 'PUT', { score, comment }),
  
  deleteRating: (ratingId: string) => 
    apiRequest(`/ratings/${ratingId}`, 'DELETE'),
};

// Photos API functions
export const photosAPI = {
  uploadPhoto: (pubId: string, ratingId: string, base64Image: string) => 
    apiRequest<Photo>('/photos', 'POST', { pubId, ratingId, image: base64Image }),
  
  deletePhoto: (photoId: string) => 
    apiRequest(`/photos/${photoId}`, 'DELETE'),
};