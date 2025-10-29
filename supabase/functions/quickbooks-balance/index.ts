import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function refreshTokenIfNeeded(supabase: any, companyId: string, tokenData: any, company: any) {
  const tokenExpiry = new Date(tokenData.token_expiry);
  const now = new Date();

  if (tokenExpiry.getTime() - now.getTime() < 5 * 60 * 1000) {
    console.log('Token expiring soon, refreshing...');

    const tokenResponse = await fetch('https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${btoa(`${company.client_id}:${company.client_secret}`)}`,
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

interface ProcessedItem {
  name: string;
  value: number;
  type: string;
  level: number;
  children?: ProcessedItem[];
}

function processRow(row: any, level: number = 0): ProcessedItem | null {
  if (!row || !row.ColData) return null;
  
  const name = row.ColData[0]?.value || '';
  if (!name.trim()) return null;
  
  const value = parseFloat(row.ColData[1]?.value || '0');
  
  return {
    name,
    value: isNaN(value) ? 0 : value,
    type: row.type || 'Data',
    level,
    children: []
  };
}

function processSection(section: any, level: number = 0): ProcessedItem[] {
  const result: ProcessedItem[] = [];
  
  if (!section) return result;
  
  if (section.Header && section.Header.ColData) {
    const header = processRow(section.Header, level);
    if (header) {
      header.type = 'Section';
      console.log(`Processing section header: ${header.name} at level ${level}`);
      
      if (section.Rows?.Row) {
        console.log(`Section ${header.name} has ${section.Rows.Row.length} rows`);
        for (const childRow of section.Rows.Row) {
          console.log(`Processing child row type: ${childRow.type}`);
          if (childRow.type === 'Data') {
            const childData = processRow(childRow, level + 1);
            if (childData) {
              console.log(`Added data row: ${childData.name} = ${childData.value}`);
              header.children!.push(childData);
            }
          } else if (childRow.type === 'Section') {
            const childSections = processSection(childRow, level + 1);
            header.children!.push(...childSections);
          }
        }
      }
      
      if (section.Summary) {
        const summary = processRow(section.Summary, level);
        if (summary) {
          summary.type = 'Summary';
          summary.name = `Total ${header.name}`;
          console.log(`Added summary: ${summary.name} = ${summary.value}`);
          header.children!.push(summary);
        }
      }
      
      console.log(`Section ${header.name} has ${header.children!.length} children`);
      result.push(header);
    }
  } else if (section.Rows?.Row) {
    for (const childRow of section.Rows.Row) {
      if (childRow.type === 'Data') {
        const data = processRow(childRow, level);
        if (data) {
          result.push(data);
        }
      } else if (childRow.type === 'Section') {
        const childSections = processSection(childRow, level);
        result.push(...childSections);
      }
    }
  }
  
  return result;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { companyId } = await req.json();
    console.log('Fetching balance sheet for company:', companyId);

    if (!companyId) {
      throw new Error('Company ID is required');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: company, error: companyError } = await supabase
      .from('quickbooks_companies')
      .select('realm_id, client_id, client_secret')
      .eq('id', companyId)
      .single();

    if (companyError || !company || !company.realm_id) {
      console.error('Company error:', companyError);
      throw new Error('Company not found or not connected');
    }

    console.log('Company found, realm_id:', company.realm_id);

    const { data: tokenData, error: tokenError } = await supabase
      .from('quickbooks_tokens')
      .select('*')
      .eq('company_id', companyId)
      .single();

    if (tokenError || !tokenData) {
      console.error('Token error:', tokenError);
      throw new Error('Authentication tokens not found');
    }

    const accessToken = await refreshTokenIfNeeded(supabase, companyId, tokenData, company);

    console.log('Fetching Balance Sheet...');

    const response = await fetch(
      `https://quickbooks.api.intuit.com/v3/company/${company.realm_id}/reports/BalanceSheet?minorversion=65`,
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
      throw new Error(`Failed to fetch balance sheet: ${response.status}`);
    }

    const balanceSheet = await response.json();
    console.log('Balance sheet fetched successfully');
    console.log('Balance sheet structure:', JSON.stringify(balanceSheet.Rows?.Row?.map((r: any) => ({
      type: r.type,
      group: r.group,
      hasHeader: !!r.Header,
      hasSummary: !!r.Summary,
      hasRows: !!r.Rows
    })), null, 2));

    const allSections: ProcessedItem[] = [];
    let totalAssets = 0;
    let totalLiabilities = 0;
    let totalEquity = 0;
    const assets: ProcessedItem[] = [];
    const liabilities: ProcessedItem[] = [];
    const equity: ProcessedItem[] = [];

    if (balanceSheet.Rows?.Row) {
      for (const mainSection of balanceSheet.Rows.Row) {
        const headerName = mainSection.Header?.ColData?.[0]?.value || '';
        const group = mainSection.group || '';
        console.log('Processing section:', headerName, 'Group:', group);
        
        // Use the group property from QuickBooks API
        if (group === 'NetAssets' || headerName.includes('ACTIVO') || headerName.includes('ASSET')) {
          const sections = processSection(mainSection, 0);
          assets.push(...sections);
          
          if (mainSection.Summary) {
            totalAssets = parseFloat(mainSection.Summary.ColData?.[1]?.value || '0');
          }
        } else if (group === 'NetLiabilitiesAndShareHolderEquity') {
          // This section contains both liabilities and equity
          const sections = processSection(mainSection, 0);
          
          // Split based on subsection names
          for (const section of sections) {
            const sectionNameLower = section.name.toLowerCase();
            if (sectionNameLower.includes('pasivo') || sectionNameLower.includes('deuda') || 
                sectionNameLower.includes('liabilit') || sectionNameLower.includes('payable')) {
              liabilities.push(section);
            } else if (sectionNameLower.includes('patrimonio') || sectionNameLower.includes('capital') || 
                       sectionNameLower.includes('equity') || sectionNameLower.includes('fondo')) {
              equity.push(section);
            }
          }
          
          if (mainSection.Summary) {
            const totalValue = parseFloat(mainSection.Summary.ColData?.[1]?.value || '0');
            // For now, assign to equity as it's typically the net value
            totalEquity = totalValue;
          }
        } else if (headerName.includes('PASIVO') || headerName.includes('LIABILIT')) {
          const sections = processSection(mainSection, 0);
          liabilities.push(...sections);
          
          if (mainSection.Summary) {
            totalLiabilities = parseFloat(mainSection.Summary.ColData?.[1]?.value || '0');
          }
        } else if (headerName.includes('PATRIMONIO') || headerName.includes('EQUITY') || headerName.includes('CAPITAL')) {
          const sections = processSection(mainSection, 0);
          equity.push(...sections);
          
          if (mainSection.Summary) {
            totalEquity = parseFloat(mainSection.Summary.ColData?.[1]?.value || '0');
          }
        }
      }
    }

    console.log('Total Assets:', totalAssets);
    console.log('Total Liabilities:', totalLiabilities);
    console.log('Total Equity:', totalEquity);

    const transformedData = {
      assets,
      liabilities,
      equity,
      totalAssets,
      totalLiabilities,
      totalEquity,
    };

    return new Response(
      JSON.stringify(transformedData),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Balance sheet error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
