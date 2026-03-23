import NetInfo from '@react-native-community/netinfo';
import { apiService } from './api';
import { cacheService } from './cache';
import { CACHE_CONFIG } from '@utils/constants';

class SyncService {
  private isSyncingState = false;
  private syncInterval: ReturnType<typeof setInterval> | null = null;

  startAutoSync(): void {
    if (this.syncInterval) return;

    this.sync();
    this.syncInterval = setInterval(() => {
      this.sync();
    }, CACHE_CONFIG.syncIntervalSeconds * 1000);
  }

  stopAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  async sync(): Promise<boolean> {
    if (this.isSyncingState) return false;

    try {
      this.isSyncingState = true;

      const netInfo = await NetInfo.fetch();
      if (!netInfo.isConnected || !netInfo.isInternetReachable) {
        console.warn('No internet connection, skipping sync');
        return false;
      }

      const queue = await cacheService.getSyncQueue();
      if (queue.length === 0) {
        return true;
      }

      console.log(`Syncing ${queue.length} operations...`);

      let successCount = 0;
      for (const operation of queue) {
        try {
          await this.executeOperation(operation);
          await cacheService.removeFromSyncQueue(operation.id);
          successCount++;
        } catch (error) {
          console.error(`Error syncing operation ${operation.id}:`, error);
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
}

export const syncService = new SyncService();
