class RegisterValidation {
    constructor(username, email, password, passwordConfirmation) {
        this.username = username;
        this.email = email;
        this.password = password;
        this.passwordConfirmation = passwordConfirmation;
    }

    CheckOverallRegister() {
        const usernameResult = this.CheckUsernameRegister();
        const emailResult = this.CheckEmailRegister();
        const passwordResult = this.CheckPasswordRegister();
        const passwordConfirmResult = this.CheckPasswordConfirmRegister();

        return {
            valid:
                usernameResult.valid &&
                emailResult.valid &&
                passwordResult.valid &&
                passwordConfirmResult.valid,
            username: usernameResult,
            email: emailResult,
            password: passwordResult,
            passwordConfirmation: passwordConfirmResult
        };
    }

    CheckUsernameRegister() {
        if (!this.username || this.username.trim() === "") {
            return {valid: false, message: "Username is require"};
        }

        if (this.username.trim().length < 3) {
            return {valid: false, message: "Username must be 3 characters atleast"};
        }

        return {valid: true, message: ""};
    }

    CheckEmailRegister() {
        if (!this.email || this.email.trim() === "") {
            return {valid: false, message: "Email required"};
        }

        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailPattern.test(this.email.trim())) {
            return {valid: false, message: "Enter valid email address"};
        }

        return {valid: true, message: ""};
    }

    CheckPasswordRegister() {
        if (!this.password) {
            return {valid: false, message: "Password is require."};
        }

        if (this.password.length < 3) {
            return {valid: false, message: "Password should have atleaast 3 characters"};
        }

        return {valid: true,message: ""};
    }

    CheckPasswordConfirmRegister() {
        if (!this.passwordConfirmation) {
            return {valid: false, message: "Password confirmation is required."};
        }

        if (this.password !== this.passwordConfirmation) {
            return {valid: false, message: "Password and the validation not matched"};
        }

        return {valid: true, message: ""};
    }
}

module.exports = RegisterValidation;

