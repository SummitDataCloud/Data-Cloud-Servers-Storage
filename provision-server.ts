import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    
    if (!user) {
      throw new Error('Not authenticated');
    }

    const { action, serverId, serverConfig } = await req.json();
    const vultrApiKey = Deno.env.get('VULTR_API_KEY');

    if (!vultrApiKey) {
      throw new Error('VULTR_API_KEY not configured');
    }

    const vultrHeaders = {
      'Authorization': `Bearer ${vultrApiKey}`,
      'Content-Type': 'application/json',
    };

    switch (action) {
      case 'get-os-list': {
        const response = await fetch('https://api.vultr.com/v2/os', {
          headers: vultrHeaders,
        });
        const data = await response.json();
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'create': {
        const createPayload = {
          region: serverConfig.region,
          plan: serverConfig.plan,
          os_id: serverConfig.os_id,
          label: serverConfig.label,
          enable_ipv6: true,
          backups: 'disabled',
          ddos_protection: false,
          activation_email: false,
        };

        const response = await fetch('https://api.vultr.com/v2/instances', {
          method: 'POST',
          headers: vultrHeaders,
          body: JSON.stringify(createPayload),
        });

        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to create server');
        }

        const { data: profileData } = await supabaseClient
          .from('profiles')
          .select('wallet_address')
          .eq('user_id', user.id)
          .single();

        const { error: insertError } = await supabaseClient
          .from('server_instances')
          .insert({
            user_id: user.id,
            wallet_address: profileData?.wallet_address,
            name: serverConfig.label,
            droplet_id: data.instance.id,
            status: 'provisioning',
            region: data.instance.region,
            operating_system: serverConfig.os_id.toString(),
            vcpu_count: data.instance.vcpu_count || 1,
            ram_mb: data.instance.ram || 1024,
            disk_gb: data.instance.disk || 25,
            ip_address: data.instance.main_ip || null,
            actual_ip: data.instance.main_ip || null,
            ipv6_address: data.instance.v6_main_ip || null,
            root_password: data.instance.default_password || null,
          });

        if (insertError) {
          console.error('Database insert error:', insertError);
          throw insertError;
        }

        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'start':
      case 'stop': {
        const { data: serverData } = await supabaseClient
          .from('server_instances')
          .select('droplet_id')
          .eq('id', serverId)
          .eq('user_id', user.id)
          .single();

        if (!serverData?.droplet_id) {
          throw new Error('Server not found');
        }

        const actionMap = { start: 'start', stop: 'halt' };
        const response = await fetch(
          `https://api.vultr.com/v2/instances/${serverData.droplet_id}/${actionMap[action]}`,
          {
            method: 'POST',
            headers: vultrHeaders,
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `Failed to ${action} server`);
        }

        const newStatus = action === 'start' ? 'online' : 'offline';
        await supabaseClient
          .from('server_instances')
          .update({ status: newStatus })
          .eq('id', serverId);

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'refresh': {
        const { data: serverData } = await supabaseClient
          .from('server_instances')
          .select('droplet_id')
          .eq('id', serverId)
          .eq('user_id', user.id)
          .single();

        if (!serverData?.droplet_id) {
          throw new Error('Server not found');
        }

        const response = await fetch(
          `https://api.vultr.com/v2/instances/${serverData.droplet_id}`,
          { headers: vultrHeaders }
        );

        const data = await response.json();
        
        await supabaseClient
          .from('server_instances')
          .update({
            status: data.instance.status === 'active' ? 'online' : 'offline',
            ip_address: data.instance.main_ip,
            actual_ip: data.instance.main_ip,
            ipv6_address: data.instance.v6_main_ip,
          })
          .eq('id', serverId);

        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'delete': {
        const { data: serverData } = await supabaseClient
          .from('server_instances')
          .select('droplet_id')
          .eq('id', serverId)
          .eq('user_id', user.id)
          .single();

        if (!serverData?.droplet_id) {
          throw new Error('Server not found');
        }

        const response = await fetch(
          `https://api.vultr.com/v2/instances/${serverData.droplet_id}`,
          {
            method: 'DELETE',
            headers: vultrHeaders,
          }
        );

        if (!response.ok && response.status !== 404) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to delete server');
        }

        await supabaseClient
          .from('server_instances')
          .delete()
          .eq('id', serverId);

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      default:
        throw new Error('Invalid action');
    }
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
