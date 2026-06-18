import axiosClient from './axiosClient';
import type { MeetingRequest, ProcessHistory } from '../types';

export const requestApi = {
  create: (data: any): Promise<{ success: boolean; data: MeetingRequest }> => 
    axiosClient.post('/api/meetings', data),
  getMy: (): Promise<{ success: boolean; data: MeetingRequest[] }> => 
    axiosClient.get('/api/meetings/my'),
  getById: (id: number): Promise<{ success: boolean; data: MeetingRequest }> => 
    axiosClient.get(`/api/meetings/${id}`),
  start: (id: number): Promise<{ success: boolean; data: MeetingRequest }> => 
    axiosClient.post(`/api/meetings/${id}/start`),
  getHistory: (id: number): Promise<{ success: boolean; data: ProcessHistory[] }> => 
    axiosClient.get(`/api/meetings/${id}/history`),
};
export default requestApi;

