/**
 * AI Service - Free AI Integration
 * Supports multiple free AI providers with intelligent fallbacks
 */

import { getRelevantKnowledge } from './knowledgeService';

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
export const generateAIResponse = async (userInput, context, stageInfo, diagnosticData = {}) => {
  const knowledgeSnippet = getRelevantKnowledge({ userInput, stageInfo, diagnosticData });

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
            inputs: buildPrompt(userInput, context, stageInfo, knowledgeSnippet),
            parameters: {
              max_new_tokens: 100,
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
                content: 'Eres un coach de ventas. Responde en 1-2 oraciones máximo. Si no entiendes algo, di EXACTAMENTE qué no entiendes y pregunta específicamente por eso.'
              },
              {
                role: 'user',
                content: buildPrompt(userInput, context, stageInfo, knowledgeSnippet)
              }
            ],
            max_tokens: 100,
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
                content: 'Eres un coach de ventas. Responde en 1-2 oraciones máximo. Si no entiendes algo, di EXACTAMENTE qué no entiendes y pregunta específicamente por eso.'
              },
              {
                role: 'user',
                content: buildPrompt(userInput, context, stageInfo, knowledgeSnippet)
              }
            ],
            max_tokens: 100,
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
  return generateIntelligentFallback(userInput, context, stageInfo, diagnosticData, knowledgeSnippet);
};

/**
 * Build prompt for AI
 */
