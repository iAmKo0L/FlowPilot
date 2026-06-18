import axiosClient from './axiosClient';
import type { Task } from '../types';

export const taskApi = {
  getMy: (): Promise<{ success: boolean; data: Task[] }> => 
    axiosClient.get('/api/meeting-tasks/my'),
  getById: (id: string): Promise<{ success: boolean; data: Task }> => 
    axiosClient.get(`/api/meeting-tasks/${id}`),
  claim: (id: string): Promise<{ success: boolean }> => 
    axiosClient.post(`/api/meeting-tasks/${id}/claim`),
  complete: (id: string, data: any): Promise<{ success: boolean }> => 
    axiosClient.post(`/api/meeting-tasks/${id}/complete`, data),
  approve: (id: string, comment?: string): Promise<{ success: boolean }> => 
    axiosClient.post(`/api/meeting-tasks/${id}/approve`, null, { params: { comment } }),
  reject: (id: string, comment?: string): Promise<{ success: boolean }> => 
    axiosClient.post(`/api/meeting-tasks/${id}/reject`, null, { params: { comment } }),
};
export default taskApi;
