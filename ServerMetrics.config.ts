import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface MetricsDataPoint {
  timestamp: string;
  activeServers: number;
  totalServers: number;
  uptimeRate: number;
}

export const useServerMetrics = (walletAddress: string | null) => {
  const [historicalData, setHistoricalData] = useState<MetricsDataPoint[]>([]);

  useEffect(() => {
    if (!walletAddress) return;

    const updateMetrics = async () => {
      const { data: servers } = await supabase
        .from("server_instances")
        .select("*")
        .eq("wallet_address", walletAddress);

      const activeServers = servers?.filter(s => s.status === 'online').length || 0;
      const totalServers = servers?.length || 0;
      const uptimeRate = totalServers > 0 ? (activeServers / totalServers) * 100 : 100;

      const dataPoint: MetricsDataPoint = {
        timestamp: new Date().toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: false 
        }),
        activeServers,
        totalServers,
        uptimeRate,
      };

      setHistoricalData(prev => {
        const updated = [...prev, dataPoint];
        return updated.slice(-30); // Keep last 30 data points
      });
    };

    updateMetrics();
    const interval = setInterval(updateMetrics, 30000);

    // Real-time updates
    const channel = supabase
      .channel('metrics-updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'server_instances',
        filter: `wallet_address=eq.${walletAddress}`
      }, () => updateMetrics())
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [walletAddress]);

  return { historicalData };
};
