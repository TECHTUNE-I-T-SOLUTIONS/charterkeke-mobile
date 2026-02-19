import NetInfo from '@react-native-community/netinfo';
import { apiService } from './api';
import { cacheService } from './cache';
import { CACHE_CONFIG } from '@utils/constants';

class SyncService {
  private isSyncingState = false;
  private syncInterval: ReturnType<typeof setInterval> | null = null;

  /**
   * Start automatic sync service
   */
  startAutoSync(): void {
    if (this.syncInterval) return;

    // Initial sync
    this.sync();

    // Periodic sync
    this.syncInterval = setInterval(() => {
      this.sync();
    }, CACHE_CONFIG.syncIntervalSeconds * 1000);
  }

  /**
   * Stop automatic sync service
   */
  stopAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  /**
   * Perform manual sync
   */
  async sync(): Promise<boolean> {
    if (this.isSyncingState) return false;

    try {
      this.isSyncingState = true;

      // Check network connectivity
      const netInfo = await NetInfo.fetch();
      if (!netInfo.isConnected || !netInfo.isInternetReachable) {
        console.warn('No internet connection, skipping sync');
        return false;
      }

      // Get sync queue
      const queue = await cacheService.getSyncQueue();
      if (queue.length === 0) {
        return true;
      }

      console.log(`Syncing ${queue.length} operations...`);

      // Process each operation
      let successCount = 0;
      for (const operation of queue) {
        try {
          await this.executeOperation(operation);
          await cacheService.removeFromSyncQueue(operation.id);
          successCount++;
        } catch (error) {
          console.error(`Error syncing operation ${operation.id}:`, error);
          // Don't remove failed operations, they'll be retried
        }
      }

      console.log(`Synced ${successCount}/${queue.length} operations`);
      return successCount === queue.length;
    } catch (error) {
      console.error('Sync error:', error);
      return false;
    } finally {
      this.isSyncingState = false;
    }
  }

  /**
   * Execute a single sync operation
   */
  private async executeOperation(operation: any): Promise<void> {
    const { type, endpoint, payload } = operation;

    switch (type) {
      case 'create':
        await apiService.post(endpoint, payload);
        break;
      case 'update':
        await apiService.put(endpoint, payload);
        break;
      case 'delete':
        await apiService.delete(endpoint);
        break;
      default:
        throw new Error(`Unknown operation type: ${type}`);
    }
  }

  /**
   * Check if sync is in progress
   */
  isSyncing(): boolean {
    return this.isSyncingState;
  }

  /**
   * Queue an operation for sync
   */
  async queueOperation(
    type: 'create' | 'update' | 'delete',
    endpoint: string,
    payload: any
  ): Promise<string> {
    const operationId = `${type}_${Date.now()}`;
    await cacheService.addToSyncQueue({
      id: operationId,
      type,
      endpoint,
      payload,
      timestamp: Date.now(),
    });
    return operationId;
  }

  /**
   * Sync user profile
   */
  async syncUserProfile(profile: any): Promise<void> {
    try {
      const netInfo = await NetInfo.fetch();
      if (netInfo.isConnected) {
        // Direct sync to server
        const endpoint = `/api/${profile.role}s/profile`;
        await apiService.post(endpoint, profile);
      } else {
        // Queue for later
        await this.queueOperation('update', `/api/${profile.role}s/profile`, profile);
      }
    } catch (error) {
      console.error('Error syncing user profile:', error);
      throw error;
    }
  }

  /**
   * Sync ride data
   */
  async syncRide(rideId: string, updates: any): Promise<void> {
    try {
      const netInfo = await NetInfo.fetch();
      if (netInfo.isConnected) {
        await apiService.put(`/api/rides/${rideId}`, updates);
      } else {
        await this.queueOperation('update', `/api/rides/${rideId}`, updates);
      }
    } catch (error) {
      console.error('Error syncing ride:', error);
      throw error;
    }
  }

  /**
   * Sync all pending operations
   */
  async syncPending(): Promise<number> {
    const queue = await cacheService.getSyncQueue();
    await this.sync();
    const remainingQueue = await cacheService.getSyncQueue();
    return queue.length - remainingQueue.length;
  }

  /**
   * Clear sync queue
   */
  async clearQueue(): Promise<void> {
    await cacheService.clearSyncQueue();
  }

  /**
   * Get pending operations count
   */
  async getPendingCount(): Promise<number> {
    const queue = await cacheService.getSyncQueue();
    return queue.length;
  }

  /**
   * Handle network state change
   */
  handleNetworkChange(isConnected: boolean): void {
    if (isConnected) {
      console.log('Network reconnected, attempting sync');
      this.sync();
    } else {
      console.log('Network disconnected, queuing operations');
    }
  }
}

export const syncService = new SyncService();
