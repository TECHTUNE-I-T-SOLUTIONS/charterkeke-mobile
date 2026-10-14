export type DeliveryState = {
  status: string;
  progress: number;
  etaEpochMillis: number;
  stopsRemaining: number;
  courierName: string;
  riderReassigned: boolean;
};

export type DeliveryInfo = {
  orderId: string;
};

export type DroptrackLiveAPI = {
  startDelivery(info: DeliveryInfo, state: DeliveryState): Promise<string>;
  updateDelivery(id: string, state: DeliveryState): Promise<void>;
  endDelivery(id: string, state: DeliveryState, dismissAfterSeconds?: number): Promise<void>;
  isSupported(): boolean;
  areActivitiesEnabled(): boolean;
};
