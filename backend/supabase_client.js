/*
This give the full admin access to your database
*/

const path = require("path");
const { createClient } = require("@supabase/supabase-js");

require("dotenv").config({
    path: path.join(__dirname, ".env") // __dirname use for represent dir where .env file located (same location)
});

const supabase = createClient( // creating supabase client
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SECRET_KEY,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
            detectSessionInUrl: false
        }
    }
);

module.exports = supabase;