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
  },
  // Google Gemini - free tier (requires free API key)
  gemini: {
    enabled: true, // Enable Gemini for coach mode
    apiKey: (process.env.REACT_APP_GEMINI_API_KEY || '').trim(), // Trim to remove any spaces
    model: 'gemini-1.5-flash', // or 'gemini-1.5-pro' for better quality
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/models'
  }
};

/**
 * Generate AI response using Gemini (for coach mode)
 */
export const generateCoachResponse = async (userInput, context, analysisData) => {
  // Use Gemini for coach mode if available
  const geminiApiKey = (AI_CONFIG.gemini.apiKey || '').trim();
  if (AI_CONFIG.gemini.enabled && geminiApiKey) {
    try {
      const response = await fetchWithTimeout(
        `${AI_CONFIG.gemini.endpoint}/${AI_CONFIG.gemini.model}:generateContent?key=${geminiApiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: context
              }]
            }],
            generationConfig: {
              temperature: 0.8,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 400,
            }
          })
        },
        20000
      );

      if (response.ok) {
        const data = await response.json();
        if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
          const responseText = cleanResponse(data.candidates[0].content.parts[0].text);
          if (responseText) {
            return responseText;
          }
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.log('Gemini API error:', errorData);
      }
    } catch (error) {
      console.log('Gemini API unavailable, using fallback:', error.message);
    }
  }

  // Fallback: Use improved prompt for coach mode with regular AI
  // Extract key information from context for better fallback responses
  const improvedContext = `${context}

Responde de forma natural y práctica. Si el vendedor pregunta qué decir, dale frases exactas. Si pregunta sobre una situación, dale una estrategia clara.`;

  // Pass the full context to the fallback so it can use conversation history
  return generateAIResponse(userInput, improvedContext, { id: 'coach-mode', title: 'Coach en Tiempo Real' }, analysisData?.diagnosticData || {});
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

  // Check if we're in coach mode (context contains coach mode indicators)
  const isCoachMode = context && (context.includes('Coach en Tiempo Real') || context.includes('coach de ventas en tiempo real') || stageInfo?.id === 'coach-mode');

  if (isCoachMode) {
    return `Eres un coach de ventas experto en tiempo real. Metodología: Mastering the Complex Sale de Jeff Thull.

${knowledgeSection}${context}

INSTRUCCIONES PARA COACH EN TIEMPO REAL:
- Responde de forma práctica y específica (2-3 oraciones máximo)
- Da ejemplos concretos de QUÉ DECIR al cliente
- Usa el análisis del vendedor para personalizar tu respuesta
- Sé directo y accionable
- Si no entiendes algo, pregunta específicamente qué necesita

Pregunta del vendedor: ${userInput}

Respuesta:`;
  }

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
  const contextLower = (context || '').toLowerCase();
  
  // Check if response is too vague or unclear
  // But allow short numeric/amount responses like "100k", "50k", etc.
  const isNumericResponse = /^\d+[km]?$/i.test(userInput.trim()) || /^\d+[km]?\s*(mil|k)?$/i.test(userInput.trim());
  const isVague = !isNumericResponse && (
                  userLength < 10 || 
                  userLower.includes('no sé') || 
                  userLower.includes('no se') ||
                  userLower.includes('no entiendo') ||
                  userLower === 'ok' ||
                  userLower === 'si' ||
                  userLower === 'sí');
  
  // Check if we're in coach mode - check multiple indicators
  const isCoachMode = stageId === 'coach-mode' || 
                      contextLower.includes('coach en tiempo real') || 
                      contextLower.includes('coach de ventas en tiempo real') ||
                      contextLower.includes('análisis del vendedor') ||
                      contextLower.includes('pregunta del vendedor');
  
  if (isCoachMode) {
    const userLower = userInput.toLowerCase();
    
    // Extract conversation history from context if available
    const conversationMatch = (context || '').match(/CONVERSACIÓN RECIENTE:([\s\S]*?)(?=❓|🎯|$)/i);
    const conversationHistory = conversationMatch ? conversationMatch[1].toLowerCase() : '';
    
    // Extract conversation context to understand the situation better
    // Check both full context and conversation history
    const fullContext = conversationHistory + ' ' + contextLower;
    const hasUrgency = fullContext.includes('urgente') || fullContext.includes('urgent') || fullContext.includes('ya') || fullContext.includes('necesita ya');
    const hasBrokenProduct = fullContext.includes('daño') || fullContext.includes('dano') || fullContext.includes('se rompió') || fullContext.includes('se rompio') || fullContext.includes('se le daño') || fullContext.includes('anterior') || fullContext.includes('dañada') || fullContext.includes('se le daño la lavadora');
    const hasSpecificNeed = fullContext.includes('lavar') || fullContext.includes('lavadora') || fullContext.includes('ropa');
    const clientResponded = fullContext.includes('me dijo') || fullContext.includes('dijo que') || fullContext.includes('respondió') || fullContext.includes('respondio') || fullContext.includes('necesito la lavadora');
    
    // Get product values from diagnostic data for personalized responses
    const productVal = diagnosticData?.productLevelValue || diagnosticData?.productValue || 'rápida y confiable';
    const processVal = diagnosticData?.processLevelValue || diagnosticData?.processValue || 'ahorrar tiempo';
    const perfVal = diagnosticData?.performanceLevelValue || diagnosticData?.performanceValue || 'resolver tu necesidad';
    
    // Handle very short responses that are follow-ups (like "sobre lavar ropa", "j", "a")
    if (userLength < 20 && (hasUrgency || hasBrokenProduct || hasSpecificNeed || clientResponded)) {
      if (hasBrokenProduct && hasUrgency && (hasSpecificNeed || userLower.includes('lavar') || userLower.includes('ropa'))) {
        return `Ya tienes toda la información: cliente necesita lavadora urgente porque se le dañó la anterior. Ahora conecta con el valor. Di exactamente: "Entiendo que necesitas resolver esto ya para poder lavar tu ropa. Nuestra solución es ${productVal}. Esto te ayudará a ${processVal} y significa ${perfVal}. ¿Te muestro las opciones disponibles?"`;
      }
    }
    
    // Handle follow-up questions about specific situations
    if (hasUrgency && hasBrokenProduct && (userLower.includes('qué') || userLower.includes('que') || userLower.includes('ayuda') || userLower.includes('sobre'))) {
      return `Perfecto, ya entiendes el problema (lavadora dañada, necesita lavar ropa urgente). Ahora conecta con el valor. Di: "Entiendo que necesitas resolver esto ya para poder lavar tu ropa. Nuestra solución es ${productVal}. Esto te ayudará a ${processVal} y significa ${perfVal}. ¿Te parece bien que te muestre las opciones disponibles?"`;
    }
    
    // Handle "what to say" questions with context
    if (userLower.includes('qué decir') || userLower.includes('que decir') || userLower.includes('qué le digo') || userLower.includes('que le digo') || userLower.includes('le digo') || userLower.includes('ayuda')) {
      if (hasUrgency && hasBrokenProduct) {
        return `Ya sabes el problema (lavadora dañada, urgencia). Ahora valida y conecta con valor. Di: "Entiendo que necesitas resolver esto ya para poder lavar tu ropa. Nuestra solución es ${productVal}. Esto te ayudará a ${processVal} y significa ${perfVal}. ¿Te parece bien que te muestre las opciones disponibles?"`;
      }
      if (userLower.includes('producto') || userLower.includes('necesita') || userLower.includes('necesitan') || userLower.includes('necesito')) {
        return "No presentes el producto aún. Primero pregunta: '¿Qué problema específico estás tratando de resolver?' o '¿Qué está pasando actualmente que te hace pensar que necesitas esto?' Esto te ayuda a entender el contexto antes de proponer.";
      }
      if (userLower.includes('precio') || userLower.includes('cuesta') || userLower.includes('caro') || userLower.includes('cost')) {
        return "No des el precio directo. Primero pregunta: '¿Qué presupuesto tienen asignado para esto?' o '¿Han considerado el costo de no resolver este problema?' Luego conecta el precio con el valor que identificaste.";
      }
      if (userLower.includes('objeción') || userLower.includes('dice que no') || userLower.includes('rechaza') || userLower.includes('no quiere')) {
        return "No defiendas. Pregunta: '¿Qué te preocupa específicamente?' o '¿Qué necesitarías ver para sentirte cómodo?' Escucha primero, luego aborda la preocupación con datos de tu análisis de valor.";
      }
      // Generic "what to say" response
      return "Pregunta primero para entender mejor. Por ejemplo: '¿Puedes contarme más sobre...?' o '¿Qué está pasando actualmente con...?' Luego usa esa información para personalizar tu respuesta basándote en el valor que identificaste.";
    }
    
    if (userLower.includes('cómo') || userLower.includes('como')) {
      if (userLower.includes('avanzar') || userLower.includes('progresar') || userLower.includes('mover')) {
        return "Basándote en la etapa del cliente, usa preguntas de implicación: '¿Qué ocurre si esto continúa?' o '¿Cuánto te está costando esto actualmente?' Esto ayuda a crear urgencia positiva.";
      }
      if (userLower.includes('manejar') || userLower.includes('responder') || userLower.includes('tratar')) {
        return "Escucha primero, luego reformula: 'Entiendo que te preocupa X. ¿Es correcto?' Esto valida y te da tiempo para pensar. Luego conecta con el valor que identificaste.";
      }
    }
    
    if (userLower.includes('pregunta') || userLower.includes('qué preguntar') || userLower.includes('que preguntar')) {
      return "Haz preguntas de descubrimiento: '¿Qué está pasando actualmente?' '¿Cómo manejas esto ahora?' '¿Qué desafíos has identificado?' Luego pregunta de implicación: '¿Qué ocurre si esto continúa?'";
    }
    
    // Handle "me dijeron" or "me acaban de decir" patterns
    if (userLower.includes('me dijeron') || userLower.includes('me acaban de decir') || userLower.includes('dijeron que') || userLower.includes('dice que') || userLower.includes('me pid')) {
      if (userLower.includes('necesita') || userLower.includes('necesitan') || userLower.includes('producto') || userLower.includes('ya')) {
        return "Perfecto, hay urgencia. No presentes el producto aún. Primero valida el problema: 'Entiendo que necesitas [producto] ya. ¿Qué está pasando que hace esto urgente?' o '¿Qué problema específico estás tratando de resolver con esto?' Esto te da contexto antes de proponer. Luego conecta con el valor que identificaste.";
      }
      return "Interesante. Para ayudarte mejor, ¿podrías contarme más detalles? Por ejemplo: ¿qué dijo exactamente? ¿en qué contexto? Con más información puedo darte una recomendación más específica.";
    }
    
    // Handle "qué digo" with specific product/service requests
    if ((userLower.includes('qué digo') || userLower.includes('que digo') || userLower.includes('qué le digo') || userLower.includes('que le digo')) && 
        (userLower.includes('producto') || userLower.includes('ya') || userLower.includes('necesita') || userLower.includes('pid'))) {
      const productValue = diagnosticData?.productLevelValue || diagnosticData?.productValue || 'tu producto';
      return `No presentes aún. Primero pregunta para entender: 'Entiendo que necesitas [producto] ya. ¿Qué está pasando que hace esto urgente?' o '¿Qué problema específico estás tratando de resolver?' Luego, basándote en el valor que identificaste (${productValue}), conecta la solución con su necesidad.`;
    }
    
    // Generic coach response - more helpful and natural
    return "Basándome en tu análisis, te recomiendo: 1) Pregunta primero para entender el contexto ('¿Qué está pasando actualmente?'), 2) Escucha activamente y reformula, 3) Conecta con el valor que identificaste. ¿Sobre qué situación específica necesitas ayuda?";
  }
  
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
      // Check if user is repeating the same answer
      const isRepeating = diagnosticData.typicalConversation.toLowerCase().includes(userLower) || 
                          userLower.includes(diagnosticData.typicalConversation.toLowerCase().substring(0, 20));
      
      if (diagnosticData.conversationCharacteristics.length === 0) {
        if (isRepeating) {
          // User is repeating, extract characteristics from what they said
          return "Perfecto, ya tengo esa información. Pasemos al siguiente tema.";
        }
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
          // Check if user just provided the revenue answer
          const userLower = userInput.toLowerCase();
          if (isNumericResponse || userLower.includes('100k') || userLower.includes('50k') || userLower.includes('más de') || userLower.includes('mas de') || userLower.includes('menos de') || userLower.includes('entre')) {
            // User provided answer, don't ask again
            return "Perfecto. Generando tu informe completo.";
          }
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
      // If we have diagnostic data, we might be in a transition state
      if (diagnosticData && Object.keys(diagnosticData).length > 0) {
        return "Perfecto. Pasemos al siguiente paso.";
      }
      return "Gracias. Continuemos.";
  }
};

const aiService = {
  generateAIResponse,
  AI_CONFIG
};

export default aiService;

