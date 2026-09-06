const supabase = require("../supabase_client.js");
const bcrypt = require("bcrypt");
const LoginValidation = require("../register_login_validation/login_validation.js");

/*
We need to check the database whether the username and pwd
exist or not, then check what user send 
*/

async function CheckUsernameLogin(username) {
    const { data, error } = await supabase
        .from("register")
        .select("id, username, password_hash")
        .eq("username", username)
        .maybeSingle();

    if (error) {
        console.error("Login username check error:", error);

        return {
            error: true,
            exists: false,
            data: null,
            message: error.message
        };
    }

    console.log("Login user data:", data);

    return {
        error: false,
        exists: !!data,
        data: data,
        message: ""
    };
}

async function LoginUser(username, password) {
    const validation = new LoginValidation(username, password);

    const validationResult = validation.CheckOverallLogin();

    if (!validationResult.valid) {
        return {
            status: 400,
            success: false,
            message: "Login validation failed",
            validation: validationResult
        };
    }

    const cleanUsername = username.trim();

    // Find the username in supabase database
    const usernameResult = await CheckUsernameLogin(cleanUsername);
    if (usernameResult.error) {
        return {
            status: 500,
            success: false,
            message: usernameResult.message
        };
    }

    if (!usernameResult.exists) {
        return {
            status: 401,
            success: false,
            field: "username",
            message: "Username does not exist"
        };
    }

    const passwordMatch = await bcrypt.compare(password, usernameResult.data.password_hash);
    
    if (!passwordMatch) {
        return {
            status: 401,
            success: false,
            field: "password",
            message: "Password is incorrect"
        };
    }

    return {
        status: 200,
        success: true,
        message: "Login success",
        user: {
            id: usernameResult.data.id,
            username: usernameResult.data.username
        }
    };
}

module.exports = {CheckUsernameLogin, LoginUser};

