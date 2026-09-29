import bycrypt from "bcrypt";

const pwd = "Admin1234";
const hashpwd = await bycrypt.hash(pwd, 10);
console.log(hashpwd);

const matchpwd = await bycrypt.compare(pwd, hashpwd);
console.log(matchpwd);

// $2b$10$JdDiTd0U2Falsba6V7F87uk.Wibec4/jRzoSdU1qpjba/LmxZslbC