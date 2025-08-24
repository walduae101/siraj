import { getConfig } from "../config.js";

interface LoadSheddingConfig {
  queueLagThresholdMs: number;
  fraudExtrasEnabled: boolean;
  networkChecksEnabled: boolean;
  detailedLoggingEnabled: boolean;
}

class LoadSheddingService {
  private config: LoadSheddingConfig;
  private currentQueueLag: number = 0;

  constructor() {
    this.config = {
      queueLagThresholdMs: 5000, // 5 seconds
      fraudExtrasEnabled: true,
      networkChecksEnabled: true,
      detailedLoggingEnabled: true,
    };
  }

  /**
   * Update queue lag and determine if load shedding should be enabled
   */
  async updateQueueLag(lagMs: number): Promise<void> {
    this.currentQueueLag = lagMs;
    
    if (lagMs > this.config.queueLagThresholdMs) {
      await this.enableLoadShedding();
    } else {
      await this.disableLoadShedding();
    }
  }

  /**
   * Enable load shedding by disabling optional features
   */
  private async enableLoadShedding(): Promise<void> {
    if (!this.config.fraudExtrasEnabled) return; // Already disabled
    
    console.log(`[load-shedding] Enabling load shedding (queue lag: ${this.currentQueueLag}ms)`);
    
    this.config.fraudExtrasEnabled = false;
    this.config.networkChecksEnabled = false;
    this.config.detailedLoggingEnabled = false;
    
    console.log("[load-shedding] Disabled: fraud extras, network checks, detailed logging");
  }

  /**
   * Disable load shedding by re-enabling optional features
   */
  private async disableLoadShedding(): Promise<void> {
    if (this.config.fraudExtrasEnabled) return; // Already enabled
    
    console.log(`[load-shedding] Disabling load shedding (queue lag: ${this.currentQueueLag}ms)`);
    
    this.config.fraudExtrasEnabled = true;
    this.config.networkChecksEnabled = true;
    this.config.detailedLoggingEnabled = true;
    
    console.log("[load-shedding] Re-enabled: fraud extras, network checks, detailed logging");
  }

  /**
   * Check if fraud extras should be enabled
   */
  shouldEnableFraudExtras(): boolean {
    return this.config.fraudExtrasEnabled;
  }

  /**
   * Check if network checks should be enabled
   */
  shouldEnableNetworkChecks(): boolean {
    return this.config.networkChecksEnabled;
  }

  /**
   * Check if detailed logging should be enabled
   */
  shouldEnableDetailedLogging(): boolean {
    return this.config.detailedLoggingEnabled;
  }

  /**
   * Get current load shedding status
   */
  getStatus(): LoadSheddingConfig & { currentQueueLag: number } {
    return {
      ...this.config,
      currentQueueLag: this.currentQueueLag,
    };
  }
}

// Singleton instance
export const loadSheddingService = new LoadSheddingService();
