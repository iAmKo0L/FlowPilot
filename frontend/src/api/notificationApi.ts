import axiosClient from './axiosClient';
import type { Notification } from '../types';

export const notificationApi = {
  getMy: (): Promise<{ success: boolean; data: Notification[] }> => 
    axiosClient.get('/api/notifications/my'),
  getMeetingNotifications: (meetingId: number): Promise<{ success: boolean; data: Notification[] }> => 
    axiosClient.get(`/api/meetings/${meetingId}/notifications`),
};

export default notificationApi;
