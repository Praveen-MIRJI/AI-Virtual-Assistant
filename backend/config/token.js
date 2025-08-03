import jwt from "jsonwebtoken"
import dotenv from "dotenv"

// Load environment variables
dotenv.config()

const genToken=async (userId)=>{
    try {
        const jwtSecret = process.env.JWT_SECRET || "mysecretkey123456789"
        const token = await jwt.sign({userId}, jwtSecret, {expiresIn:"10d"})
        return token
    } catch (error) {
        console.log(error)
    }
}

export default genToken