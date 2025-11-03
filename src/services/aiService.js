/**
 * AI Service - Free AI Integration
 * Supports multiple free AI providers with intelligent fallbacks
 */

// Alternative free AI providers (you can add API keys if needed, but fallbacks work without)
const AI_CONFIG = {
  // Hugging Face - free, no API key needed for public models
  huggingFace: {
    enabled: true,
    model: 'mistralai/Mistral-7B-Instruct-v0.2',
    endpoint: 'https://api-inference.huggingface.co/models'
  },
  // Groq - free tier, very fast (requires free API key)
  groq: {
    enabled: false, // Set to true and add API key if you want to use
    apiKey: process.env.REACT_APP_GROQ_API_KEY || '',
    model: 'llama-3.1-8b-instant',
    endpoint: 'https://api.groq.com/openai/v1/chat/completions'
  },
  // Together.ai - free tier (requires free API key)
  together: {
    enabled: false, // Set to true and add API key if you want to use
    apiKey: process.env.REACT_APP_TOGETHER_API_KEY || '',
    model: 'meta-llama/Llama-3-8b-chat-hf',
    endpoint: 'https://api.together.xyz/v1/chat/completions'
  }
};

/**
 * Generate AI response using available free providers
 */
export const generateAIResponse = async (userInput, context, stageInfo) => {
  // Try Hugging Face first (no API key needed)
  if (AI_CONFIG.huggingFace.enabled) {
    try {
      const response = await fetchWithTimeout(
        `${AI_CONFIG.huggingFace.endpoint}/${AI_CONFIG.huggingFace.model}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            inputs: buildPrompt(userInput, context, stageInfo),
            parameters: {
              max_new_tokens: 200,
              temperature: 0.7,
              return_full_text: false,
              top_p: 0.9
            }
          })
        },
        15000 // 15 second timeout
      );

      if (response.ok) {
        const data = await response.json();
        if (data && !data.error) {
          const text = extractText(data);
          if (text) {
            return cleanResponse(text);
          }
        }
      }
    } catch (error) {
      console.log('Hugging Face API unavailable, using fallback:', error.message);
    }
  }

  // Try Groq if configured
  if (AI_CONFIG.groq.enabled && AI_CONFIG.groq.apiKey) {
    try {
      const response = await fetchWithTimeout(
        AI_CONFIG.groq.endpoint,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${AI_CONFIG.groq.apiKey}`
          },
          body: JSON.stringify({
            model: AI_CONFIG.groq.model,
            messages: [
              {
                role: 'system',
                content: 'You are an expert sales coach following Jeff Thull\'s Mastering the Complex Sale methodology. Provide helpful, professional guidance.'
              },
              {
                role: 'user',
                content: buildPrompt(userInput, context, stageInfo)
              }
            ],
            max_tokens: 200,
            temperature: 0.7
          })
        },
        10000
      );

      if (response.ok) {
        const data = await response.json();
        if (data.choices && data.choices[0]?.message?.content) {
          return cleanResponse(data.choices[0].message.content);
        }
      }
    } catch (error) {
      console.log('Groq API unavailable, using fallback:', error.message);
    }
  }

  // Try Together.ai if configured
  if (AI_CONFIG.together.enabled && AI_CONFIG.together.apiKey) {
    try {
      const response = await fetchWithTimeout(
        AI_CONFIG.together.endpoint,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${AI_CONFIG.together.apiKey}`
          },
          body: JSON.stringify({
            model: AI_CONFIG.together.model,
            messages: [
              {
                role: 'system',
                content: 'You are an expert sales coach following Jeff Thull\'s Mastering the Complex Sale methodology.'
              },
              {
                role: 'user',
                content: buildPrompt(userInput, context, stageInfo)
              }
            ],
            max_tokens: 200,
            temperature: 0.7
          })
        },
        15000
      );

      if (response.ok) {
        const data = await response.json();
        if (data.choices && data.choices[0]?.message?.content) {
          return cleanResponse(data.choices[0].message.content);
        }
      }
    } catch (error) {
      console.log('Together.ai API unavailable, using fallback:', error.message);
    }
  }

  // Intelligent fallback - rule-based responses
  return generateIntelligentFallback(userInput, context, stageInfo);
};

/**
 * Build prompt for AI
 */
const buildPrompt = (userInput, context, stageInfo) => {
  return `You are an expert sales coach following Jeff Thull's Mastering the Complex Sale methodology. 

Context: ${context}

Current Stage: ${stageInfo?.title || 'Unknown'}

User Response: ${userInput}

Provide a helpful, professional, and insightful follow-up that:
- Acknowledges their input appropriately
- Provides valuable insight based on the methodology
- Asks the next logical question or provides guidance
- Maintains a professional, coaching tone
- Is concise (2-3 sentences max)

Response:`;
};

/**
 * Extract text from various API response formats
 */
const extractText = (data) => {
  if (Array.isArray(data) && data[0]?.generated_text) {
    return data[0].generated_text;
  }
  if (data.generated_text) {
    return data.generated_text;
  }
  if (data[0] && typeof data[0] === 'string') {
    return data[0];
  }
  return null;
};

/**
 * Clean AI response
 */
const cleanResponse = (text) => {
  if (!text) return null;
  
  let cleaned = text.trim();
  
  // Remove common prefixes
  cleaned = cleaned.replace(/^(Response:|Answer:|Assistant:)/i, '').trim();
  
  // Remove markdown code blocks if present
  cleaned = cleaned.replace(/```[\s\S]*?```/g, '');
  
  // Limit length
  if (cleaned.length > 500) {
    cleaned = cleaned.substring(0, 497) + '...';
  }
  
  return cleaned || null;
};

/**
 * Fetch with timeout
 */
const fetchWithTimeout = (url, options, timeout = 10000) => {
  return Promise.race([
    fetch(url, options),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout')), timeout)
    )
  ]);
};

/**
 * Intelligent fallback responses based on context
 */
const generateIntelligentFallback = (userInput, context, stageInfo) => {
  const stageId = stageInfo?.id || '';
  const userLower = userInput.toLowerCase();
  
  // Stage-specific intelligent responses
  switch (stageId) {
    case 'current-state':
      if (userLower.includes('era 1') || userLower.includes('persuader')) {
        return "You've identified Era 1 (Persuader) approach. This era focuses on product features and scripted presentations. What are the main indicators that show your organization is operating in this era? For example, are your sales conversations mostly scripted, or do you focus heavily on product specifications?";
      }
      if (userLower.includes('era 2') || userLower.includes('problem solver')) {
        return "Era 2 (Problem Solver) - good! This shows you're focusing on customer needs. What specific indicators demonstrate this? For instance, do you ask about customer challenges before presenting solutions?";
      }
      if (userLower.includes('era 3') || userLower.includes('diagnostic')) {
        return "Excellent! Era 3 (Diagnostic) is the most advanced approach, focusing on collaborative discovery. What practices in your organization demonstrate this diagnostic approach?";
      }
      return "Thank you for that insight. What are the main indicators that your organization is operating in this era? Consider things like how your sales conversations are structured, how you approach customer problems, and how you present solutions.";

    case 'conversations':
      if (!context.includes('typicalConversation')) {
        return "That's helpful context. Now, can you describe a typical conversation you would have with a potential customer? Write it out in 1-2 paragraphs, including how you typically open the conversation and what topics you cover.";
      }
      return "I see. Now, let's evaluate your conversation. Did you notice any of these characteristics in your description:\n- Following a set script or presentation\n- Focusing heavily on your company, solution, or customer's future\n- Spending time clarifying the customer's business situation and problems\n- Customers reacting defensively or challenging your recommendations\n\nWhich of these apply to your conversations?";

    case 'progression':
      if (!context.includes('customerStatements')) {
        return "Good. Think of a potential customer you currently have. Write down some things this customer said in conversations that indicate where they are in their intent to buy. For example, are they satisfied with the status quo, or are they aware of problems?";
      }
      if (!context.includes('progressionStage')) {
        return "Based on what you've shared, where do you think this customer is on the Progression of Change scale?\n\nOptions: Satisfied (Life is Great), Neutral (Comfortable), Aware (It Could Happen), Concern (It is Happening), Critical (It's Costing $$$), or Crisis (Decision to Change)";
      }
      if (!context.includes('progressionActions')) {
        return "Excellent assessment. What specific actions could you take to move this customer one or two stages forward on the progression scale? Think about diagnostic questions, value discovery, or risk awareness.";
      }
      if (!context.includes('productValue')) {
        return "Now let's identify value at different levels. What value does your product or service bring on the **product level** itself? (Examples: speed, features, maintenance, reliability, etc.)";
      }
      if (!context.includes('processValue')) {
        return "Good. What value does your product or service bring on the **process level**? What processes in an organization will your product impact, and how?";
      }
      if (!context.includes('performanceValue')) {
        return "Excellent. What value does your product or service bring on the **performance level**? Once your product affects processes, how does that tie into the overall company's performance metrics?";
      }
      return "Thank you for that information. Let's continue.";

    case 'value-leakage':
      if (!context.includes('productLevelValue')) {
        return "Great! Let's map out value leakage. What value does your product or service bring on the **product level** itself? This is the obvious level - examples: speed, features, maintenance requirements, etc.";
      }
      if (!context.includes('processLevelValue')) {
        return "Perfect. What value does your product or service bring on the **process level**? What processes in an organization will your product or service impact? What potential ways can it impact the processes that surround that specific process?";
      }
      if (!context.includes('performanceLevelValue')) {
        return "Excellent. What value does your product or service bring on the **performance level**? Once your product value affects the processes in a company, how does that tie into the overall company's performance? (Think: revenue, profitability, market share, customer satisfaction, etc.)";
      }
      if (!context.includes('expectedRevenue')) {
        return "Perfect! How much extra revenue do you expect to generate after fully implementing this plan?\n\nOptions: <$50k, $50k-$100k, $100k-$250k, $250k-$500k, $500k-$1MM, or >$1MM";
      }
      return "Thank you for completing the assessment!";

    default:
      return "Thank you for that information. Let's continue exploring to build your implementation plan.";
  }
};

const aiService = {
  generateAIResponse,
  AI_CONFIG
};

export default aiService;

