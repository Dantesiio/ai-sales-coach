import React, { useState, useEffect, useRef } from 'react';
import { Send, User, Bot, TrendingUp, Target, MessageCircle, BarChart3, Sparkles, Loader2 } from 'lucide-react';
import { generateAIResponse } from './services/aiService';

const SalesCoachBot = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [stage, setStage] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const initializedRef = useRef(false);
  
  const [diagnosticData, setDiagnosticData] = useState({
    // Action 1: Current State
    currentEra: '',
    eraIndicators: '',
    
    // Action 2: Sales Conversations
    typicalConversation: '',
    conversationCharacteristics: [],
    
    // Action 3: Progression to Change
    customerStatements: '',
    progressionStage: '',
    progressionActions: '',
    productValue: '',
    processValue: '',
    performanceValue: '',
    
    // Action 4: Value Leakage
    productLevelValue: '',
    processLevelValue: '',
    performanceLevelValue: '',
    expectedRevenue: ''
  });

  const stages = [
    {
      id: 'current-state',
      title: "Acción 1: Analizar Tu Estado Actual",
      icon: BarChart3,
      color: "bg-blue-500",
      description: "Entendiendo en qué era de ventas se encuentra tu empresa"
    },
    {
      id: 'conversations',
      title: "Acción 2: Analizar Tus Conversaciones de Ventas",
      icon: MessageCircle,
      color: "bg-purple-500",
      description: "Evaluando tu enfoque actual de ventas"
    },
    {
      id: 'progression',
      title: "Acción 3: Escala de Progresión al Cambio",
      icon: TrendingUp,
      color: "bg-green-500",
      description: "Entendiendo dónde se encuentra tu cliente en el viaje del cambio"
    },
    {
      id: 'value-leakage',
      title: "Acción 4: Identificar la Fuga de Valor",
      icon: Target,
      color: "bg-orange-500",
      description: "Mapeando el valor en los niveles de Producto, Proceso y Rendimiento"
    }
  ];

  const progressionScale = [
    { stage: 'Satisfecho', position: 'La Vida es Genial', probability: 'Baja' },
    { stage: 'Neutral', position: 'Cómodo', probability: 'Baja' },
    { stage: 'Consciente', position: 'Podría Suceder', probability: 'Media' },
    { stage: 'Preocupación', position: 'Está Sucediendo', probability: 'Media' },
    { stage: 'Crítico', position: 'Está Costando $$$', probability: 'Alta' },
    { stage: 'Crisis', position: 'Decisión de Cambiar', probability: 'Alta' }
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (messages.length === 0 && !initializedRef.current) {
      initializedRef.current = true;
      initializeConversation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const initializeConversation = () => {
    const welcomeMessage = "¡Hola! 👋 Soy tu Coach de Ventas con IA. Te voy a ayudar a mejorar tu estrategia de ventas paso a paso.\n\nEmpecemos con algo simple: ¿cómo describirías tu forma actual de vender?\n\nPor ejemplo:\n• ¿Sueles seguir un guión o script cuando hablas con clientes?\n• ¿Te enfocas más en explicar tu producto o en entender las necesidades del cliente?\n• ¿Cómo sueles iniciar tus conversaciones de venta?";
    addBotMessage(welcomeMessage);
  };

  const addBotMessage = (text, delay = 0) => {
    setTimeout(() => {
      setMessages(prev => [...prev, { type: 'bot', text, timestamp: new Date() }]);
    }, delay);
  };


  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setMessages(prev => [...prev, { type: 'user', text: userMessage, timestamp: new Date() }]);
    setInput('');
    setIsLoading(true);

    // Update diagnostic data based on current stage
    updateDiagnosticData(userMessage);

    // Get conversation context
    const recentMessages = messages.slice(-6).map(m => `${m.type === 'user' ? 'User' : 'Bot'}: ${m.text}`).join('\n');
    const context = `Current Stage: ${stages[stage].title}\n\nRecent conversation:\n${recentMessages}\n\nDiagnostic data collected so far: ${JSON.stringify(diagnosticData, null, 2)}`;

    // Generate AI response using the AI service
    const aiResponse = await generateAIResponse(userMessage, context, stages[stage], diagnosticData);
    
    addBotMessage(aiResponse, 300);
    setIsLoading(false);

    // Check if we should advance to next stage
    checkStageAdvancement();
  };

  const updateDiagnosticData = (userInput) => {
    const currentStage = stages[stage];
    
    switch (currentStage.id) {
      case 'current-state':
        if (diagnosticData.currentEra === '') {
          setDiagnosticData(prev => ({ ...prev, currentEra: userInput }));
        } else if (diagnosticData.eraIndicators === '' && diagnosticData.currentEra !== '') {
          // Only update if we have a meaningful response (not just "continuemos" or similar)
          const userLower = userInput.toLowerCase();
          if (!userLower.includes('continu') && !userLower.includes('siguiente') && userInput.trim().length > 5) {
            setDiagnosticData(prev => ({ ...prev, eraIndicators: userInput }));
          }
        }
        break;
        
      case 'conversations':
        if (diagnosticData.typicalConversation === '') {
          setDiagnosticData(prev => ({ ...prev, typicalConversation: userInput }));
        } else if (diagnosticData.conversationCharacteristics.length === 0) {
          // Extract characteristics from user input
          const characteristics = [];
          const userLower = userInput.toLowerCase();
          if (userLower.includes('script') || userLower.includes('guión') || userLower.includes('guion') || userLower.includes('guion')) characteristics.push('Guión establecido');
          if (userLower.includes('company') || userLower.includes('solution') || userLower.includes('empresa') || userLower.includes('solución')) characteristics.push('Enfoque en empresa/solución');
          if (userLower.includes('problem') || userLower.includes('situation') || userLower.includes('problema') || userLower.includes('situación') || userLower.includes('pregunta')) characteristics.push('Enfoque en problemas del cliente');
          if (userLower.includes('defensive') || userLower.includes('challenge') || userLower.includes('defensiva') || userLower.includes('desafío') || userLower.includes('clientes')) characteristics.push('Reacciones del cliente');
          // If no specific characteristics found but user gave a response, mark as having some characteristics
          if (characteristics.length === 0 && userInput.trim().length > 10) {
            characteristics.push('Otros aspectos');
          }
          if (characteristics.length > 0) {
            setDiagnosticData(prev => ({ ...prev, conversationCharacteristics: characteristics }));
          }
        }
        break;
        
      case 'progression':
        {
          const userLower = userInput.toLowerCase();
          // Skip if user just says "continuemos" or similar
          if ((userLower.includes('continu') || userLower.includes('siguiente') || userLower.includes('ok')) && userInput.trim().length < 10) {
            break;
          }
          
          if (diagnosticData.customerStatements === '') {
            setDiagnosticData(prev => ({ ...prev, customerStatements: userInput }));
          } else if (diagnosticData.progressionStage === '' && userInput.trim().length > 5) {
            setDiagnosticData(prev => ({ ...prev, progressionStage: userInput }));
          } else if (diagnosticData.progressionActions === '' && userInput.trim().length > 5) {
            setDiagnosticData(prev => ({ ...prev, progressionActions: userInput }));
          } else if (diagnosticData.productValue === '' && userInput.trim().length > 5) {
            setDiagnosticData(prev => ({ ...prev, productValue: userInput }));
          } else if (diagnosticData.processValue === '' && userInput.trim().length > 5) {
            setDiagnosticData(prev => ({ ...prev, processValue: userInput }));
          } else if (diagnosticData.performanceValue === '' && userInput.trim().length > 5) {
            setDiagnosticData(prev => ({ ...prev, performanceValue: userInput }));
          }
        }
        break;
        
      case 'value-leakage':
        if (diagnosticData.productLevelValue === '') {
          setDiagnosticData(prev => ({ ...prev, productLevelValue: userInput }));
        } else if (diagnosticData.processLevelValue === '') {
          setDiagnosticData(prev => ({ ...prev, processLevelValue: userInput }));
        } else if (diagnosticData.performanceLevelValue === '') {
          setDiagnosticData(prev => ({ ...prev, performanceLevelValue: userInput }));
        } else {
          setDiagnosticData(prev => ({ ...prev, expectedRevenue: userInput }));
        }
        break;
        
      default:
        // No action needed for unknown stages
        break;
    }
  };

  const checkStageAdvancement = () => {
    const currentStage = stages[stage];
    
    switch (currentStage.id) {
      case 'current-state':
        if (diagnosticData.currentEra && diagnosticData.eraIndicators) {
          setTimeout(() => {
            setStage(1);
            addBotMessage("Perfecto, ya tengo una buena idea de cómo trabajas. 👍\n\nAhora hablemos de tus conversaciones. Cuando un cliente te contacta, ¿cómo suele ir esa charla? Solo cuéntame lo básico: ¿qué dices primero? ¿qué preguntas haces? ¿cómo termina normalmente?", 2000);
          }, 2000);
        }
        break;
        
      case 'conversations':
        if (diagnosticData.typicalConversation && diagnosticData.conversationCharacteristics.length > 0) {
          setTimeout(() => {
            setStage(2);
            addBotMessage("Genial, ya entiendo mejor tus conversaciones. 👌\n\nAhora pensemos en un cliente específico. ¿Tienes algún cliente potencial con el que estés hablando ahora? Si sí, cuéntame: ¿qué te ha dicho ese cliente? ¿Qué palabras usa? ¿Menciona que necesita algo urgente, o más bien está explorando opciones?", 2000);
          }, 2000);
        }
        break;
        
      case 'progression':
        if (diagnosticData.customerStatements && diagnosticData.progressionStage && diagnosticData.productValue && diagnosticData.processValue && diagnosticData.performanceValue) {
          setTimeout(() => {
            setStage(3);
            addBotMessage("Excelente, ya tengo una buena idea de dónde está tu cliente. 🎯\n\nAhora vamos a pensar en el valor de tu producto. Empecemos simple: ¿qué tiene tu producto que sea bueno? Por ejemplo: ¿es rápido? ¿confiable? ¿fácil de usar? Solo dime lo más importante.", 2000);
          }, 2000);
        }
        break;
        
      case 'value-leakage':
        if (diagnosticData.productLevelValue && diagnosticData.processLevelValue && diagnosticData.performanceLevelValue && diagnosticData.expectedRevenue) {
          setTimeout(() => {
            generateFinalReport();
          }, 2000);
        }
        break;
        
      default:
        // No action needed for unknown stages
        break;
    }
  };

  const generateFinalReport = () => {
    const report = `# 📊 INFORME DEL PLAN DE IMPLEMENTACIÓN
*Basado en la Metodología Mastering the Complex Sale de Jeff Thull*

---

## ACCIÓN 1: ANÁLISIS DEL ESTADO ACTUAL

### Evaluación de la Era Actual
**Era Identificada:** ${diagnosticData.currentEra}

**Indicadores Clave:**
${diagnosticData.eraIndicators}

---

## ACCIÓN 2: ANÁLISIS DE CONVERSACIONES DE VENTAS

### Conversación Típica
${diagnosticData.typicalConversation}

### Características de Conversación Identificadas
${diagnosticData.conversationCharacteristics.length > 0 
  ? diagnosticData.conversationCharacteristics.map(c => `- ${c}`).join('\n')
  : 'Ninguna específicamente identificada'}

**Evaluación:** ${diagnosticData.conversationCharacteristics.length > 2 
  ? '⚠️ Tus conversaciones pueden necesitar cambiar hacia el enfoque de Era 3 (Diagnóstico) - enfócate más en el descubrimiento colaborativo y el análisis de la situación del cliente.'
  : '✅ Tus conversaciones muestran características de un enfoque más diagnóstico.'}

---

## ACCIÓN 3: ESCALA DE PROGRESIÓN AL CAMBIO

### Declaraciones del Cliente
${diagnosticData.customerStatements}

### Etapa Identificada
**Etapa:** ${diagnosticData.progressionStage}

### Acciones para Avanzar al Cliente
${diagnosticData.progressionActions || 'Por desarrollar según la etapa del cliente'}

### Identificación de Valor

**Valor a Nivel de Producto:**
${diagnosticData.productValue}

**Valor a Nivel de Proceso:**
${diagnosticData.processValue}

**Valor a Nivel de Rendimiento:**
${diagnosticData.performanceValue}

---

## ACCIÓN 4: IDENTIFICACIÓN DE FUGA DE VALOR

### Valor a Nivel de Producto
${diagnosticData.productLevelValue}

### Valor a Nivel de Proceso
${diagnosticData.processLevelValue}

### Valor a Nivel de Rendimiento
${diagnosticData.performanceLevelValue}

### Impacto de Ingresos Esperado
**Ingresos Adicionales Esperados:** ${diagnosticData.expectedRevenue}

---

## 🎯 INSIGHTS Y RECOMENDACIONES CLAVE

1. **Transición de Era:** Enfócate en avanzar de ${diagnosticData.currentEra} hacia el enfoque de ventas de Era 3 (Diagnóstico)
2. **Progresión del Cliente:** El cliente está en la etapa ${diagnosticData.progressionStage} - desarrolla estrategias para avanzarlo
3. **Articulación de Valor:** Asegúrate de comunicar el valor en los tres niveles (Producto, Proceso, Rendimiento)
4. **Estilo de Conversación:** Cambia de ${diagnosticData.conversationCharacteristics.length > 2 ? 'con guión/presentacional' : 'actual'} a conversaciones diagnósticas colaborativas

---

## 📋 PRÓXIMOS PASOS

1. Revisa y valida esta evaluación con tu equipo
2. Desarrolla elementos de acción específicos para cada área identificada
3. Crea preguntas diagnósticas específicas para el cliente basadas en la etapa de progresión
4. Construye propuestas de valor que aborden los tres niveles de valor
5. Practica conversaciones diagnósticas de Era 3 con tu equipo de ventas

---

*Informe generado por Coach de Ventas con IA - Plan de Implementación Mastering the Complex Sale*
*${new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}*`;

    addBotMessage("🎉 **¡Felicidades!** Has completado el Plan de Implementación. Aquí está tu informe completo:", 1000);
      setTimeout(() => {
      setMessages(prev => [...prev, { type: 'report', text: report, timestamp: new Date() }]);
      }, 2000);
  };

  const StageIcon = stages[stage]?.icon || BarChart3;

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700 p-4 shadow-lg">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-blue-400" />
              Coach de Ventas con IA
            </h1>
            <span className="bg-slate-700 px-3 py-1 rounded-full text-sm text-slate-300">
              Acción {stage + 1} de {stages.length}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-300">
            <StageIcon className="w-4 h-4" />
            <span className="font-medium">{stages[stage]?.title}</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">{stages[stage]?.description}</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-slate-800 px-4 pb-2">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-1">
            {stages.map((s, idx) => (
              <div 
                key={idx} 
                className={`h-1.5 flex-1 rounded-full transition-all ${
                  idx < stage ? 'bg-green-500' : 
                  idx === stage ? s.color.replace('bg-', 'bg-') : 
                  'bg-slate-700'
                }`}
                title={s.title}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Progression Scale Visualization */}
      {stage === 2 && (
          <div className="bg-slate-800/50 border-b border-slate-700 px-4 py-3">
          <div className="max-w-4xl mx-auto">
            <p className="text-xs text-slate-400 mb-2">Escala de Progresión al Cambio:</p>
            <div className="flex gap-1 overflow-x-auto pb-2">
              {progressionScale.map((item, idx) => (
                <div key={idx} className="flex-shrink-0 text-center min-w-[100px]">
                  <div className={`text-xs px-2 py-1 rounded mb-1 ${
                    item.probability === 'Alta' ? 'bg-red-500/20 text-red-300' :
                    item.probability === 'Media' ? 'bg-yellow-500/20 text-yellow-300' :
                    'bg-slate-700 text-slate-400'
                  }`}>
                    {item.stage}
                  </div>
                  <div className="text-[10px] text-slate-500">{item.position}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.type === 'report' ? (
                <div className="bg-white rounded-lg p-6 shadow-xl max-w-3xl w-full">
                  <pre className="whitespace-pre-wrap font-sans text-sm text-slate-800 leading-relaxed">{msg.text}</pre>
                  <div className="mt-4 flex gap-2">
                    <button 
                    onClick={() => {
                      navigator.clipboard.writeText(msg.text);
                        alert('¡Informe copiado al portapapeles!');
                      }}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    >
                      📋 Copiar Informe
                    </button>
                    <button 
                      onClick={() => {
                        const blob = new Blob([msg.text], { type: 'text/plain' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `informe-coach-ventas-${new Date().toISOString().split('T')[0]}.txt`;
                        a.click();
                      }}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm"
                    >
                      💾 Descargar Informe
                  </button>
                  </div>
                </div>
              ) : (
                <div className={`flex gap-3 max-w-2xl ${msg.type === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    msg.type === 'user' ? 'bg-blue-600' : 'bg-gradient-to-br from-purple-500 to-pink-500'
                  }`}>
                    {msg.type === 'user' ? <User className="w-5 h-5 text-white" /> : <Bot className="w-5 h-5 text-white" />}
                  </div>
                  <div className={`rounded-2xl px-4 py-3 ${
                    msg.type === 'user' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-slate-700 text-slate-100'
                  }`}>
                    <div className="whitespace-pre-wrap">{msg.text}</div>
                  </div>
                </div>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start gap-3 max-w-2xl">
              <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-purple-500 to-pink-500">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div className="bg-slate-700 rounded-2xl px-4 py-3">
                <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="bg-slate-800 border-t border-slate-700 p-4">
        <div className="max-w-4xl mx-auto flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder="Escribe tu respuesta..."
            disabled={isLoading}
            className="flex-1 bg-slate-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg px-6 py-3 transition-colors flex items-center gap-2"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
            <Send className="w-5 h-5" />
            )}
          </button>
        </div>
        <p className="text-xs text-slate-500 mt-2 text-center max-w-4xl mx-auto">
          Potenciado por IA • Basado en Mastering the Complex Sale de Jeff Thull
        </p>
      </div>
    </div>
  );
};

export default SalesCoachBot;
