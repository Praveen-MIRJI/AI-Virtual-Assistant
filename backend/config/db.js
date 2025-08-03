import mongoose from "mongoose"
import dotenv from "dotenv"

// Load environment variables
dotenv.config()

const connectDb = async () => {
    try {
        const mongoURI = process.env.MONGODB_URI || "mongodb+srv://Praveen:praveen%40123@cluster0.5hljbem.mongodb.net/"
        
        await mongoose.connect(mongoURI, {
            serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
            socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
        })
        
        console.log("✅ Database connected successfully")
    } catch (error) {
        console.error("❌ Database connection error:", error.message)
        process.exit(1) // Exit process with failure
    }
}

export default connectDb