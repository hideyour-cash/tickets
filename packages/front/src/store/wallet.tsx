import { create } from "zustand";
import {
  setupWalletSelector,
  WalletSelector
} from "@near-wallet-selector/core";
import { setupNearWallet } from "@near-wallet-selector/near-wallet";
import { setupMeteorWallet } from "@near-wallet-selector/meteor-wallet";
import { useEnv } from "@/hooks/useEnv";

export interface WalletStoreInterface {
  toggleModal: () => void;
  accountId: string | null;
  showWalletModal: boolean;
  signOut: () => Promise<void>;
  selector: WalletSelector | null;
  initWallet: () => Promise<string>;
}

export const useWallet = create<WalletStoreInterface>((set, get) => ({
  accountId: null,
  selector: null,
  showWalletModal: false,

  toggleModal: () => {
    const { showWalletModal } = get();

    set(() => ({ showWalletModal: !showWalletModal }));
  },

  initWallet: async () => {
    const newSelector = await setupWalletSelector({
      network: useEnv("VITE_NEAR_NETWORK"),
      debug: true,
      modules: [setupMeteorWallet(), setupNearWallet()]
    });

    const state = newSelector.store.getState();

    const newAccount =
      state?.accounts.find(account => account.active)?.accountId || "";

    try {
      set(() => ({
        accountId: newAccount,
        selector: newSelector
      }));
    } catch (e) {
      console.warn(e);

      return "";
    }

    return newAccount;
  },

  signOut: async () => {
    const { selector } = get();

    if (!selector) {
      return;
    }

    const wallet = await selector.wallet();

    try {
      await wallet.signOut();
    } catch (e) {
      console.warn(e);

      return;
    }

    set(() => ({ accountId: "" }));
  }
}));