import axiosClient from './axiosClient';
import type { MeetingAttendee } from '../types';

export const attendeeApi = {
  getAttendees: (meetingId: number): Promise<{ success: boolean; data: MeetingAttendee[] }> => 
    axiosClient.get(`/api/meetings/${meetingId}/attendees`),
  respondInternal: (meetingId: number, attendeeId: number, responseStatus: string): Promise<{ success: boolean }> => 
    axiosClient.post(`/api/meetings/${meetingId}/attendees/${attendeeId}/response`, { responseStatus }),
  respondExternal: (token: string, responseStatus: string): Promise<{ success: boolean }> => 
    axiosClient.post(`/api/public/attendee-response/${token}`, { responseStatus }),
  getSummary: (meetingId: number): Promise<{ success: boolean; data: Record<string, number> }> => 
    axiosClient.get(`/api/meetings/${meetingId}/attendee-responses`),
};

export default attendeeApi;
