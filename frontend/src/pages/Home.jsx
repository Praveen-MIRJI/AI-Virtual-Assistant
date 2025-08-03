import React, { useContext, useEffect, useRef, useState } from 'react'
import { userDataContext } from '../context/UserContext'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import aiImg from "../assets/ai.gif"
import { CgMenuRight } from "react-icons/cg";
import { RxCross1 } from "react-icons/rx";
import userImg from "../assets/user.gif"
function Home() {
  const {userData,serverUrl,setUserData,getGeminiResponse}=useContext(userDataContext)
  const navigate=useNavigate()
  const [listening,setListening]=useState(false)
  const [userText,setUserText]=useState("")
  const [aiText,setAiText]=useState("")
  const isSpeakingRef=useRef(false)
  const recognitionRef=useRef(null)
  const [ham,setHam]=useState(false)
  const isRecognizingRef=useRef(false)
  const synth=window.speechSynthesis
  const [speechEnabled, setSpeechEnabled] = useState(false)

  const enableSpeech = () => {
    console.log("🎤 Enabling speech synthesis...");
    setSpeechEnabled(true);
    
    // Try to speak a test message to enable speech synthesis
    try {
      const testUtterance = new SpeechSynthesisUtterance("Speech enabled");
      testUtterance.volume = 0; // Silent test
      testUtterance.onend = () => {
        console.log("🎤 Speech synthesis successfully enabled");
      };
      testUtterance.onerror = (event) => {
        console.error("🎤 Speech enable test failed:", event.error);
      };
      window.speechSynthesis.speak(testUtterance);
    } catch (error) {
      console.error("🎤 Error enabling speech:", error);
    }
  };

  const testMicrophone = async () => {
    try {
      console.log("🎤 Testing microphone...");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log("✅ Microphone working - stream obtained");
      alert("Microphone is working! You can now use voice commands.");
      stream.getTracks().forEach(track => track.stop()); // Stop the stream
    } catch (error) {
      console.error("❌ Microphone test failed:", error);
      alert("Microphone permission denied. Please allow microphone access in browser settings.");
    }
  };

  const handleLogOut=async ()=>{
    try {
      const result=await axios.get(`${serverUrl}/api/auth/logout`,{withCredentials:true})
      setUserData(null)
      navigate("/signin")
    } catch (error) {
      setUserData(null)
      console.log(error)
    }
  }

  const startRecognition = () => {
    
   if (!isSpeakingRef.current && !isRecognizingRef.current) {
    try {
      recognitionRef.current?.start();
      console.log("Recognition requested to start");
    } catch (error) {
      if (error.name !== "InvalidStateError") {
        console.error("Start error:", error);
      }
    }
  }
    
  }

  const speak=(text)=>{
    console.log("🎤 Speaking text:", text);
    
    // Check if speech synthesis is supported
    if (!window.speechSynthesis) {
      console.error("🎤 Speech synthesis not supported");
      return;
    }
    
    // Cancel any existing speech
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Set language to English for better compatibility
    utterance.lang = 'en-US';
    utterance.rate = 0.9; // Slightly slower for clarity
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    
    // Wait for voices to load if needed
    const setVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      console.log("🎤 Available voices:", voices.length);
      
      // Try to find a good English voice
      const englishVoice = voices.find(v => 
        v.lang.startsWith('en') && v.default
      ) || voices.find(v => 
        v.lang.startsWith('en')
      ) || voices[0];
      
      if (englishVoice) {
        utterance.voice = englishVoice;
        console.log("🎤 Using voice:", englishVoice.name);
      }
    };
    
    // Set voice immediately if available
    setVoice();
    
    // If voices aren't loaded yet, wait for them
    if (window.speechSynthesis.getVoices().length === 0) {
      window.speechSynthesis.onvoiceschanged = setVoice;
    }
    
    isSpeakingRef.current = true;
    
    utterance.onstart = () => {
      console.log("🎤 Speech started");
    };
    
    utterance.onend = () => {
      console.log("🎤 Speech ended");
      setAiText("");
      isSpeakingRef.current = false;
      setTimeout(() => {
        startRecognition(); // Restart recognition after speech
      }, 800);
    };
    
    utterance.onerror = (event) => {
      console.error("🎤 Speech error:", event.error);
      
      // Handle specific error types
      if (event.error === 'not-allowed') {
        console.log("🎤 Speech blocked by browser - trying alternative approach");
        
        // Try to resume speech synthesis
        window.speechSynthesis.resume();
        
        // Try speaking again with a different approach
        setTimeout(() => {
          try {
            // Create a new utterance
            const retryUtterance = new SpeechSynthesisUtterance(text);
            retryUtterance.lang = 'en-US';
            retryUtterance.rate = 0.9;
            retryUtterance.volume = 1.0;
            
            retryUtterance.onend = () => {
              console.log("🎤 Retry speech ended");
              setAiText("");
              isSpeakingRef.current = false;
              setTimeout(() => {
                startRecognition();
              }, 800);
            };
            
            retryUtterance.onerror = (retryEvent) => {
              console.error("🎤 Retry speech failed:", retryEvent.error);
              isSpeakingRef.current = false;
              setTimeout(() => {
                startRecognition();
              }, 800);
            };
            
            window.speechSynthesis.speak(retryUtterance);
          } catch (e) {
            console.error("🎤 Retry failed:", e);
            isSpeakingRef.current = false;
            setTimeout(() => {
              startRecognition();
            }, 800);
          }
        }, 200);
      } else {
        isSpeakingRef.current = false;
        setTimeout(() => {
          startRecognition();
        }, 800);
      }
    };
    
    // Try to start speaking
    try {
      window.speechSynthesis.speak(utterance);
    } catch (error) {
      console.error("🎤 Speech synthesis error:", error);
      isSpeakingRef.current = false;
      setTimeout(() => {
        startRecognition();
      }, 800);
    }
  }

  const handleCommand=(data)=>{
    console.log("🎯 ===== HANDLING COMMAND =====");
    console.log("🎯 Data received:", data);
    
    const {type,userInput,response}=data
    console.log("🎯 Type:", type);
    console.log("🎯 User Input:", userInput);
    console.log("🎯 Response:", response);
    console.log("🎯 Calling speak function...");
    
    speak(response);
    
    if (type === 'google-search') {
      const query = encodeURIComponent(userInput);
      window.open(`https://www.google.com/search?q=${query}`, '_blank');
    }
     if (type === 'calculator-open') {
  
      window.open(`https://www.google.com/search?q=calculator`, '_blank');
    }
     if (type === "instagram-open") {
      window.open(`https://www.instagram.com/`, '_blank');
    }
    if (type ==="facebook-open") {
      window.open(`https://www.facebook.com/`, '_blank');
    }
     if (type ==="weather-show") {
      window.open(`https://www.google.com/search?q=weather`, '_blank');
    }

    if (type === 'youtube-search' || type === 'youtube-play') {
      const query = encodeURIComponent(userInput);
      window.open(`https://www.youtube.com/results?search_query=${query}`, '_blank');
    }

  }

