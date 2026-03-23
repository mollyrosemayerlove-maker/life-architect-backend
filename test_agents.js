import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { SCHEDULE_ARCHITECT_PROMPT } from './agents.js';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY);

async function testAgents() {
  if (!process.env.GOOGLE_GEMINI_API_KEY) {
    console.error("ERROR: GOOGLE_GEMINI_API_KEY is not set in backend/.env!");
    process.exit(1);
  }

  console.log("=== Testing Schedule Architect Agent with Gemini ===");
  const userInput = "I work Mon-Fri 6am-4pm, gym until 6pm, 15min commute to work, 15min work to gym, 30min gym to home. I want time for shower, 10min journal, breakfast before leaving. In the evening I want 1.5hrs on my business and time to cook and clean up.";
  
  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      systemInstruction: SCHEDULE_ARCHITECT_PROMPT,
      generationConfig: {
        responseMimeType: "application/json",
      }
    });

    const result = await model.generateContent(userInput);
    const output = result.response.text();

    console.log("✅ Successfully generated JSON from Gemini!");
    console.log("Extracted Schedule Output:", JSON.stringify(JSON.parse(output), null, 2));

  } catch (err) {
    console.error("Error communicating with Gemini:", err.message);
  }
}

testAgents();
