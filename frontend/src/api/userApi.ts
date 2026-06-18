import axiosClient from './axiosClient';
import type { User } from '../types';

export interface AttendeeResolveResult {
  email: string;
  type: 'INTERNAL' | 'GUEST';
  userId?: number;
  name?: string;
}

export const userApi = {
  search: (keyword: string): Promise<{ success: boolean; data: User[] }> => 
    axiosClient.get('/api/users/search', { params: { keyword } }),
  resolve: (emails: string[]): Promise<{ success: boolean; data: AttendeeResolveResult[] }> => 
    axiosClient.post('/api/attendees/resolve', emails),
};

export default userApi;
