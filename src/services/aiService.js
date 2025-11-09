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
                content: 'Eres un coach de ventas experto siguiendo la metodología Mastering the Complex Sale de Jeff Thull. Proporciona orientación útil y profesional.'
              },
              {
                role: 'user',
                content: buildPrompt(userInput, context, stageInfo, knowledgeSnippet)
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
                content: 'Eres un coach de ventas experto siguiendo la metodología Mastering the Complex Sale de Jeff Thull.'
              },
              {
                role: 'user',
                content: buildPrompt(userInput, context, stageInfo, knowledgeSnippet)
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
  return generateIntelligentFallback(userInput, context, stageInfo, diagnosticData, knowledgeSnippet);
};

/**
 * Build prompt for AI
 */
const buildPrompt = (userInput, context, stageInfo, knowledgeSnippet = '') => {
  const knowledgeSection = knowledgeSnippet
    ? `Información de referencia basada en documentos expertos:
${knowledgeSnippet}

`
    : '';

  return `Eres un coach de ventas experto siguiendo la metodología Mastering the Complex Sale de Jeff Thull. 

${knowledgeSection}Contexto de la conversación:
${context}

Etapa Actual: ${stageInfo?.title || 'Desconocida'}

Respuesta del Usuario: ${userInput}

Proporciona un seguimiento útil, profesional e informativo que:
- Reconozca su entrada apropiadamente
- Proporcione una perspectiva valiosa basada en la metodología
- Haga la siguiente pregunta lógica o proporcione orientación
- Mantenga un tono profesional y de coaching
- Sea conciso (máximo 2-3 oraciones)

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
const generateIntelligentFallback = (userInput, context, stageInfo, diagnosticData = {}, knowledgeSnippet = '') => {
  const stageId = stageInfo?.id || '';
  const userLower = userInput.toLowerCase();
  const appendKnowledge = (text) =>
    knowledgeSnippet ? `${text}

Dato útil de referencia:
${knowledgeSnippet}` : text;
  
  // Stage-specific intelligent responses
  switch (stageId) {
    case 'current-state':
      // First response - asking about their selling approach
      if (!diagnosticData.currentEra) {
        // Acknowledge their response naturally
        if (userLower.includes('guión') || userLower.includes('guion') || userLower.includes('script')) {
          return appendKnowledge("Entiendo, usas guiones o scripts. Eso es común en muchas empresas. ¿Cómo te sientes con ese enfoque? ¿Sientes que te limita o que te ayuda a ser más consistente?");
        }
        if (userLower.includes('producto') || userLower.includes('características') || userLower.includes('features')) {
          return appendKnowledge("Ok, te enfocas en el producto. Eso puede funcionar bien. ¿Cómo reaccionan normalmente los clientes cuando les presentas las características? ¿Se muestran interesados o a veces se ven abrumados?");
        }
        if (userLower.includes('necesidad') || userLower.includes('problema') || userLower.includes('cliente')) {
          return appendKnowledge("Perfecto, te enfocas en las necesidades del cliente. Eso es muy bueno. ¿Cómo descubres qué necesita realmente el cliente? ¿Haces preguntas específicas o más bien escuchas lo que te dicen?");
        }
        // Generic acknowledgment
        return appendKnowledge(`Entiendo, ${userInput.length < 50 ? userInput.toLowerCase() : 'tu forma de trabajar'}. Eso suena interesante. ¿Podrías contarme un ejemplo concreto? Como cuando un cliente te contacta, ¿qué es lo primero que haces o le preguntas?`);
      }
      
      // Second response - asking for indicators
      if (!diagnosticData.eraIndicators) {
        // Acknowledge their specific response
        if (userLower.includes('whatsapp') || userLower.includes('mensaje') || userLower.includes('chat')) {
          return appendKnowledge("Ah, vendes por WhatsApp. Eso es muy común hoy en día. ¿Cómo estructuras esas conversaciones? ¿Tienes un formato que sigues o cada conversación es diferente?");
        }
        if (userLower.includes('necesite') || userLower.includes('necesita') || userLower.includes('adapt')) {
          return appendKnowledge("Me gusta eso, te adaptas a cómo el cliente necesita la solución. Eso muestra flexibilidad. ¿Cómo descubres qué es lo que realmente necesita el cliente? ¿Haces preguntas o esperas a que te lo digan?");
        }
        // Generic follow-up
        return appendKnowledge(`Perfecto. Basándome en lo que me dices, parece que ${userInput.length < 60 ? 'trabajas de esa manera' : 'tienes un enfoque específico'}. ¿Hay algo específico que te gustaría mejorar en tus conversaciones de venta? O si prefieres, podemos continuar con el siguiente paso.`);
      }
      
      // Should have moved to next stage by now, but just in case
      return appendKnowledge("Gracias por compartir eso conmigo. Ya tenemos suficiente información para continuar. Pasemos al siguiente paso.");

    case 'conversations':
      // First response - asking for typical conversation
      if (!diagnosticData.typicalConversation) {
        return appendKnowledge("Perfecto. Ahora, cuéntame: cuando un cliente te contacta por primera vez, ¿cómo suele ir esa conversación? No necesitas escribir mucho, solo dime las partes más importantes. Por ejemplo: ¿qué dices primero? ¿qué preguntas haces? ¿cómo termina normalmente?");
      }
      
      // Second response - asking about characteristics
      if (diagnosticData.conversationCharacteristics.length === 0) {
        // Acknowledge their description
        if (userLower.includes('pregunta') || userLower.includes('preguntar')) {
          return appendKnowledge("Me gusta que hagas preguntas. Eso es clave. ¿Qué tipo de preguntas haces? ¿Son sobre el problema del cliente, sobre su situación actual, o más sobre lo que están buscando?");
        }
        if (userLower.includes('present') || userLower.includes('muestr') || userLower.includes('explic')) {
          return appendKnowledge("Entiendo, presentas o muestras tu solución. Eso está bien. ¿Cuándo lo haces? ¿Primero escuchas al cliente o empiezas presentando?");
        }
        // Generic follow-up
        return appendKnowledge("Gracias por compartir eso. Me ayuda a entender mejor tu estilo. ¿Hay algo de esa conversación que sientes que podría mejorar? O si está funcionando bien, ¿qué crees que es lo que más te funciona?");
      }
      
      // Should have moved to next stage
      return appendKnowledge("Perfecto, ya tenemos suficiente información sobre tus conversaciones. Pasemos al siguiente tema.");

    case 'progression':
      // First - asking for customer statements
      if (!diagnosticData.customerStatements) {
        // Acknowledge urgency or need
        if (userLower.includes('urgent') || userLower.includes('urgente') || userLower.includes('necesito') || userLower.includes('necesita')) {
          return appendKnowledge("Ok, veo que hay urgencia o necesidad. Eso es importante. ¿Qué tan urgente es para ellos? ¿Es algo que tienen que resolver ya, o es más algo que quieren resolver pronto?");
        }
        if (userLower.includes('fácil') || userLower.includes('facil') || userLower.includes('mejor') || userLower.includes('simplif')) {
          return appendKnowledge("Entiendo, buscan algo que les facilite las cosas. Eso es bueno. ¿Qué tan conscientes están del problema actual? ¿Saben exactamente qué les está costando no tenerlo, o más bien es una idea de que sería mejor?");
        }
        // Generic acknowledgment
        return appendKnowledge(`Interesante. ${userInput.length < 50 ? 'Eso me ayuda a entender' : 'Basándome en eso'}. ¿Puedes contarme más sobre qué dice exactamente ese cliente? ¿Qué palabras o frases usa cuando habla contigo?`);
      }
      
      // Second - asking for progression stage
      if (!diagnosticData.progressionStage) {
        // Help them identify the stage based on what they said
        if (userLower.includes('urgent') || userLower.includes('costando') || userLower.includes('perdiendo')) {
          return appendKnowledge("Basándome en lo que me dices, parece que este cliente está en una etapa más avanzada, probablemente en 'Crítico' o 'Crisis'. ¿Sientes que están listos para tomar una decisión pronto, o aún están evaluando?");
        }
        if (userLower.includes('podría') || userLower.includes('tal vez') || userLower.includes('pensar')) {
          return appendKnowledge("Ok, suena más como que están en una etapa temprana, quizás 'Consciente' o 'Preocupación'. ¿Están más explorando ideas o ya están buscando activamente una solución?");
        }
        // Generic question
        return appendKnowledge("Perfecto. Basándome en todo lo que me has contado sobre este cliente, ¿cómo describirías su nivel de urgencia? ¿Es algo que quieren resolver ya, o más bien algo que están considerando?");
      }
      
      // Third - asking for actions
      if (!diagnosticData.progressionActions) {
        return appendKnowledge("Bien, ya sabemos dónde está el cliente. Ahora la pregunta clave: ¿qué podrías hacer para ayudarlo a avanzar? No tiene que ser complicado, solo piensa: ¿qué pregunta o información le ayudaría a entender mejor el valor de tu solución?");
      }
      
      // Fourth - asking for product value
      if (!diagnosticData.productValue) {
        return appendKnowledge("Ahora pensemos en el valor de tu producto. Empecemos simple: ¿qué tiene tu producto o servicio que sea bueno? Por ejemplo: ¿es rápido? ¿confiable? ¿fácil de usar? ¿qué características destacan?");
      }
      
      // Fifth - asking for process value
      if (!diagnosticData.processValue) {
        return appendKnowledge("Bien. Ahora, cuando alguien usa tu producto, ¿qué cambia en su forma de trabajar? Por ejemplo: ¿ahorra tiempo? ¿reduce errores? ¿simplifica algún proceso? ¿qué impacto tiene en su día a día?");
      }
      
      // Sixth - asking for performance value
      if (!diagnosticData.performanceValue) {
        return appendKnowledge("Excelente. Última pregunta sobre valor: cuando todo eso se suma, ¿cómo afecta a la empresa en general? Por ejemplo: ¿genera más ingresos? ¿reduce costos? ¿mejora la satisfacción de clientes? ¿qué impacto tiene a nivel de toda la organización?");
      }
      
      // Should have moved to next stage
      return appendKnowledge("Perfecto, ya tenemos suficiente información sobre el valor. Pasemos al siguiente paso.");

    case 'value-leakage':
      // First - product level
      if (!diagnosticData.productLevelValue) {
        return appendKnowledge("Perfecto, estamos en la última parte. Vamos a pensar en el valor de tu producto de manera simple. Empecemos: ¿qué tiene tu producto que sea bueno en sí mismo? Por ejemplo: ¿es rápido? ¿confiable? ¿tiene características especiales? Solo dime lo más importante.");
      }
      
      // Second - process level
      if (!diagnosticData.processLevelValue) {
        return appendKnowledge("Bien. Ahora pensemos en cómo tu producto afecta la forma de trabajar. Cuando alguien lo usa, ¿qué cambia en sus procesos? Por ejemplo: ¿las cosas se hacen más rápido? ¿con menos errores? ¿de manera más simple?");
      }
      
      // Third - performance level
      if (!diagnosticData.performanceLevelValue) {
        return appendKnowledge("Excelente. Y cuando todo eso se suma, ¿qué impacto tiene en el negocio completo? Por ejemplo: ¿generan más dinero? ¿gastan menos? ¿venden más? ¿mejoran en algo importante para la empresa?");
      }
      
      // Fourth - expected revenue
      if (!diagnosticData.expectedRevenue) {
        return appendKnowledge("Última pregunta: si todo esto funciona bien, ¿cuánto dinero adicional crees que podrías generar? No tiene que ser exacto, solo una idea aproximada. Por ejemplo: menos de $50k, entre $50k y $100k, más de $100k, etc.");
      }
      
      return appendKnowledge("¡Perfecto! Ya tenemos toda la información que necesitamos. En un momento te voy a generar tu informe completo.");

    default:
      return appendKnowledge("Gracias por esa información. Continuemos explorando para construir tu plan de implementación.");
  }
};

const aiService = {
  generateAIResponse,
  AI_CONFIG
};

export default aiService;

