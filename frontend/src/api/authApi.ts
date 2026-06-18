import axiosClient from './axiosClient';
import type { LoginResponse, User } from '../types';

export const authApi = {
  login: (data: any): Promise<{ success: boolean; data: LoginResponse }> => 
    axiosClient.post('/api/auth/login', data),
  register: (data: any): Promise<{ success: boolean; data: User }> => 
    axiosClient.post('/api/auth/register', data),
  me: (): Promise<{ success: boolean; data: User }> => 
    axiosClient.get('/api/auth/me'),
};
export default authApi;
