import bcrypt from "bcrypt";
import supabase from "../supabase_client.js";

// Before creating admin, go inside the
// backend/register_login_validation folder and run:
//
// node create_admin.js

/*
Successfully created admin
{
  id: '910875da-1848-435a-bbc1-514d26712bc2',
  username: 'admin',
  email: 'admin1234@gmail.com'
}
*/

async function CreateAdmin() {
    // here I define the admin
    const username = "admin";
    const email = "admin1234@gmail.com";
    const password = "Admin1234";

    const passwordHash = await bcrypt.hash(password, 12);

    const { data, error } = await supabase
        .from("register")
        .insert({
            username: username,
            email: email,
            password_hash: passwordHash
        })
        .select("id, username, email")
        .single();

    if (error) {
        console.error("Failed to create admin:", error.message);
        return;
    }

    console.log("Successfully created admin");
    console.log(data);
}

CreateAdmin();
