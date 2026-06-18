export interface User {
  id?: number;
  username: string;
  fullName: string;
  email: string;
  roles: string[];
}

export interface LoginResponse {
  token: string;
  username: string;
  fullName: string;
  email: string;
  roles: string[];
}

export interface WorkflowStep {
  id?: number;
  stepKey: string;
  stepName: string;
  stepType: 'START' | 'SERVICE_TASK' | 'USER_TASK' | 'CONDITION' | 'APPROVE' | 'END';
  assigneeRole?: string;
  orderIndex: number;
  configJson?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface WorkflowFormField {
  id?: number;
  fieldKey: string;
  fieldLabel: string;
  fieldType: 'TEXT' | 'NUMBER' | 'DATE' | 'BOOLEAN' | 'SELECT' | 'TEXTAREA';
  required: boolean;
  optionsJson?: string;
  defaultValue?: string;
  validationJson?: string;
  orderIndex: number;
  sensitive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface WorkflowDefinition {
  id?: number;
  code: string;
  name: string;
  description?: string;
  version: number;
  status: 'DRAFT' | 'DEPLOYED' | 'DISABLED';
  bpmnProcessKey?: string;
  deploymentId?: string;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
  steps: WorkflowStep[];
  formFields?: WorkflowFormField[];
}

export interface Equipment {
  id: number;
  equipmentCode: string;
  equipmentName: string;
  status: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';
  description?: string;
}

export interface MeetingRoom {
  id: number;
  roomCode: string;
  roomName: string;
  location?: string;
  capacity: number;
  status: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';
  description?: string;
  equipments: Equipment[];
}

export interface MeetingAttendee {
  id: number;
  userId?: number;
  attendeeName?: string;
  attendeeEmail: string;
  attendeeType: 'INTERNAL' | 'GUEST';
  responseStatus: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'TENTATIVE';
  responseToken?: string;
  respondedAt?: string;
}

export interface MeetingRequest {
  id: number;
  requestCode: string;
  workflowId: number;
  workflowName: string;
  roomId?: number;
  roomName?: string;
  roomCode?: string;
  title: string;
  meetingContent: string;
  meetingType: 'ONLINE' | 'OFFLINE' | 'HYBRID';
  onlineMeetingLink?: string;
  startTime: string;
  endTime: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  status: 'DRAFT' | 'VALIDATION_FAILED' | 'PENDING_APPROVAL' | 'REJECTED' | 'CONFIRMED' | 'CANCELLED' | 'FAILED';
  holdUntil?: string;
  processInstanceId?: string;
  createdBy: string;
  approvedBy?: string;
  approverComment?: string;
  equipments: Equipment[];
  attendees: MeetingAttendee[];
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  name: string;
  taskDefinitionKey: string;
  assignee?: string;
  candidateGroup?: string;
  requestId: number;
  requestCode: string;
  requestTitle: string;
  content?: string;
  status: 'CREATED' | 'CLAIMED' | 'COMPLETED';
  createdAt: string;
}

export interface ProcessHistory {
  id: number;
  action: string;
  actor: string;
  taskName?: string;
  comment?: string;
  oldStatus?: string;
  newStatus?: string;
  createdAt: string;
}

export interface Notification {
  id: number;
  meetingRequestId?: number;
  recipientUsername?: string;
  recipientEmail?: string;
  recipientType: 'INTERNAL' | 'GUEST';
  title: string;
  message: string;
  type: 'APPROVAL_REQUEST' | 'APPROVED' | 'REJECTED' | 'INVITATION' | 'INFO';
  status: 'SENT' | 'FAILED' | 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'TENTATIVE';
  createdAt: string;
}

export interface DashboardStats {
  totalRequests: number;
  runningProcesses: number;
  approvedRequests: number;
  rejectedRequests: number;
  completedRequests: number;
  failedRequests: number;
}
