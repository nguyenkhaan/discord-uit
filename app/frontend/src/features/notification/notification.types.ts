export interface Notification {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface SendNotificationPayload {
  title: string;
  message: string;
  recipientId?: string; 
}