useEffect(() => {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SpeechRecognition();

  recognition.continuous = true;
  recognition.lang = 'en-US';
  recognition.interimResults = false;

  recognitionRef.current = recognition;

  let isMounted = true;  // flag to avoid setState on unmounted component

  // Start recognition after 1 second delay only if component still mounted
  const startTimeout = setTimeout(() => {
    if (isMounted && !isSpeakingRef.current && !isRecognizingRef.current) {
      try {
        recognition.start();
        console.log("Recognition requested to start");
      } catch (e) {
        if (e.name !== "InvalidStateError") {
          console.error(e);
        }
      }
    }
  }, 1000);

  recognition.onstart = () => {
    isRecognizingRef.current = true;
    setListening(true);
  };

  recognition.onend = () => {
    isRecognizingRef.current = false;
    setListening(false);
    if (isMounted && !isSpeakingRef.current) {
      setTimeout(() => {
        if (isMounted) {
          try {
            recognition.start();
            console.log("Recognition restarted");
          } catch (e) {
            if (e.name !== "InvalidStateError") console.error(e);
          }
        }
      }, 1000);
    }
  };

  recognition.onerror = (event) => {
    console.warn("Recognition error:", event.error);
    isRecognizingRef.current = false;
    setListening(false);
    
    // Handle specific error types
    if (event.error === 'not-allowed') {
      console.error("🎤 Microphone permission denied. Please allow microphone access.");
      alert("Please allow microphone access to use voice commands.");
    } else if (event.error === 'no-speech') {
      console.log("🎤 No speech detected - this is normal when quiet");
    } else if (event.error === 'aborted') {
      console.log("🎤 Recognition aborted - this is normal during speech");
    } else {
      console.warn("🎤 Recognition error:", event.error);
    }
    
    // Only restart if it's not a permission error
    if (event.error !== "aborted" && event.error !== "not-allowed" && isMounted && !isSpeakingRef.current) {
      setTimeout(() => {
        if (isMounted) {
          try {
            recognition.start();
            console.log("Recognition restarted after error");
          } catch (e) {
            if (e.name !== "InvalidStateError") console.error(e);
          }
        }
      }, 1000);
    }
  };

  recognition.onresult = async (e) => {
    const transcript = e.results[e.results.length - 1][0].transcript.trim();
    if (transcript.toLowerCase().includes(userData.assistantName.toLowerCase())) {
      setAiText("");
      setUserText(transcript);
      recognition.stop();
      isRecognizingRef.current = false;
      setListening(false);
      const data = await getGeminiResponse(transcript);
      handleCommand(data);
      setAiText(data.response);
      setUserText("");
    }
  };


    // Initial greeting speech - only after user interaction
    // We'll trigger this when user clicks or interacts
 

  return () => {
    isMounted = false;
    clearTimeout(startTimeout);
    recognition.stop();
    setListening(false);
    isRecognizingRef.current = false;
  };
}, []);




  return (
    <div 
      className='w-full h-[100vh] bg-gradient-to-t from-[black] to-[#02023d] flex justify-center items-center flex-col gap-[15px] overflow-hidden'
      onClick={() => {
        if (!speechEnabled) {
          enableSpeech();
          // Give initial greeting after enabling speech
          setTimeout(() => {
            speak(`Hello ${userData.name}, what can I help you with?`);
          }, 500);
        }
      }}
    >
      <CgMenuRight className='lg:hidden text-white absolute top-[20px] right-[20px] w-[25px] h-[25px]' onClick={()=>setHam(true)}/>
      <div className={`absolute lg:hidden top-0 w-full h-full bg-[#00000053] backdrop-blur-lg p-[20px] flex flex-col gap-[20px] items-start ${ham?"translate-x-0":"translate-x-full"} transition-transform`}>
 <RxCross1 className=' text-white absolute top-[20px] right-[20px] w-[25px] h-[25px]' onClick={()=>setHam(false)}/>
 <button className='min-w-[150px] h-[60px]  text-black font-semibold   bg-white rounded-full cursor-pointer text-[19px] ' onClick={handleLogOut}>Log Out</button>
      <button className='min-w-[150px] h-[60px]  text-black font-semibold  bg-white  rounded-full cursor-pointer text-[19px] px-[20px] py-[10px] ' onClick={()=>navigate("/customize")}>Customize your Assistant</button>

<div className='w-full h-[2px] bg-gray-400'></div>
<h1 className='text-white font-semibold text-[19px]'>History</h1>

<div className='w-full h-[400px] gap-[20px] overflow-y-auto flex flex-col truncate'>
  {userData.history?.map((his, index)=>(
    <div key={index} className='text-gray-200 text-[18px] w-full h-[30px]  '>{his}</div>
  ))}

</div>

      </div>
      <button className='min-w-[150px] h-[60px] mt-[30px] text-black font-semibold absolute hidden lg:block top-[20px] right-[20px]  bg-white rounded-full cursor-pointer text-[19px] ' onClick={handleLogOut}>Log Out</button>
      <button className='min-w-[150px] h-[60px] mt-[30px] text-black font-semibold  bg-white absolute top-[100px] right-[20px] rounded-full cursor-pointer text-[19px] px-[20px] py-[10px] hidden lg:block ' onClick={()=>navigate("/customize")}>Customize your Assistant</button>
      <div className='w-[300px] h-[400px] flex justify-center items-center overflow-hidden rounded-4xl shadow-lg'>
<img src={userData?.assistantImage} alt="" className='h-full object-cover'/>
      </div>
      <h1 className='text-white text-[18px] font-semibold'>I'm {userData?.assistantName}</h1>
      {!aiText && <img src={userImg} alt="" className='w-[200px]'/>}
      {aiText && <img src={aiImg} alt="" className='w-[200px]'/>}
    
    <h1 className='text-white text-[18px] font-semibold text-wrap'>{userText?userText:aiText?aiText:null}</h1>
      
    </div>
  )
}

export default Home