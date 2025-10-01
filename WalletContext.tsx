import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

interface WalletContextType {
  walletAddress: string | null;
  isConnecting: boolean;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider = ({ children }: { children: ReactNode }) => {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('wallet_address')
        .eq('user_id', session.user.id)
        .single();
      
      if (profile?.wallet_address) {
        setWalletAddress(profile.wallet_address);
      }
    }
  };

  const connectWallet = async () => {
    if (!window.solana?.isPhantom) {
      alert("Please install Phantom Wallet!");
      window.open("https://phantom.app/", "_blank");
      return;
    }

    setIsConnecting(true);
    try {
      const response = await window.solana.connect();
      const publicKey = response.publicKey.toString();
      setWalletAddress(publicKey);

      const { data: { user } } = await supabase.auth.signInAnonymously();
      
      if (user) {
        const { error } = await supabase
          .from('profiles')
          .upsert({
            user_id: user.id,
            wallet_address: publicKey,
          });

        if (error) throw error;
      }
    } catch (error) {
      console.error("Wallet connection error:", error);
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = async () => {
    if (window.solana) {
      await window.solana.disconnect();
      setWalletAddress(null);
      await supabase.auth.signOut();
    }
  };

  return (
    <WalletContext.Provider value={{ walletAddress, isConnecting, connectWallet, disconnectWallet }}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
};
