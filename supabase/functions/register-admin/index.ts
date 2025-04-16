import { createClient } from 'npm:@supabase/supabase-js@2.39.7';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

interface AdminRegistrationPayload {
  email: string;
  password: string;
  registrationCode: string;
}

const REGISTRATION_CODE = "IYC2025-ADMIN"; // This should be stored securely in environment variables

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders, status: 200 });
  }

  try {
    const { email, password, registrationCode }: AdminRegistrationPayload = await req.json();

    if (registrationCode !== REGISTRATION_CODE) {
      return new Response(
        JSON.stringify({ error: "Invalid registration code" }),
        { 
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', // Use service role key for admin operations
      { 
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Create the user account
    const { data: authData, error: authError } = await supabaseClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    });

    if (authError) throw authError;

    // Add the user to the admins table
    const { error: adminError } = await supabaseClient
      .from('admins')
      .insert([{ id: authData.user.id, email }]);

    if (adminError) throw adminError;

    return new Response(
      JSON.stringify({ message: "Admin registered successfully" }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 
      }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400
      }
    );
  }
});