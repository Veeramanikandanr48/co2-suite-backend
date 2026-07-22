export interface INotificationPayload {
  title: string;
  body: string;
  userId: number;
  createdBy?: number;
  updatedBy?: number;
  userNotificationId?: number;
}
