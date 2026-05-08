import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const requestSchema = z.object({
  companyId: z.string().uuid('Invalid company ID format'),
});

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function encodeBase64(str: string): string {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  return base64Encode(data);
}

async function refreshTokenIfNeeded(supabase: any, companyId: string, tokenData: any, company: any) {
  const tokenExpiry = new Date(tokenData.token_expiry);
  const now = new Date();

  if (tokenExpiry.getTime() - now.getTime() < 5 * 60 * 1000) {
    const authString = `${company.client_id}:${company.client_secret}`;
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

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    // Create service role client for database operations (needed to bypass RLS)
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Extract JWT token and verify user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      throw new Error('Unauthorized');
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

    // Verify user has access to this company using service role client
    const { data: accessCheck, error: accessError } = await supabase
      .from('company_users')
      .select('id')
      .eq('user_id', user.id)
      .eq('company_id', companyId)
      .maybeSingle();

    if (accessError || !accessCheck) {
      // Also check if user is admin directly with the service role client
      const { data: adminRole } = await supabase
        .from('user_roles')
        .select('id')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();
      if (!adminRole) {
        throw new Error('Access denied to this company');
      }
    }

    console.log('Syncing budgets for company:', companyId);

    const { data: company, error: companyError } = await supabase
      .from('quickbooks_companies')
      .select('realm_id, client_id, client_secret')
      .eq('id', companyId)
      .single();

    if (companyError || !company || !company.realm_id) {
      throw new Error('Company not found or not connected');
    }

    const { data: tokenData, error: tokenError } = await supabase
      .from('quickbooks_tokens')
      .select('*')
      .eq('company_id', companyId)
      .single();

    if (tokenError || !tokenData) {
      throw new Error('Authentication tokens not found');
    }

    const accessToken = await refreshTokenIfNeeded(supabase, companyId, tokenData, company);

    console.log('Fetching budgets from QuickBooks');

    // Query for budgets using the Query API
    const response = await fetch(
      `https://quickbooks.api.intuit.com/v3/company/${company.realm_id}/query?query=select * from Budget&minorversion=65`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('QuickBooks API error:', response.status, errorText);
      throw new Error(`Failed to fetch budgets: ${response.status}`);
    }

    const result = await response.json();
    const budgets = result.QueryResponse?.Budget || [];
    
    console.log(`Found ${budgets.length} budgets`);

    let syncedCount = 0;

    for (const budget of budgets) {
      const qbBudgetId = budget.Id;
      const budgetName = budget.Name || 'Unnamed Budget';
      const startDate = budget.StartDate || null;
      const endDate = budget.EndDate || null;
      const active = budget.Active !== false;

      // Check if budget already exists
      const { data: existing } = await supabase
        .from('quickbooks_budgets')
        .select('id')
        .eq('company_id', companyId)
        .eq('qb_budget_id', qbBudgetId)
        .single();

      if (existing) {
        // Update existing budget
        const { error: updateError } = await supabase
          .from('quickbooks_budgets')
          .update({
            name: budgetName,
            start_date: startDate,
            end_date: endDate,
            active,
            raw_data: budget,
            synced_at: new Date().toISOString(),
          })
          .eq('id', existing.id);

        if (updateError) {
          console.error('Update error for budget', qbBudgetId, updateError);
        } else {
          syncedCount++;
        }
      } else {
        // Insert new budget
        const { error: insertError } = await supabase
          .from('quickbooks_budgets')
          .insert({
            company_id: companyId,
            qb_budget_id: qbBudgetId,
            name: budgetName,
            start_date: startDate,
            end_date: endDate,
            active,
            raw_data: budget,
            synced_at: new Date().toISOString(),
          });

        if (insertError) {
          console.error('Insert error for budget', qbBudgetId, insertError);
        } else {
          syncedCount++;
        }
      }
    }

    console.log(`Budgets synced successfully: ${syncedCount}/${budgets.length}`);

    return new Response(
      JSON.stringify({
        success: true,
        totalBudgets: budgets.length,
        syncedCount,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Sync error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
