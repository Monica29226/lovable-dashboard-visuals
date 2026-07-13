import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';
import { userHasCompanyAccess, isServiceRoleRequest, logSync } from '../_shared/access.ts';

const requestSchema = z.object({
  companyId: z.string().uuid('Invalid company ID format'),
});

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const QUICKBOOKS_CLIENT_ID = Deno.env.get('QUICKBOOKS_CLIENT_ID')!;
const QUICKBOOKS_CLIENT_SECRET = Deno.env.get('QUICKBOOKS_CLIENT_SECRET')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function encodeBase64(str: string): string {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  return base64Encode(data);
}

async function refreshTokenIfNeeded(supabase: any, companyId: string, tokenData: any) {
  const tokenExpiry = new Date(tokenData.token_expiry);
  const now = new Date();

  if (tokenExpiry.getTime() - now.getTime() < 5 * 60 * 1000) {
    // ARCHITECTURE: all companies use ONE ACL QuickBooks app. Refresh with global creds.
    const clientId = (QUICKBOOKS_CLIENT_ID || '').trim();
    const clientSecret = (QUICKBOOKS_CLIENT_SECRET || '').trim();
    const authString = `${clientId}:${clientSecret}`;
    const authHeader = `Basic ${encodeBase64(authString)}`;

    const tokenResponse = await fetch('https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': authHeader,
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: tokenData.refresh_token,
      }),
    });

    const tokens = await tokenResponse.json();

    if (!tokenResponse.ok) {
      throw new Error(`Token refresh failed: ${JSON.stringify(tokens)}`);
    }

    await supabase
      .from('quickbooks_tokens')
      .update({
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_expiry: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
      })
      .eq('company_id', companyId);

    return tokens.access_token;
  }

  return tokenData.access_token;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  let realmIdForLog = 'unknown';

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const body = await req.json();
    const parsed = requestSchema.safeParse(body);
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: parsed.error.flatten().fieldErrors }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    const { companyId } = parsed.data;

    // Trusted server-to-server call (nightly cron) bypasses user/admin verification.
    if (!isServiceRoleRequest(authHeader)) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      if (authError || !user) {
        throw new Error('Unauthorized');
      }
      const allowed = await userHasCompanyAccess(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, user.id, companyId);
      if (!allowed) {
        throw new Error('Access denied to this company');
      }
    }

    console.log('Syncing invoices for company:', companyId);

    const { data: company, error: companyError } = await supabase
      .from('quickbooks_companies')
      .select('realm_id')
      .eq('id', companyId)
      .single();

    if (companyError || !company || !company.realm_id) {
      throw new Error('Company not found or not connected');
    }
    realmIdForLog = company.realm_id;

    const { data: tokenData, error: tokenError } = await supabase
      .from('quickbooks_tokens')
      .select('*')
      .eq('company_id', companyId)
      .single();

    if (tokenError || !tokenData) {
      throw new Error('Authentication tokens not found');
    }

    const accessToken = await refreshTokenIfNeeded(supabase, companyId, tokenData);

    // Paginate through all invoices via the QuickBooks query endpoint.
    const MAX_RESULTS = 500;
    let startPosition = 1;
    let totalFetched = 0;
    let usdCount = 0;
    let hasMore = true;

    while (hasMore) {
      const query = `SELECT * FROM Invoice STARTPOSITION ${startPosition} MAXRESULTS ${MAX_RESULTS}`;
      const url = `https://quickbooks.api.intuit.com/v3/company/${company.realm_id}/query?query=${encodeURIComponent(query)}&minorversion=65`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('QuickBooks API error:', response.status, errorText);
        throw new Error(`Failed to fetch invoices: ${response.status}`);
      }

      const result = await response.json();
      const invoices = result.QueryResponse?.Invoice || [];

      if (invoices.length === 0) {
        hasMore = false;
        break;
      }

      const rows = invoices.map((inv: any) => {
        const currency = inv.CurrencyRef?.value ?? null;
        if (currency === 'USD') usdCount++;
        return {
          company_id: companyId,
          qb_invoice_id: String(inv.Id),
          doc_number: inv.DocNumber ?? null,
          customer_name: inv.CustomerRef?.name ?? null,
          total_amount: inv.TotalAmt != null ? Number(inv.TotalAmt) : null,
          balance: inv.Balance != null ? Number(inv.Balance) : null,
          due_date: inv.DueDate ?? null,
          txn_date: inv.TxnDate ?? null,
          status: null,
          currency,
          raw_data: inv,
          synced_at: new Date().toISOString(),
        };
      });

      const { error: upsertError } = await supabase
        .from('quickbooks_invoices')
        .upsert(rows, { onConflict: 'qb_invoice_id' });

      if (upsertError) {
        console.error('Upsert error:', upsertError);
        throw new Error(`Failed to save invoices: ${upsertError.message}`);
      }

      totalFetched += invoices.length;
      startPosition += invoices.length;
      hasMore = invoices.length === MAX_RESULTS;
    }

    console.log(`Invoices synced successfully: ${totalFetched} total, ${usdCount} in USD`);

    await logSync(supabase, {
      realmId: realmIdForLog,
      syncType: 'invoices',
      status: 'success',
      recordsSynced: totalFetched,
    });

    return new Response(
      JSON.stringify({
        success: true,
        totalInvoices: totalFetched,
        usdInvoices: usdCount,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Sync error:', error);
    await logSync(supabase, {
      realmId: realmIdForLog,
      syncType: 'invoices',
      status: 'error',
      errorMessage: error instanceof Error ? error.message : String(error),
    });
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
