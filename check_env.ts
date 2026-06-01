
import dotenv from "dotenv";
dotenv.config();

console.log("SQL_HOST:", process.env.SQL_HOST || "MISSING");
console.log("SQL_DB_NAME:", process.env.SQL_DB_NAME || "MISSING");
console.log("SQL_USER:", process.env.SQL_USER || "MISSING");
