// app/api/chat/route.ts - Using Groq
import { NextResponse } from 'next/server';

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const message = body.message;
    const history = body.history || [];

    console.log("📩 Received message:", message);
    console.log("🔑 API Key exists:", !!GROQ_API_KEY);

    if (!GROQ_API_KEY) {
      return NextResponse.json({ 
        reply: "🔧 API key not configured. Please add GROQ_API_KEY to .env.local" 
      });
    }

    // Build conversation messages
    const messages = [
      { 
        role: "system", 
        content: `You are PawHealth, a friendly, expert pet care assistant. 
        Answer pet health questions thoroughly and helpfully. 
        Use emojis naturally. Be warm and conversational.
        If asked about food safety, provide specific lists.
        If asked about symptoms, advise consulting a vet.
        Keep responses informative but not too long (2-4 paragraphs max).` 
      },
      ...history.slice(-10).map((m: { role: string; content: string }) => ({ 
        role: m.role, 
        content: m.content 
      })),
      { role: "user", content: message }
    ];

    console.log("📡 Calling Groq API...");

    const response = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",  // Fast and high quality
        messages: messages,
        temperature: 0.7,
        max_tokens: 800,
        top_p: 0.95,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Groq API Error:", data);
      return NextResponse.json({ 
        reply: getFallbackResponse(message)
      });
    }

    let reply = data.choices?.[0]?.message?.content || "🐾 I'm not sure how to answer that. Could you rephrase?";
    
    // Clean up the response
    reply = reply.replace(/^Assistant:\s*/i, '').trim();

    console.log(" Reply sent, length:", reply.length);
    return NextResponse.json({ reply });

  } catch (error) {
    console.error("❌ Chat API Error:", error);
    return NextResponse.json({ 
      reply: getFallbackResponse("")
    });
  }
}

function getFallbackResponse(message: string): string {
  const lowerMsg = message.toLowerCase();
  
  if (lowerMsg.includes("food") && (lowerMsg.includes("harm") || lowerMsg.includes("toxic"))) {
    return "🐱 **Foods HARMFUL to pets:**\n\n❌ Chocolate\n❌ Grapes & Raisins\n❌ Onions & Garlic\n❌ Xylitol (sweetener)\n❌ Macadamia nuts\n❌ Alcohol & Caffeine\n\n⚠️ If your pet ate any of these, contact your vet immediately!";
  }
  
  if (lowerMsg.includes("food") && lowerMsg.includes("safe")) {
    return "🐾 **Safe foods for pets:**\n\n Cooked lean meats (chicken, turkey, beef)\n Carrots, green beans, pumpkin\n Apples (no seeds), bananas\n Plain rice\n\n⚠️ Introduce new foods gradually!";
  }
  
  if (lowerMsg.includes("hello") || lowerMsg.includes("hi")) {
    return "👋 Hello! I'm your AI pet care assistant. Ask me about:\n• Safe & toxic foods\n• Feeding schedules\n• Health concerns\n• Pet care tips\n\nWhat would you like to know? 🐾";
  }
  
  return "🐾 I'm your pet care assistant! I can help with:\n• 🍎 Safe & toxic foods\n• ⏰ Feeding schedules\n• 🏥 Health concerns\n\nWhat specific question do you have about your pet?";
}