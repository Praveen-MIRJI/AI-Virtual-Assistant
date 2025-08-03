import axios from "axios"
import dotenv from "dotenv"

// Load environment variables
dotenv.config()

const geminiResponse=async (command,assistantName,userName)=>{
try {
    const apiUrl = process.env.GEMINI_API_URL || "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent"
    const apiKey = process.env.GEMINI_API_KEY || "AIzaSyAIrmK0WI0EK5_5oRISDle_dvz7HUs7Dfg"
    
    const fullApiUrl = `${apiUrl}?key=${apiKey}`
    
    const prompt = `You are a virtual assistant named ${assistantName} created by ${userName}. 
You are not Google. You will now behave like a voice-enabled assistant.

Your task is to understand the user's natural language input and respond with a JSON object like this:

{
  "type": "general" | "google-search" | "youtube-search" | "youtube-play" | "get-time" | "get-date" | "get-day" | "get-month"|"calculator-open" | "instagram-open" |"facebook-open" |"weather-show"
  ,
  "userInput": "<original user input>" {only remove your name from userinput if exists} and agar kisi ne google ya youtube pe kuch search karne ko bola hai to userInput me only bo search baala text jaye,

  "response": "<a short spoken response to read out loud to the user>"
}

Instructions:
- "type": determine the intent of the user.
- "userinput": original sentence the user spoke.
- "response": A short voice-friendly reply, e.g., "Sure, playing it now", "Here's what I found", "Today is Tuesday", etc.

Type meanings:
- "general": if it's a factual or informational question. aur agar koi aisa question puchta hai jiska answer tume pata hai usko bhi general ki category me rakho bas short answer dena
- "google-search": if user wants to search something on Google .
- "youtube-search": if user wants to search something on YouTube.
- "youtube-play": if user wants to directly play a video or song.
- "calculator-open": if user wants to  open a calculator .
- "instagram-open": if user wants to  open instagram .
- "facebook-open": if user wants to open facebook.
-"weather-show": if user wants to know weather
- "get-time": if user asks for current time.
- "get-date": if user asks for today's date.
- "get-day": if user asks what day it is.
- "get-month": if user asks for the current month.

Important:
- Use ${userName} agar koi puche tume kisne banaya 
- Only respond with the JSON object, nothing else.


now your userInput- ${command}
`;

    // Log the data being sent to Gemini
    const requestData = {
        "contents": [{
            "parts":[{"text": prompt}]
        }]
    };
    
    console.log("🚀 ===== SENDING TO GEMINI API =====");
    console.log("📤 Command:", command);
    console.log("📤 Assistant Name:", assistantName);
    console.log("📤 User Name:", userName);
    console.log("📤 Full Request Data:", JSON.stringify(requestData, null, 2));
    console.log("📤 API URL:", fullApiUrl);
    console.log("=====================================");

    const result=await axios.post(fullApiUrl, requestData, {
        headers: {
            'Content-Type': 'application/json'
        }
    })
    
    console.log("✅ ===== GEMINI API RESPONSE =====");
    console.log("📥 Status:", result.status);
    console.log("📥 Full Response:", JSON.stringify(result.data, null, 2));
    console.log("===================================");
    
    if (!result.data.candidates || !result.data.candidates[0] || !result.data.candidates[0].content) {
        console.log("❌ Invalid response structure:", result.data)
        return null
    }
    
    const responseText = result.data.candidates[0].content.parts[0].text
    console.log("📝 ===== EXTRACTED TEXT =====");
    console.log("📝 Response Text:", responseText);
    console.log("=============================");
    return responseText
} catch (error) {
    console.error("❌ ===== GEMINI API ERROR =====");
    console.error("❌ Error Message:", error.message);
    console.error("❌ Response Data:", error.response?.data);
    console.error("❌ Status Code:", error.response?.status);
    console.error("❌ Full Error:", error);
    console.error("=============================");
    return null
}
}

export default geminiResponse