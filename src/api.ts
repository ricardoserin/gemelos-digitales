import { AlertNotification, Equipment, MiningFleetKPIs, SparePartItem, WorkOrder, WorkOrderStatus } from './types';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers || {}),
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`${response.status} ${response.statusText}: ${body}`);
  }

  return response.json() as Promise<T>;
}

export interface TelemetryHistoryItem {
  id: number;
  equipmentId: string;
  capturedAt: string;
  telemetry: Equipment['telemetry'];
}

export const api = {
  getFleet: () => request<Equipment[]>('/api/fleet'),
  getAlerts: () => request<AlertNotification[]>('/api/alerts'),
  getWorkOrders: () => request<WorkOrder[]>('/api/work-orders'),
  getSpareParts: () => request<SparePartItem[]>('/api/spare-parts'),
  getKpis: () => request<MiningFleetKPIs>('/api/kpis'),
  getTelemetryHistory: (equipmentId: string, limit = 30) =>
    request<TelemetryHistoryItem[]>(`/api/telemetry/${equipmentId}/history?limit=${limit}`),
  simulateTelemetry: () => request<Equipment[]>('/api/telemetry/simulate', { method: 'POST' }),
  createWorkOrder: (workOrder: WorkOrder) =>
    request<WorkOrder>('/api/work-orders', { method: 'POST', body: JSON.stringify(workOrder) }),
  updateWorkOrderStatus: (id: string, status: WorkOrderStatus) =>
    request<WorkOrder>(`/api/work-orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
  acknowledgeAlert: (id: string, user: string, notes: string) =>
    request<AlertNotification>(`/api/alerts/${id}/acknowledge`, {
      method: 'POST',
      body: JSON.stringify({ user, notes }),
    }),
};
