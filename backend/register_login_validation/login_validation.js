/*
This file check the login validation of the frontend side,
checking all the information is valid before going into the database
*/

class LoginValidation {
    constructor(username, password) {
        this.username = username;
        this.password = password;
    }

    CheckOverallLogin(){
        const usernameResult = this.CheckUsernameLogin();
        const passwordResult = this.CheckPasswordLogin();
        
        return {
            valid: 
                usernameResult.valid && passwordResult.valid,
                username: usernameResult,
                password: passwordResult
        };
    }

    CheckUsernameLogin(){
        if (!this.username || this.username.trim() === ""){
            return {valid: false, message: "username required"};
        }

        if (this.username.trim().length < 3){
            return {valid: false, message: "Username atleast need 3 characters"};
        }

        return {valid: true, message: ""};
    }

    CheckPasswordLogin(){
        if (!this.password){
            return {valid: false, message: "Password requried"};
        }

        if (this.password.length < 3){
            return {valid: false, message: "Password atleast need 3 characters"};
        }

        return {valid: true, message: ""};
    }
}

export { LoginValidation };

