const bcrypt = require("bcrypt");
const supabase = require("../supabase_client.js");

// Before create admin, go inside the backend/register_login_validation folder and run cmd

/*
PS D:\OneDrive\DME_Explorer\backend\register_login_validation> node create_admin.js
Successfullly create admin
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

    console.log("Successfullly create admin");
    console.log(data);
}

CreateAdmin();