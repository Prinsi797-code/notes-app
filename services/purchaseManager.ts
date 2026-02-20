import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    clearTransactionIOS,
    endConnection,
    fetchProducts,
    finishTransaction,
    getAvailablePurchases,
    initConnection,
    Purchase,
    PurchaseError,
    purchaseErrorListener,
    purchaseUpdatedListener,
    requestPurchase,
    Subscription,
} from 'expo-iap';

// =============================================
// ⚠️ Apna Product ID yahan replace karo
// App Store Connect me jo set kiya tha wahi daalo
// =============================================
export const SUBSCRIPTION_SKUS = {
  weekly:  'com.hevin.notesApp.weekly',   // <-- replace karo
  monthly: 'com.hevin.notesApp.monthly',  // <-- replace karo
  yearly:  'com.hevin.notesApp.yearly',   // <-- replace karo
};

// AsyncStorage keys
const PREMIUM_STATUS_KEY  = 'premium_status';
const PREMIUM_EXPIRY_KEY  = 'premium_expiry_date';
const PREMIUM_PRODUCT_KEY = 'premium_product_id';
const PREMIUM_TRANS_KEY   = 'premium_transaction_id';
const PREMIUM_DATE_KEY    = 'premium_purchase_date';

export interface PremiumInfo {
  isPremium:     boolean;
  expiryDate:    string | null;
  productId:     string | null;
  transactionId: string | null;
  purchaseDate:  string | null;
}

class PurchaseManager {
  private static instance: PurchaseManager;
  private isConnected = false;
  private purchaseUpdateSub: any = null;
  private purchaseErrorSub: any = null;

  private onSuccessCallback: ((productId: string) => void) | null = null;
  private onErrorCallback:   ((error: string) => void) | null = null;

  static getInstance(): PurchaseManager {
    if (!PurchaseManager.instance) {
      PurchaseManager.instance = new PurchaseManager();
    }
    return PurchaseManager.instance;
  }

  // ==================== INITIALIZE ====================
  async initialize(): Promise<boolean> {
    try {
      if (this.isConnected) return true;

      await initConnection();
      this.isConnected = true;
      console.log('✅ IAP Connected (expo-iap)');

      // iOS: pending transactions clear karo
      clearTransactionIOS();

      // Purchase success listener
      this.purchaseUpdateSub = purchaseUpdatedListener(async (purchase: Purchase) => {
        console.log('🛒 Purchase received:', purchase.productId);

        const receipt = (purchase as any).transactionReceipt;
        if (!receipt) return;

        try {
          // Transaction finish karna zaroori hai
          await finishTransaction({ purchase, isConsumable: false });

          // Local me save karo
          await this.savePremium(purchase);

          console.log('✅ Purchase finished & saved:', purchase.productId);
          this.onSuccessCallback?.(purchase.productId);
        } catch (err) {
          console.log('❌ finishTransaction error:', err);
          this.onErrorCallback?.('Transaction completion failed');
        }
      });

      // Purchase error listener
      this.purchaseErrorSub = purchaseErrorListener((error: PurchaseError) => {
        console.log('❌ Purchase error:', error.code, error.message);
        if (error.code !== 'E_USER_CANCELLED') {
          this.onErrorCallback?.(error.message || 'Purchase failed');
        }
      });

      return true;
    } catch (error: any) {
      if (error?.message?.includes('already connected')) {
        this.isConnected = true;
        return true;
      }
      console.log('❌ IAP init error:', error);
      return false;
    }
  }

  // ==================== SET CALLBACKS ====================
  setCallbacks(
    onSuccess: (productId: string) => void,
    onError:   (error: string) => void
  ) {
    this.onSuccessCallback = onSuccess;
    this.onErrorCallback   = onError;
  }

  // ==================== GET PRODUCTS FROM APP STORE ====================
  // ✅ FIX: getProducts → fetchProducts, skus → productIds
  async getSubscriptionProducts(): Promise<Subscription[]> {
    try {
      const productIds = Object.values(SUBSCRIPTION_SKUS);
      const products = await fetchProducts({ productIds });
    //   const products = await fetchProducts({ productIds, type: 'sub' });
      console.log('📦 Products fetched:', products.length);
      return products as Subscription[];
    } catch (error) {
      console.log('❌ fetchProducts error:', error);
      return [];
    }
  }

