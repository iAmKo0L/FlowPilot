import axiosClient from './axiosClient';
import type { MeetingRoom, Equipment } from '../types';

export const roomApi = {
  getAll: (): Promise<{ success: boolean; data: MeetingRoom[] }> => 
    axiosClient.get('/api/rooms'),
  getById: (id: number): Promise<{ success: boolean; data: MeetingRoom }> => 
    axiosClient.get(`/api/rooms/${id}`),
  create: (data: any): Promise<{ success: boolean; data: MeetingRoom }> => 
    axiosClient.post('/api/admin/rooms', data),
  update: (id: number, data: any): Promise<{ success: boolean; data: MeetingRoom }> => 
    axiosClient.put(`/api/admin/rooms/${id}`, data),
  delete: (id: number): Promise<{ success: boolean }> => 
    axiosClient.delete(`/api/admin/rooms/${id}`),
};

export const equipmentApi = {
  getAll: (): Promise<{ success: boolean; data: Equipment[] }> => 
    axiosClient.get('/api/equipment'),
  getById: (id: number): Promise<{ success: boolean; data: Equipment }> => 
    axiosClient.get(`/api/equipment/${id}`),
  create: (data: any): Promise<{ success: boolean; data: Equipment }> => 
    axiosClient.post('/api/admin/equipment', data),
  update: (id: number, data: any): Promise<{ success: boolean; data: Equipment }> => 
    axiosClient.put(`/api/admin/equipment/${id}`, data),
  delete: (id: number): Promise<{ success: boolean }> => 
    axiosClient.delete(`/api/admin/equipment/${id}`),
};
