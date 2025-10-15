import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const QUICKBOOKS_API_BASE = 'https://quickbooks.api.intuit.com/v3/company';
const REALM_ID = '9341452542460825';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Starting QuickBooks sync...');

    // Get access token
    const accessToken = await getValidAccessToken(supabase);
    
    if (!accessToken) {
      throw new Error('No valid access token available');
    }

    // Sync all data types
    await Promise.all([
      syncInvoices(supabase, accessToken),
      syncExpenses(supabase, accessToken),
      syncCustomers(supabase, accessToken),
      syncProfitAndLoss(supabase, accessToken),
      syncBalanceSheet(supabase, accessToken),
      syncBudgets(supabase, accessToken),
    ]);

    console.log('QuickBooks sync completed successfully');

    return new Response(
      JSON.stringify({ success: true, message: 'Data synced successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in quickbooks-sync:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

async function getValidAccessToken(supabase: any): Promise<string | null> {
  const { data: tokenData, error } = await supabase
    .from('quickbooks_tokens')
    .select('*')
    .eq('realm_id', REALM_ID)
    .single();

  if (error || !tokenData) {
    console.error('No tokens found:', error);
    return null;
  }

  // Check if token is expired or about to expire (5 minutes buffer)
  const tokenExpiry = new Date(tokenData.token_expiry);
  const now = new Date();
  const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);

  if (tokenExpiry <= fiveMinutesFromNow) {
    console.log('Token expired, refreshing...');
    return await refreshAccessToken(supabase, tokenData.refresh_token);
  }

  return tokenData.access_token;
}

async function refreshAccessToken(supabase: any, refreshToken: string): Promise<string> {
  const clientId = Deno.env.get('QUICKBOOKS_CLIENT_ID');
  const clientSecret = Deno.env.get('QUICKBOOKS_CLIENT_SECRET');

  const response = await fetch('https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }).toString(),
  });

  if (!response.ok) {
    throw new Error('Failed to refresh token');
  }

  const data = await response.json();
  const tokenExpiry = new Date(Date.now() + data.expires_in * 1000);

  await supabase
    .from('quickbooks_tokens')
    .update({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      token_expiry: tokenExpiry.toISOString(),
    })
    .eq('realm_id', REALM_ID);

  return data.access_token;
}

async function makeQuickBooksRequest(accessToken: string, endpoint: string, params?: Record<string, string>) {
  const url = new URL(`${QUICKBOOKS_API_BASE}/${REALM_ID}/${endpoint}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => url.searchParams.append(key, value));
  }

  const response = await fetch(url.toString(), {
    headers: {
      'Accept': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`QuickBooks API error: ${errorText}`);
  }

  return await response.json();
}

async function syncInvoices(supabase: any, accessToken: string) {
  console.log('Syncing invoices...');
  const data = await makeQuickBooksRequest(accessToken, 'query', {
    query: 'SELECT * FROM Invoice MAXRESULTS 1000',
  });

  const invoices = data.QueryResponse?.Invoice || [];
  
  for (const invoice of invoices) {
    await supabase.from('quickbooks_invoices').upsert({
      qb_invoice_id: invoice.Id,
      doc_number: invoice.DocNumber,
      customer_name: invoice.CustomerRef?.name,
      total_amount: invoice.TotalAmt,
      balance: invoice.Balance,
      due_date: invoice.DueDate,
      txn_date: invoice.TxnDate,
      status: invoice.Balance > 0 ? 'Unpaid' : 'Paid',
      raw_data: invoice,
    }, { onConflict: 'qb_invoice_id' });
  }
  
  console.log(`Synced ${invoices.length} invoices`);
}

async function syncExpenses(supabase: any, accessToken: string) {
  console.log('Syncing expenses...');
  const data = await makeQuickBooksRequest(accessToken, 'query', {
    query: 'SELECT * FROM Purchase WHERE PaymentType = \'Cash\' MAXRESULTS 1000',
  });

  const expenses = data.QueryResponse?.Purchase || [];
  
  for (const expense of expenses) {
    await supabase.from('quickbooks_expenses').upsert({
      qb_expense_id: expense.Id,
      doc_number: expense.DocNumber,
      payee_name: expense.EntityRef?.name,
      total_amount: expense.TotalAmt,
      txn_date: expense.TxnDate,
      account_ref: expense.AccountRef?.name,
      payment_type: expense.PaymentType,
      raw_data: expense,
    }, { onConflict: 'qb_expense_id' });
  }
  
  console.log(`Synced ${expenses.length} expenses`);
}

async function syncCustomers(supabase: any, accessToken: string) {
  console.log('Syncing customers...');
  const data = await makeQuickBooksRequest(accessToken, 'query', {
    query: 'SELECT * FROM Customer MAXRESULTS 1000',
  });

  const customers = data.QueryResponse?.Customer || [];
  
  for (const customer of customers) {
    await supabase.from('quickbooks_customers').upsert({
      qb_customer_id: customer.Id,
      display_name: customer.DisplayName,
      company_name: customer.CompanyName,
      primary_email: customer.PrimaryEmailAddr?.Address,
      primary_phone: customer.PrimaryPhone?.FreeFormNumber,
      balance: customer.Balance,
      active: customer.Active,
      raw_data: customer,
    }, { onConflict: 'qb_customer_id' });
  }
  
  console.log(`Synced ${customers.length} customers`);
}

async function syncProfitAndLoss(supabase: any, accessToken: string) {
  console.log('Syncing P&L report...');
  const today = new Date();
  const startDate = new Date(today.getFullYear(), 0, 1).toISOString().split('T')[0];
  const endDate = today.toISOString().split('T')[0];
  
  const data = await makeQuickBooksRequest(accessToken, 'reports/ProfitAndLoss', {
    start_date: startDate,
    end_date: endDate,
  });

  const summary = data.Rows?.Row?.find((r: any) => r.type === 'Section');
  const netIncome = summary?.Summary?.ColData?.[1]?.value || 0;
  
  // Extract totals from report (simplified)
  const totalIncome = parseFloat(data.Rows?.Row?.find((r: any) => 
    r.group === 'Income')?.Summary?.ColData?.[1]?.value || '0');
  const totalExpenses = parseFloat(data.Rows?.Row?.find((r: any) => 
    r.group === 'Expenses')?.Summary?.ColData?.[1]?.value || '0');

  await supabase.from('quickbooks_profit_loss').upsert({
    report_date: today.toISOString().split('T')[0],
    start_date: startDate,
    end_date: endDate,
    total_income: totalIncome,
    total_expenses: totalExpenses,
    net_income: parseFloat(netIncome),
    raw_data: data,
  }, { onConflict: 'report_date,start_date,end_date' });
  
  console.log('Synced P&L report');
}

async function syncBalanceSheet(supabase: any, accessToken: string) {
  console.log('Syncing balance sheet...');
  const today = new Date().toISOString().split('T')[0];
  
  const data = await makeQuickBooksRequest(accessToken, 'reports/BalanceSheet', {
    date: today,
  });

  // Extract totals (simplified)
  const totalAssets = parseFloat(data.Rows?.Row?.find((r: any) => 
    r.type === 'Section' && r.Header?.ColData?.[0]?.value?.includes('ASSETS'))
    ?.Summary?.ColData?.[1]?.value || '0');
  const totalLiabilities = parseFloat(data.Rows?.Row?.find((r: any) => 
    r.type === 'Section' && r.Header?.ColData?.[0]?.value?.includes('LIABILITIES'))
    ?.Summary?.ColData?.[1]?.value || '0');
  const totalEquity = parseFloat(data.Rows?.Row?.find((r: any) => 
    r.type === 'Section' && r.Header?.ColData?.[0]?.value?.includes('EQUITY'))
    ?.Summary?.ColData?.[1]?.value || '0');

  await supabase.from('quickbooks_balance_sheet').upsert({
    report_date: today,
    total_assets: totalAssets,
    total_liabilities: totalLiabilities,
    total_equity: totalEquity,
    raw_data: data,
  }, { onConflict: 'report_date' });
  
  console.log('Synced balance sheet');
}

async function syncBudgets(supabase: any, accessToken: string) {
  console.log('Syncing budgets...');
  const data = await makeQuickBooksRequest(accessToken, 'query', {
    query: 'SELECT * FROM Budget MAXRESULTS 1000',
  });

  const budgets = data.QueryResponse?.Budget || [];
  
  for (const budget of budgets) {
    await supabase.from('quickbooks_budgets').upsert({
      qb_budget_id: budget.Id,
      name: budget.Name,
      start_date: budget.StartDate,
      end_date: budget.EndDate,
      active: budget.Active !== false,
      raw_data: budget,
    }, { onConflict: 'qb_budget_id' });
  }
  
  console.log(`Synced ${budgets.length} budgets`);
}