const buildPrompt = (userInput, context, stageInfo, knowledgeSnippet = '') => {
  const knowledgeSection = knowledgeSnippet
    ? `Información de referencia:
${knowledgeSnippet}

`
    : '';

  return `Eres un coach de ventas. Metodología: Mastering the Complex Sale de Jeff Thull.

${knowledgeSection}Etapa: ${stageInfo?.title || 'Desconocida'}

Usuario dijo: ${userInput}

INSTRUCCIONES:
- Responde en 1-2 oraciones máximo. Sé breve y directo.
- Si no entiendes algo o falta información, di EXACTAMENTE qué no entiendes y pregunta específicamente por eso.
- Si entiendes, haz una pregunta corta para continuar.
- No des explicaciones largas. Solo lo esencial.

Respuesta:`;
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
  
  // Limit length - keep responses short
  if (cleaned.length > 200) {
    cleaned = cleaned.substring(0, 197) + '...';
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
const generateIntelligentFallback = (userInput, context, stageInfo, diagnosticData = {}, knowledgeSnippet = '') => {
  const stageId = stageInfo?.id || '';
  const userLower = userInput.toLowerCase();
  const userLength = userInput.trim().length;
  
  // Check if response is too vague or unclear
  const isVague = userLength < 10 || 
                  userLower.includes('no sé') || 
                  userLower.includes('no se') ||
                  userLower.includes('no entiendo') ||
                  userLower === 'ok' ||
                  userLower === 'si' ||
                  userLower === 'sí';
  
  // Stage-specific intelligent responses
  switch (stageId) {
    case 'current-state':
      // First response - asking about their selling approach
      if (!diagnosticData.currentEra) {
        if (isVague) {
          return "No entiendo bien. ¿Podrías ser más específico? Por ejemplo: ¿sigues un guión cuando vendes o prefieres conversaciones más libres?";
        }
        if (userLower.includes('guión') || userLower.includes('guion') || userLower.includes('script')) {
          return "Ok, usas guiones. ¿Te sientes cómodo con eso o te limita?";
        }
        if (userLower.includes('producto') || userLower.includes('características')) {
          return "Te enfocas en el producto. ¿Cómo reaccionan los clientes cuando les presentas características?";
        }
        if (userLower.includes('necesidad') || userLower.includes('problema') || userLower.includes('cliente')) {
          return "Bien, te enfocas en necesidades. ¿Cómo descubres qué necesita el cliente?";
        }
        return "¿Podrías darme un ejemplo? Cuando un cliente te contacta, ¿qué es lo primero que haces?";
      }
      
      // Second response - asking for indicators
      if (!diagnosticData.eraIndicators) {
        if (isVague) {
          return "Necesito más detalles. ¿Qué indicadores específicos muestran que trabajas así? Por ejemplo: ¿qué herramientas usas o cómo estructuras tus conversaciones?";
        }
        if (userLower.includes('whatsapp') || userLower.includes('mensaje')) {
          return "Vendes por WhatsApp. ¿Tienes un formato que sigues o cada conversación es diferente?";
        }
        return "¿Hay algo específico que te gustaría mejorar en tus conversaciones?";
      }
      
      return "Perfecto. Pasemos al siguiente paso.";

    case 'conversations':
      // First response - asking for typical conversation
      if (!diagnosticData.typicalConversation) {
        if (isVague) {
          return "No entiendo bien. ¿Podrías contarme un ejemplo concreto? ¿Qué dices primero cuando un cliente te contacta?";
        }
        return "¿Cómo suele ir esa conversación? ¿Qué dices primero y qué preguntas haces?";
      }
      
      // Second response - asking about characteristics
      if (diagnosticData.conversationCharacteristics.length === 0) {
        if (isVague) {
          return "Necesito más detalles. ¿Qué tipo de preguntas haces? ¿Sobre el problema del cliente o sobre lo que buscan?";
        }
        if (userLower.includes('pregunta') || userLower.includes('preguntar')) {
          return "Bien, haces preguntas. ¿Sobre qué? ¿El problema del cliente o su situación actual?";
        }
        if (userLower.includes('present') || userLower.includes('muestr')) {
          return "Presentas tu solución. ¿Primero escuchas al cliente o empiezas presentando?";
        }
        return "¿Hay algo de esa conversación que sientes que podría mejorar?";
      }
      
      return "Perfecto. Pasemos al siguiente tema.";

    case 'progression':
      // First - asking for customer statements
      if (!diagnosticData.customerStatements) {
        if (isVague) {
          return "No entiendo bien. ¿Qué te ha dicho exactamente ese cliente? ¿Qué palabras usa?";
        }
        if (userLower.includes('urgent') || userLower.includes('urgente') || userLower.includes('necesito')) {
          return "Hay urgencia. ¿Qué tan urgente? ¿Tienen que resolverlo ya o más bien pronto?";
        }
        return "¿Qué dice exactamente ese cliente? ¿Qué palabras o frases usa?";
      }
      
      // Second - asking for progression stage
      if (!diagnosticData.progressionStage) {
        if (isVague) {
          return "Necesito más claridad. ¿Cómo describirías su urgencia? ¿Quieren resolverlo ya o solo lo están considerando?";
        }
        if (userLower.includes('urgent') || userLower.includes('costando') || userLower.includes('perdiendo')) {
          return "Parece etapa avanzada (Crítico/Crisis). ¿Están listos para decidir pronto?";
        }
        if (userLower.includes('podría') || userLower.includes('tal vez') || userLower.includes('pensar')) {
          return "Suena etapa temprana (Consciente/Preocupación). ¿Están explorando o ya buscan activamente?";
        }
        return "¿Cómo describirías su urgencia? ¿Ya o solo considerando?";
      }
      
      // Third - asking for actions
      if (!diagnosticData.progressionActions) {
        if (isVague) {
          return "No entiendo. ¿Qué pregunta o información específica le ayudaría a entender el valor de tu solución?";
        }
        return "¿Qué podrías hacer para ayudarlo a avanzar? ¿Qué pregunta o información le ayudaría?";
      }
      
      // Fourth - asking for product value
      if (!diagnosticData.productValue) {
        if (isVague) {
          return "Necesito más detalles. ¿Qué tiene tu producto que sea bueno? Por ejemplo: ¿es rápido, confiable, fácil de usar?";
        }
        return "¿Qué tiene tu producto que sea bueno? ¿Es rápido, confiable, fácil de usar?";
      }
      
      // Fifth - asking for process value
      if (!diagnosticData.processValue) {
        if (isVague) {
          return "No entiendo bien. ¿Qué cambia cuando alguien usa tu producto? ¿Ahorra tiempo, reduce errores?";
        }
        return "Cuando alguien usa tu producto, ¿qué cambia? ¿Ahorra tiempo, reduce errores?";
      }
      
      // Sixth - asking for performance value
      if (!diagnosticData.performanceValue) {
        if (isVague) {
          return "Necesito más claridad. ¿Cómo afecta a la empresa? ¿Genera más ingresos, reduce costos?";
        }
        return "¿Cómo afecta a la empresa? ¿Genera más ingresos, reduce costos?";
      }
      
      return "Perfecto. Pasemos al siguiente paso.";

    case 'value-leakage':
      // If we already have values from stage 3, only ask for expected revenue
      // Otherwise, ask for the values (fallback case)
      if (diagnosticData.productLevelValue && diagnosticData.processLevelValue && diagnosticData.performanceLevelValue) {
        // We have all values, only need expected revenue
        if (!diagnosticData.expectedRevenue) {
          if (isVague) {
            return "Necesito más claridad. ¿Cuánto dinero adicional podrías generar? Por ejemplo: menos de $50k, entre $50k y $100k, más de $100k?";
          }
          return "¿Cuánto dinero adicional podrías generar? Menos de $50k, entre $50k y $100k, más de $100k?";
        }
        return "¡Perfecto! Generando tu informe completo.";
      }
      
      // Fallback: if values weren't copied from stage 3, ask for them
      // First - product level
      if (!diagnosticData.productLevelValue) {
        if (isVague) {
          return "No entiendo. ¿Qué tiene tu producto que sea bueno? Por ejemplo: ¿es rápido, confiable?";
        }
        return "¿Qué tiene tu producto que sea bueno? ¿Es rápido, confiable, tiene características especiales?";
      }
      
      // Second - process level
      if (!diagnosticData.processLevelValue) {
        if (isVague) {
          return "Necesito más detalles. ¿Qué cambia cuando alguien usa tu producto? ¿Se hace más rápido, con menos errores?";
        }
        return "Cuando alguien lo usa, ¿qué cambia? ¿Se hace más rápido, con menos errores?";
      }
      
      // Third - performance level
      if (!diagnosticData.performanceLevelValue) {
        if (isVague) {
          return "No entiendo bien. ¿Qué impacto tiene en el negocio? ¿Generan más dinero, gastan menos?";
        }
        return "¿Qué impacto tiene en el negocio? ¿Generan más dinero, gastan menos?";
      }
      
      // Fourth - expected revenue
      if (!diagnosticData.expectedRevenue) {
        if (isVague) {
          return "Necesito más claridad. ¿Cuánto dinero adicional podrías generar? Por ejemplo: menos de $50k, entre $50k y $100k, más de $100k?";
        }
        return "¿Cuánto dinero adicional podrías generar? Menos de $50k, entre $50k y $100k, más de $100k?";
      }
      
      return "¡Perfecto! Generando tu informe completo.";

    default:
      return "Gracias. Continuemos.";
  }
};

const aiService = {
  generateAIResponse,
  AI_CONFIG
};

export default aiService;

