import express from "express"
import dotenv from "dotenv"
dotenv.config()
import connectDb from "./config/db.js"
import authRouter from "./routes/auth.routes.js"
import cors from "cors"
import cookieParser from "cookie-parser"
import userRouter from "./routes/user.routes.js"
import geminiResponse from "./gemini.js"


const app=express()

// CORS configuration for both development and production
const allowedOrigins = [
    "https://frontend-0p63.onrender.com",  // Development frontend
    "https://frontend-0p63.onrender.com",  // Alternative development port
    process.env.FRONTEND_URL  // Production frontend URL
].filter(Boolean); // Remove undefined values

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            console.log("CORS blocked origin:", origin);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}))

const port=process.env.PORT || 5000
app.use(express.json())
app.use(cookieParser())
app.use("/api/auth",authRouter)
app.use("/api/user",userRouter)


app.listen(port,()=>{
    connectDb()
    console.log(`✅ Server started on port ${port}`)
    console.log(`🌐 Allowed origins: ${allowedOrigins.join(', ')}`)
})

