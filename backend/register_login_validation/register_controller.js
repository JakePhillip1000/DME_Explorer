const supabase = require("../supabase_client.js");
const bcrypt = require("bcrypt");
const RegisterValidation = require("../register_login_validation/register_validation.js"); // require() use for import modules from separate file or external

async function CheckUsernameExists(username) {
    const { data, error } = await supabase
        .from("register")
        .select("id")
        .eq("username", username)
        .maybeSingle();

    if (error) {
        console.error("Username check error:", error);

        return {
            error: true,
            exists: false,
            message: "Unable to check username."
        };
    }

    return {
        error: false,
        exists: !!data,
        message: ""
    };
}

async function CheckEmailExists(email) {
    const { data, error } = await supabase
        .from("register")
        .select("id")
        .eq("email", email)
        .maybeSingle();

    if (error) {
        console.error("Email check error:", error);

        return {
            error: true,
            exists: false,
            message: "Unable to check email."
        };
    }

    return {
        error: false,
        exists: !!data,
        message: ""
    };
}

async function CreateRegister(username, email, password) {
    try {
        const passwordHash = await bcrypt.hash(password, 12);

        const { error: registerError } = await supabase
            .from("register")
            .insert({
                username: username,
                email: email,
                password_hash: passwordHash
            });

        if (registerError) {
            console.error("Register table error:", registerError);

            return {
                success: false,
                message: "Unable to save registration information."
            };
        }

        return {
            success: true,
            message: "Registration successful."
        };
    } catch (error) {
        console.error("Create register error:", error);

        return {
            success: false,
            message: "Unable to create account."
        };
    }
}

async function RegisterUser(username, email, password, passwordConfirmation) {
    const validation = new RegisterValidation(username, email, password, passwordConfirmation);

    const validationResult = validation.CheckOverallRegister();

    if (!validationResult.valid) {
        return {
            status: 400,
            success: false,
            message: "Registration validation failed.",
            validation: validationResult
        };
    }

    const cleanUsername = username.trim();
    const cleanEmail = email.trim().toLowerCase();

    const usernameResult = await CheckUsernameExists(cleanUsername);

    if (usernameResult.error) {
        return {
            status: 500,
            success: false,
            message: usernameResult.message
        };
    }

    if (usernameResult.exists) {
        return {
            status: 409,
            success: false,
            field: "username",
            message: "Username already exists."
        };
    }

    const emailResult = await CheckEmailExists(cleanEmail);

    if (emailResult.error) {
        return {
            status: 500,
            success: false,
            message: emailResult.message
        };
    }

    if (emailResult.exists) {
        return {
            status: 409,
            success: false,
            field: "email",
            message: "Email already exist"
        };
    }

    const registerResult = await CreateRegister(cleanUsername, cleanEmail, password);

    return {status: registerResult.success ? 201 : 500, ...registerResult};
}

module.exports = {
    CheckUsernameExists,
    CheckEmailExists,
    CreateRegister,
    RegisterUser
};