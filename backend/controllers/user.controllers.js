 import uploadOnCloudinary from "../config/cloudinary.js"
import geminiResponse from "../gemini.js"
import User from "../models/user.model.js"
import moment from "moment"
 export const getCurrentUser=async (req,res)=>{
    try {
        const userId=req.userId
        const user=await User.findById(userId).select("-password")
        if(!user){
return res.status(400).json({message:"user not found"})
        }

   return res.status(200).json(user)     
    } catch (error) {
       return res.status(400).json({message:"get current user error"}) 
    }
}

export const updateAssistant=async (req,res)=>{
   try {
      const {assistantName,imageUrl}=req.body
      let assistantImage;
if(req.file){
   assistantImage=await uploadOnCloudinary(req.file.path)
}else{
   assistantImage=imageUrl
}

const user=await User.findByIdAndUpdate(req.userId,{
   assistantName,assistantImage
},{new:true}).select("-password")
return res.status(200).json(user)

      
   } catch (error) {
       return res.status(400).json({message:"updateAssistantError user error"}) 
   }
}


export const askToAssistant=async (req,res)=>{
   try {
      const {command}=req.body
      console.log("🎤 ===== RECEIVED COMMAND =====");
      console.log("🎤 Command:", command);
      console.log("🎤 User ID:", req.userId);
      console.log("=============================");
      
      const user=await User.findById(req.userId);
      user.history.push(command)
      user.save()
      const userName=user.name
      const assistantName=user.assistantName
      
      console.log("👤 ===== USER INFO =====");
      console.log("👤 User Name:", userName);
      console.log("👤 Assistant Name:", assistantName);
      console.log("========================");
      
      const result=await geminiResponse(command,assistantName,userName)

      // Check if result is null or undefined
      if(!result){
         console.log("❌ Gemini response is null or undefined")
         return res.status(400).json({response:"sorry, i can't understand"})
      }

      console.log("🔍 ===== PARSING RESPONSE =====");
      console.log("🔍 Raw Result:", result);
      
      const jsonMatch=result.match(/{[\s\S]*}/)
      if(!jsonMatch){
         console.log("❌ No JSON found in result:", result)
         return res.status(400).json({response:"sorry, i can't understand"})
      }
      
      console.log("🔍 JSON Match Found:", jsonMatch[0]);
      
      const gemResult=JSON.parse(jsonMatch[0])
      console.log("✅ ===== PARSED RESULT =====");
      console.log("✅ Parsed Object:", JSON.stringify(gemResult, null, 2));
      console.log("✅ Type:", gemResult.type);
      console.log("✅ User Input:", gemResult.userInput);
      console.log("✅ Response:", gemResult.response);
      console.log("============================");
      
      const type=gemResult.type

      switch(type){
         case 'get-date' :
            return res.json({
               type,
               userInput:gemResult.userInput,
               response:`current date is ${moment().format("YYYY-MM-DD")}`
            });
            case 'get-time':
                return res.json({
               type,
               userInput:gemResult.userInput,
               response:`current time is ${moment().format("hh:mm A")}`
            });
             case 'get-day':
                return res.json({
               type,
               userInput:gemResult.userInput,
               response:`today is ${moment().format("dddd")}`
            });
            case 'get-month':
                return res.json({
               type,
               userInput:gemResult.userInput,
               response:`today is ${moment().format("MMMM")}`
            });
      case 'google-search':
      case 'youtube-search':
      case 'youtube-play':
      case 'general':
      case  "calculator-open":
      case "instagram-open": 
       case "facebook-open": 
       case "weather-show" :
         return res.json({
            type,
            userInput:gemResult.userInput,
            response:gemResult.response,
         });

         default:
            return res.status(400).json({ response: "I didn't understand that command." })
      }
     

   } catch (error) {
      console.error("💥 ===== CONTROLLER ERROR =====");
      console.error("💥 Error:", error);
      console.error("💥 Stack:", error.stack);
      console.error("===============================");
      return res.status(500).json({ response: "ask assistant error" })
   }
}