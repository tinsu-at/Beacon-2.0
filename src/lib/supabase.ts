import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://smtvzzptimohbnwlmwhx.supabase.co";
const supabasePublishableKey = "sb_publishable_hx1JctkXc5Qo_dtT4pqApw_mwa--fv1";

export const supabase = createClient(supabaseUrl, supabasePublishableKey);
