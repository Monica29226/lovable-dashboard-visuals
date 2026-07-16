import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';
import { userHasCompanyAccess } from '../_shared/access.ts';

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

async function refreshTokenIfNeeded(supabase: any, companyId: string, tokenData: any, company: any) {
  const tokenExpiry = new Date(tokenData.token_expiry);
  const now = new Date();

  if (tokenExpiry.getTime() - now.getTime() < 5 * 60 * 1000) {
    const authString = `${QUICKBOOKS_CLIENT_ID}:${QUICKBOOKS_CLIENT_SECRET}`;
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

interface ProcessedRow {
  name: string;
  monthlyValues: number[];
  total: number;
  type: string;
  level: number;
  children?: ProcessedRow[];
}

function processRow(row: any, level: number = 0): ProcessedRow | null {
  if (!row || !row.ColData) return null;
  
  const name = row.ColData[0]?.value || '';
  if (!name.trim()) return null;
  
  const monthlyValues = row.ColData.slice(1, -1).map((col: any) => {
    const value = parseFloat(col.value || '0');
    return isNaN(value) ? 0 : value;
  });
  
  const totalValue = parseFloat(row.ColData[row.ColData.length - 1]?.value || '0');
  
  return {
    name,
    monthlyValues,
    total: isNaN(totalValue) ? 0 : totalValue,
    type: row.type || 'Data',
    level,
    children: []
  };
}

function processSection(section: any, level: number = 0): ProcessedRow[] {
  const result: ProcessedRow[] = [];
  
  if (!section) return result;
  
  // Si es una sección con header
  if (section.Header && section.Header.ColData) {
    const header = processRow(section.Header, level);
    if (header) {
      header.type = 'Section';
      
      // Procesar las filas hijas
      if (section.Rows?.Row) {
        for (const childRow of section.Rows.Row) {
          if (childRow.type === 'Data') {
            const childData = processRow(childRow, level + 1);
            if (childData) {
              header.children!.push(childData);
            }
          } else if (childRow.type === 'Section') {
            const childSections = processSection(childRow, level + 1);
            header.children!.push(...childSections);
          }
        }
      }
      
      // Agregar el summary si existe
      if (section.Summary) {
        const summary = processRow(section.Summary, level);
        if (summary) {
          summary.type = 'Summary';
          summary.name = `Total para ${header.name}`;
          header.children!.push(summary);
        }
      }
      
      result.push(header);
    }
  } else if (section.Rows?.Row) {
    // Si solo tiene filas sin header
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

    // Validate and parse request body
    const body = await req.json();
    const requestSchema = z.object({
      companyId: z.string().uuid('Invalid company ID format'),
      year: z.string().optional(),
    });
    const { companyId, year } = requestSchema.parse(body);

    // Verify access: admin OR explicit company_users access
    const allowed = await userHasCompanyAccess(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, user.id, companyId);
    if (!allowed) {
      throw new Error('Access denied to this company');
    }

    const { data: company, error: companyError } = await supabase
      .from('quickbooks_companies')
      .select('realm_id')
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
      console.error('Token error:', tokenError);
      throw new Error('Authentication tokens not found');
    }

    const accessToken = await refreshTokenIfNeeded(supabase, companyId, tokenData, company);

    // Calculate date range based on selected year
    const now = new Date();
    const targetYear = year ? parseInt(year) : now.getFullYear();
    const startDate = `${targetYear}-01-01`;
    const endDate = `${targetYear}-12-31`;

    console.log('Fetching P&L from', startDate, 'to', endDate);

    const response = await fetch(
      `https://quickbooks.api.intuit.com/v3/company/${company.realm_id}/reports/ProfitAndLoss?start_date=${startDate}&end_date=${endDate}&summarize_column_by=Month&minorversion=65`,
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
      throw new Error(`Failed to fetch income statement: ${response.status}`);
    }

    const incomeStatement = await response.json();
    console.log('Income statement fetched successfully');

    // Extract column headers (months) - excluir el último que es "Total"
    const columns = incomeStatement.Columns?.Column || [];
    console.log('All columns:', JSON.stringify(columns.map((col: any) => col.ColTitle || col.ColType)));
    
    const months = columns.slice(1, -1).map((col: any) => col.ColTitle || col.ColType);
    
    console.log('Months found:', months.length, 'Months:', JSON.stringify(months));
    
    // Log first income row to debug values
    if (incomeStatement.Rows?.Row?.[0]?.Rows?.Row?.[0]) {
      const firstRow = incomeStatement.Rows.Row[0].Rows.Row[0];
      console.log('Sample row data:', JSON.stringify(firstRow.ColData));
    }

    // Procesar todas las secciones del reporte
    const allSections: ProcessedRow[] = [];
    let totalIncomeRow: ProcessedRow | null = null;
    let totalExpensesRow: ProcessedRow | null = null;
    let netIncomeRow: ProcessedRow | null = null;

    if (incomeStatement.Rows?.Row) {
      for (const mainSection of incomeStatement.Rows.Row) {
        const headerName = mainSection.Header?.ColData?.[0]?.value || '';
        console.log('Processing main section:', headerName);
        
        if (headerName.includes('Income') || headerName.includes('Ingresos')) {
          const sections = processSection(mainSection, 0);
          allSections.push(...sections);
          
          if (mainSection.Summary) {
            totalIncomeRow = processRow(mainSection.Summary, 0);
            if (totalIncomeRow) {
              totalIncomeRow.type = 'TotalIncome';
            }
          }
        } else if (headerName.includes('Cost') || headerName.includes('Costo')) {
          const sections = processSection(mainSection, 0);
          allSections.push(...sections);
        } else if (headerName.includes('Expense') || headerName.includes('Gasto')) {
          const sections = processSection(mainSection, 0);
          allSections.push(...sections);
          
          if (mainSection.Summary) {
            totalExpensesRow = processRow(mainSection.Summary, 0);
            if (totalExpensesRow) {
              totalExpensesRow.type = 'TotalExpenses';
            }
          }
        } else if (headerName.includes('Net') || headerName.includes('Utilidad')) {
          if (mainSection.Summary) {
            netIncomeRow = processRow(mainSection.Summary, 0);
            if (netIncomeRow) {
              netIncomeRow.type = 'NetIncome';
            }
          }
        } else {
          // Otras secciones
          const sections = processSection(mainSection, 0);
          allSections.push(...sections);
        }
      }
      
      // Si no encontramos net income en las secciones, buscar en el último summary
      if (!netIncomeRow) {
        const lastRow = incomeStatement.Rows.Row[incomeStatement.Rows.Row.length - 1];
        if (lastRow?.Summary) {
          netIncomeRow = processRow(lastRow.Summary, 0);
          if (netIncomeRow) {
            netIncomeRow.type = 'NetIncome';
          }
        }
      }
    }

    console.log('Processed sections count:', allSections.length);

    // Mostrar la línea de Ganancias netas como última fila del estado de resultados
    if (netIncomeRow) {
      allSections.push({
        name: 'Ganancias netas',
        monthlyValues: netIncomeRow.monthlyValues,
        total: netIncomeRow.total,
        type: 'Summary',
        level: 0,
        children: [],
      });
    }

    const transformedData = {
      months,
      sections: allSections,
      totalIncome: totalIncomeRow,
      totalExpenses: totalExpensesRow,
      netIncome: netIncomeRow,
      startDate,
      endDate
    };

    return new Response(
      JSON.stringify(transformedData),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Income fetch error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});