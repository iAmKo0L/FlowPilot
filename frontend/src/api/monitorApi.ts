import axiosClient from './axiosClient';
import type { MeetingRequest, ProcessHistory, DashboardStats } from '../types';

export const monitorApi = {
  getProcesses: (): Promise<{ success: boolean; data: MeetingRequest[] }> => 
    axiosClient.get('/api/admin/monitor/meetings'),
  getProcessDetail: (id: number): Promise<{ success: boolean; data: MeetingRequest }> => 
    axiosClient.get(`/api/meetings/${id}`),
  getHistory: (id: number): Promise<{ success: boolean; data: ProcessHistory[] }> => 
    axiosClient.get(`/api/admin/monitor/meetings/${id}/history`),
  getStats: (): Promise<{ success: boolean; data: DashboardStats }> => 
    axiosClient.get('/api/admin/monitor/dashboard'),
};
export default monitorApi;