  // ==================== PURCHASE SUBSCRIPTION ====================
  // ✅ FIX: requestSubscription → requestPurchase with new API
  async purchaseSubscription(sku: string): Promise<void> {
    try {
      console.log('🛒 Requesting subscription:', sku);
      await requestPurchase({
        request: {
          apple: { sku },
          google: { skus: [sku] },
        },
        type: 'subs',
      });
      // Result purchaseUpdatedListener me aata hai
    } catch (error: any) {
      if (error?.code !== 'E_USER_CANCELLED') {
        console.log('❌ requestPurchase error:', error);
        throw error;
      }
    }
  }

  // ==================== SAVE PREMIUM LOCALLY ====================
  private async savePremium(purchase: Purchase): Promise<void> {
    try {
      const purchaseDate = new Date(
        (purchase as any).transactionDate ?? Date.now()
      );
      const expiryDate = new Date(
        purchaseDate.getTime() + this.expiryDuration(purchase.productId)
      );

      await AsyncStorage.multiSet([
        [PREMIUM_STATUS_KEY,  'true'],
        [PREMIUM_EXPIRY_KEY,  expiryDate.toISOString()],
        [PREMIUM_PRODUCT_KEY, purchase.productId],
        [PREMIUM_TRANS_KEY,   (purchase as any).transactionId ?? ''],
        [PREMIUM_DATE_KEY,    purchaseDate.toISOString()],
      ]);

      console.log('✅ Premium saved, expires:', expiryDate.toISOString());
    } catch (err) {
      console.log('❌ savePremium error:', err);
    }
  }

  private expiryDuration(productId: string): number {
    if (productId.includes('weekly'))  return 7   * 86400 * 1000;
    if (productId.includes('monthly')) return 30  * 86400 * 1000;
    if (productId.includes('yearly'))  return 365 * 86400 * 1000;
    return 7 * 86400 * 1000; // default 7 days
  }

  // ==================== GET PREMIUM INFO ====================
  async getPremiumInfo(): Promise<PremiumInfo> {
    try {
      const pairs = await AsyncStorage.multiGet([
        PREMIUM_STATUS_KEY,
        PREMIUM_EXPIRY_KEY,
        PREMIUM_PRODUCT_KEY,
        PREMIUM_TRANS_KEY,
        PREMIUM_DATE_KEY,
      ]);
      const m: Record<string, string | null> = {};
      pairs.forEach(([k, v]) => { m[k] = v; });

      return {
        isPremium:     m[PREMIUM_STATUS_KEY] === 'true',
        expiryDate:    m[PREMIUM_EXPIRY_KEY],
        productId:     m[PREMIUM_PRODUCT_KEY],
        transactionId: m[PREMIUM_TRANS_KEY],
        purchaseDate:  m[PREMIUM_DATE_KEY],
      };
    } catch {
      return { isPremium: false, expiryDate: null, productId: null, transactionId: null, purchaseDate: null };
    }
  }

  // ==================== FAST LOCAL CHECK ====================
  async isPremium(): Promise<boolean> {
    const info = await this.getPremiumInfo();
    return info.isPremium;
  }

  // ==================== RESTORE FROM APP STORE ====================
  async checkAndRestorePremium(): Promise<boolean> {
    try {
      console.log('🔄 Restoring from App Store...');

      const purchases = await getAvailablePurchases();
      if (!purchases || purchases.length === 0) {
        console.log('No active purchases found');
        await this.clearPremium();
        return false;
      }

      const skus = Object.values(SUBSCRIPTION_SKUS);
      const active = purchases.find(p => skus.includes(p.productId));

      if (active) {
        await this.savePremium(active);
        console.log('✅ Premium restored:', active.productId);
        return true;
      }

      await this.clearPremium();
      return false;
    } catch (error) {
      console.log('❌ Restore error, using local fallback:', error);
      return this.isPremium();
    }
  }

  // ==================== CLEAR PREMIUM ====================
  async clearPremium(): Promise<void> {
    await AsyncStorage.multiRemove([
      PREMIUM_STATUS_KEY,
      PREMIUM_EXPIRY_KEY,
      PREMIUM_PRODUCT_KEY,
      PREMIUM_TRANS_KEY,
      PREMIUM_DATE_KEY,
    ]);
    console.log('🗑️ Premium cleared');
  }

  // ==================== REMOVE LISTENERS & DISCONNECT ====================
  removeListeners() {
    this.purchaseUpdateSub?.remove();
    this.purchaseErrorSub?.remove();
    this.purchaseUpdateSub = null;
    this.purchaseErrorSub  = null;
  }

  async disconnect(): Promise<void> {
    this.removeListeners();
    if (this.isConnected) {
      await endConnection();
      this.isConnected = false;
      console.log('IAP disconnected');
    }
  }
}

export default PurchaseManager.getInstance();