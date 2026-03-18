export interface LitwaveEvent {
  id: string;
  message: string;
  name?: string;
  scheduledTime?: number; // unix timestamp (seconds)
}
