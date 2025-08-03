import { v2 as cloudinary } from 'cloudinary';
import fs from "fs"
import dotenv from "dotenv"

// Load environment variables
dotenv.config()

const uploadOnCloudinary =async (filePath)=>{
     cloudinary.config({ 
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "dx4mygnyt", 
        api_key: process.env.CLOUDINARY_API_KEY || "387547149113656", 
        api_secret: process.env.CLOUDINARY_API_SECRET || "ZklrA2YFX2zUyh6vv4K92Mhl2Zg" 
    });

    try {
        const uploadResult = await cloudinary.uploader
       .upload(filePath)
       fs.unlinkSync(filePath)
       return uploadResult.secure_url
    } catch (error) {
    fs.unlinkSync(filePath)
    return res.status(500).json({message:"cloudinary error"})
    }
}

export default uploadOnCloudinary