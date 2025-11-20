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
    const welcomeMessage = "¡Hola! 👋 Soy tu Coach de Ventas. Te ayudo a mejorar tu estrategia paso a paso.\n\nEmpecemos: ¿cómo describirías tu forma actual de vender?\n\nPor ejemplo:\n• ¿Sigues un guión o prefieres conversaciones libres?\n• ¿Te enfocas en el producto o en las necesidades del cliente?";
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
            addBotMessage("Perfecto. 👍\n\nAhora hablemos de tus conversaciones. Cuando un cliente te contacta, ¿cómo suele ir? ¿Qué dices primero?", 2000);
          }, 2000);
        }
        break;
        
      case 'conversations':
        if (diagnosticData.typicalConversation && diagnosticData.conversationCharacteristics.length > 0) {
          setTimeout(() => {
            setStage(2);
            addBotMessage("Genial. 👌\n\nAhora pensemos en un cliente específico. ¿Tienes algún cliente potencial ahora? ¿Qué te ha dicho? ¿Qué palabras usa?", 2000);
          }, 2000);
        }
        break;
        
      case 'progression':
        if (diagnosticData.customerStatements && diagnosticData.progressionStage && diagnosticData.productValue && diagnosticData.processValue && diagnosticData.performanceValue) {
          setTimeout(() => {
            // Copy values from stage 3 to stage 4 to avoid asking again
            setDiagnosticData(prev => ({
              ...prev,
              productLevelValue: prev.productValue,
              processLevelValue: prev.processValue,
              performanceLevelValue: prev.performanceValue
            }));
            setStage(3);
            
            // Show the values being used
            const summaryMessage = `Excelente. 🎯\n\nVoy a usar las respuestas que ya me diste sobre el valor:\n\n• **Valor del Producto:** ${diagnosticData.productValue}\n• **Valor del Proceso:** ${diagnosticData.processValue}\n• **Valor del Rendimiento:** ${diagnosticData.performanceValue}\n\nÚltima pregunta: si todo esto funciona bien, ¿cuánto dinero adicional crees que podrías generar? Menos de $50k, entre $50k y $100k, más de $100k?`;
            addBotMessage(summaryMessage, 2000);
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

  // Función de análisis inteligente
  const analyzeEra = () => {
    const eraLower = (diagnosticData.currentEra || '').toLowerCase();
    const indicatorsLower = (diagnosticData.eraIndicators || '').toLowerCase();
    const combined = eraLower + ' ' + indicatorsLower;
    
    if (combined.includes('guión') || combined.includes('guion') || combined.includes('script') || combined.includes('present')) {
      return {
        era: 'Era 1 (Persuasor)',
        score: 1,
        strengths: ['Consistencia en el mensaje', 'Estructura clara'],
        weaknesses: ['Falta de personalización', 'Poca adaptación al cliente'],
        transition: 'Necesitas avanzar hacia Era 2 y 3'
      };
    }
    if (combined.includes('necesidad') || combined.includes('problema') || combined.includes('cliente') || combined.includes('pregunta')) {
      return {
        era: 'Era 2 (Solucionador de Problemas)',
        score: 2,
        strengths: ['Enfoque en necesidades', 'Escucha activa'],
        weaknesses: ['Puede limitarse a soluciones obvias', 'Falta análisis profundo del negocio'],
        transition: 'Estás en buen camino, avanza hacia Era 3'
      };
    }
    if (combined.includes('diagnóstico') || combined.includes('negocio') || combined.includes('análisis') || combined.includes('colabor')) {
      return {
        era: 'Era 3 (Diagnóstico)',
        score: 3,
        strengths: ['Análisis profundo', 'Co-creación con el cliente'],
        weaknesses: ['Requiere más tiempo', 'Necesita habilidades avanzadas'],
        transition: 'Excelente, mantén y profundiza este enfoque'
      };
    }
    return {
      era: 'Era Mixta o en Transición',
      score: 1.5,
      strengths: ['Flexibilidad'],
      weaknesses: ['Falta de enfoque claro'],
      transition: 'Define y consolida tu enfoque hacia Era 3'
    };
  };

  const analyzeConversation = () => {
    const convLower = (diagnosticData.typicalConversation || '').toLowerCase();
    const charLower = diagnosticData.conversationCharacteristics.map(c => c.toLowerCase()).join(' ');
    const combined = convLower + ' ' + charLower;
    
    const hasDiagnostic = combined.includes('pregunta') || combined.includes('problema') || combined.includes('situación');
    const hasPresentation = combined.includes('present') || combined.includes('muestr') || combined.includes('explic');
    const hasScript = combined.includes('guión') || combined.includes('guion') || combined.includes('script');
    
    let score = 0;
    let recommendations = [];
    
    if (hasDiagnostic) {
      score += 2;
      recommendations.push('✅ Estás haciendo preguntas diagnósticas - excelente');
    } else {
      recommendations.push('⚠️ Agrega más preguntas de descubrimiento sobre la situación del cliente');
    }
    
    if (hasPresentation && !hasDiagnostic) {
      score -= 1;
      recommendations.push('⚠️ Evita presentar antes de entender completamente el problema');
    }
    
    if (hasScript) {
      score -= 1;
      recommendations.push('⚠️ Los guiones rígidos limitan la adaptación al cliente');
    }
    
    return {
      score: Math.max(0, Math.min(3, score)),
      recommendations,
      needsImprovement: score < 2
    };
  };

  const analyzeProgressionStage = () => {
    const stageLower = (diagnosticData.progressionStage || '').toLowerCase();
    const statementsLower = (diagnosticData.customerStatements || '').toLowerCase();
    const combined = stageLower + ' ' + statementsLower;
    
    let stage = 'No identificada';
    let urgency = 'Baja';
    let probability = 'Baja';
    let strategies = [];
    
    if (combined.includes('crisis') || combined.includes('urgent') || combined.includes('urgente') || combined.includes('decidir')) {
      stage = 'Crisis';
      urgency = 'Muy Alta';
      probability = 'Muy Alta';
      strategies = [
        'Facilita la decisión con casos de éxito similares',
        'Proporciona garantías y reducción de riesgo',
        'Crea urgencia positiva mostrando el costo de esperar',
        'Simplifica el proceso de decisión'
      ];
    } else if (combined.includes('crítico') || combined.includes('costando') || combined.includes('perdiendo')) {
      stage = 'Crítico';
      urgency = 'Alta';
      probability = 'Alta';
      strategies = [
        'Cuantifica el costo actual del problema',
        'Muestra el ROI de la solución',
        'Proporciona evidencia de resultados similares',
        'Facilita la visualización del estado futuro'
      ];
    } else if (combined.includes('preocupación') || combined.includes('está sucediendo')) {
      stage = 'Preocupación';
      urgency = 'Media';
      probability = 'Media';
      strategies = [
        'Amplifica la conciencia del problema',
        'Muestra cómo otros han resuelto situaciones similares',
        'Conecta el problema con impactos de negocio',
        'Crea sentido de urgencia educativa'
      ];
    } else if (combined.includes('consciente') || combined.includes('podría')) {
      stage = 'Consciente';
      urgency = 'Media-Baja';
      probability = 'Media';
      strategies = [
        'Educa sobre las consecuencias de no actuar',
        'Comparte insights de la industria',
        'Ayuda a visualizar el estado ideal',
        'Construye confianza y credibilidad'
      ];
    } else if (combined.includes('neutral') || combined.includes('cómodo')) {
      stage = 'Neutral';
      urgency = 'Baja';
      probability = 'Baja';
      strategies = [
        'Despierta conciencia sobre oportunidades perdidas',
        'Comparte tendencias del mercado',
        'Muestra casos de transformación',
        'Construye relación a largo plazo'
      ];
    } else {
      stage = 'Satisfecho';
      urgency = 'Muy Baja';
      probability = 'Muy Baja';
      strategies = [
        'Mantén relación sin presión',
        'Comparte contenido educativo',
        'Espera señales de cambio',
        'Construye confianza para el futuro'
      ];
    }
    
    return { stage, urgency, probability, strategies };
  };

  const analyzeValueArticulation = () => {
    const product = (diagnosticData.productLevelValue || diagnosticData.productValue || '').toLowerCase();
    const process = (diagnosticData.processLevelValue || diagnosticData.processValue || '').toLowerCase();
    const performance = (diagnosticData.performanceLevelValue || diagnosticData.performanceValue || '').toLowerCase();
    
    let score = 0;
    let gaps = [];
    let recommendations = [];
    
    // Analizar nivel de producto
    if (product.length > 10) {
      score += 1;
      if (product.includes('rápido') || product.includes('rapido') || product.includes('confiable') || product.includes('fácil') || product.includes('facil')) {
        recommendations.push('✅ Tienes claridad en el valor del producto');
      }
    } else {
      gaps.push('Nivel de Producto');
      recommendations.push('⚠️ Desarrolla más el valor específico del producto');
    }
    
    // Analizar nivel de proceso
    if (process.length > 10) {
      score += 1;
      if (process.includes('tiempo') || process.includes('error') || process.includes('proceso') || process.includes('eficien')) {
        recommendations.push('✅ Entiendes el impacto en procesos');
      }
    } else {
      gaps.push('Nivel de Proceso');
      recommendations.push('⚠️ Profundiza en cómo tu solución mejora los procesos del cliente');
    }
    
    // Analizar nivel de rendimiento
    if (performance.length > 10) {
      score += 1;
      if (performance.includes('ingreso') || performance.includes('costo') || performance.includes('ganancia') || performance.includes('ahorro')) {
        recommendations.push('✅ Conectas con métricas de negocio');
      }
    } else {
      gaps.push('Nivel de Rendimiento');
      recommendations.push('⚠️ Articula mejor el impacto en resultados de negocio');
    }
    
    return {
      score,
      gaps,
      recommendations,
      isComplete: score === 3
    };
  };

  const generateFinalReport = () => {
    const eraAnalysis = analyzeEra();
    const convAnalysis = analyzeConversation();
    const progressionAnalysis = analyzeProgressionStage();
    const valueAnalysis = analyzeValueArticulation();
    
    // Build report sections
    const dateStr = new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
    const generalScore = ((eraAnalysis.score / 3) * 0.4 + (convAnalysis.score / 3) * 0.3 + (valueAnalysis.score / 3) * 0.3) * 100;
    const statusEmoji = eraAnalysis.score >= 2.5 ? '🟢 Avanzado' : eraAnalysis.score >= 1.5 ? '🟡 En Desarrollo' : '🔴 Inicial';
    
    let report = `# 📊 INFORME COMPLETO DEL PLAN DE IMPLEMENTACIÓN
*Basado en la Metodología Mastering the Complex Sale de Jeff Thull*

---

## 📈 RESUMEN EJECUTIVO

**Fecha de Análisis:** ${dateStr}

**Estado General:** ${statusEmoji}

**Puntuación General:** ${generalScore.toFixed(0)}/100

---

## ACCIÓN 1: ANÁLISIS DEL ESTADO ACTUAL

### Evaluación de la Era Actual
**Era Identificada:** ${eraAnalysis.era}
**Era Descrita:** ${diagnosticData.currentEra}

**Indicadores Clave:**
${diagnosticData.eraIndicators}

### Análisis Detallado

**Fortalezas Identificadas:**
${eraAnalysis.strengths.map(s => `- ${s}`).join('\n')}

**Áreas de Mejora:**
${eraAnalysis.weaknesses.map(w => `- ${w}`).join('\n')}

**Recomendación de Transición:**
${eraAnalysis.transition}

### Estrategia de Evolución

${(() => {
  if (eraAnalysis.score < 2) {
    return `**Plan de Acción Inmediato:**
1. Comienza a hacer preguntas de descubrimiento antes de presentar soluciones
2. Enfócate en entender el negocio del cliente, no solo sus necesidades inmediatas
3. Practica escuchar activamente y reformular lo que entiendes
4. Desarrolla habilidades de análisis de situación`;
  } else if (eraAnalysis.score < 3) {
    return `**Plan de Acción de Mejora:**
1. Profundiza en el análisis del modelo de negocio del cliente
2. Desarrolla habilidades de cuantificación de impacto
3. Practica la co-creación de soluciones con el cliente
4. Construye casos de estudio que muestren transformación de negocio`;
  } else {
    return `**Plan de Acción de Optimización:**
1. Refina tus técnicas de diagnóstico con métricas más precisas
2. Desarrolla herramientas de visualización de impacto
3. Crea procesos de seguimiento post-venta que validen el valor entregado
4. Comparte conocimiento con tu equipo para escalar el enfoque`;
  }
})()}

---

## ACCIÓN 2: ANÁLISIS DE CONVERSACIONES DE VENTAS

### Conversación Típica
${diagnosticData.typicalConversation}

### Características de Conversación Identificadas
${diagnosticData.conversationCharacteristics.length > 0 
  ? diagnosticData.conversationCharacteristics.map(c => `- ${c}`).join('\n')
  : 'Ninguna específicamente identificada'}

### Análisis de Calidad de Conversación

**Puntuación:** ${convAnalysis.score}/3

**Evaluación Detallada:**
${convAnalysis.recommendations.map(r => r).join('\n')}

${(() => {
  if (convAnalysis.needsImprovement) {
    return `### Mejoras Recomendadas para Conversaciones

**Estructura de Conversación Diagnóstica:**
1. **Apertura (Contexto):** Establece el propósito y crea confianza
   - "Me gustaría entender mejor tu situación actual..."
   - "¿Podrías contarme sobre..."

2. **Descubrimiento (Situación):** Explora la realidad del cliente
   - "¿Qué está pasando actualmente con...?"
   - "¿Cómo manejas actualmente...?"
   - "¿Qué desafíos has identificado?"

3. **Implicación (Impacto):** Conecta problemas con consecuencias
   - "¿Qué ocurre si esto continúa así?"
   - "¿Cuánto te está costando esto actualmente?"
   - "¿Cómo afecta esto a otros aspectos del negocio?"

4. **Visualización (Futuro):** Ayuda a ver el estado ideal
   - "¿Cómo sería si pudieras...?"
   - "¿Qué cambiaría si...?"
   - "¿Qué impacto tendría si...?"

5. **Acuerdo (Siguiente Paso):** Cierra con acción clara
   - "Basándome en lo que me has contado, creo que podríamos..."
   - "¿Te parece bien si...?"`;
  } else {
    return `### Fortalezas de tus Conversaciones

Tus conversaciones muestran buenas prácticas diagnósticas. Continúa:
- Manteniendo el enfoque en descubrimiento
- Haciendo preguntas abiertas
- Escuchando activamente antes de proponer`;
  }
})()}

---

## ACCIÓN 3: ESCALA DE PROGRESIÓN AL CAMBIO

### Declaraciones del Cliente
${diagnosticData.customerStatements}

### Etapa Identificada
**Etapa:** ${progressionAnalysis.stage}
**Urgencia:** ${progressionAnalysis.urgency}
**Probabilidad de Compra:** ${progressionAnalysis.probability}

### Análisis de la Etapa

${(() => {
  if (progressionAnalysis.stage === 'Crisis' || progressionAnalysis.stage === 'Crítico') {
    return `**🎯 Cliente en Etapa Avanzada - Alta Probabilidad**

Este cliente está en una posición donde el cambio es necesario o inminente. Tu enfoque debe ser:
- Facilitar la decisión, no crear urgencia artificial
- Reducir el riesgo percibido
- Simplificar el proceso
- Proporcionar evidencia clara de resultados`;
  } else if (progressionAnalysis.stage === 'Preocupación' || progressionAnalysis.stage === 'Consciente') {
    return `**🎯 Cliente en Etapa Media - Oportunidad de Desarrollo**

Este cliente tiene conciencia del problema pero necesita ayuda para avanzar. Tu enfoque debe ser:
- Amplificar la conciencia del costo de no cambiar
- Educar sobre las consecuencias
- Construir confianza en la solución
- Mostrar casos similares exitosos`;
  } else {
    return `**🎯 Cliente en Etapa Temprana - Construcción de Relación**

Este cliente aún no tiene urgencia clara. Tu enfoque debe ser:
- Construir relación a largo plazo
- Educar sin vender
- Compartir insights valiosos
- Esperar señales de cambio`;
  }
})()}

### Estrategias Específicas para Avanzar al Cliente

${progressionAnalysis.strategies.map((s, i) => `${i + 1}. ${s}`).join('\n')}

### Acciones Recomendadas para este Cliente

${diagnosticData.progressionActions || 'Desarrolla acciones específicas basadas en las estrategias anteriores'}

### Preguntas Diagnósticas Sugeridas

${(() => {
  if (progressionAnalysis.stage === 'Crisis' || progressionAnalysis.stage === 'Crítico') {
    return `- "¿Qué pasaría si no tomas una decisión en los próximos [tiempo]?"
- "¿Cuál es el costo de esperar un mes más?"
- "¿Qué necesitas ver para sentirte confiado en tomar esta decisión?"
- "¿Quién más necesita estar involucrado en esta decisión?"`;
  } else if (progressionAnalysis.stage === 'Preocupación' || progressionAnalysis.stage === 'Consciente') {
    return `- "¿Qué tan grande es este problema para tu negocio?"
- "¿Cómo afecta esto a otros departamentos/áreas?"
- "¿Qué ha intentado hacer antes para resolver esto?"
- "¿Qué pasaría si esto empeora?"`;
  } else {
    return `- "¿Has notado algún cambio en [área relacionada]?"
- "¿Cómo manejas actualmente [situación relacionada]?"
- "¿Qué te gustaría mejorar en [área relacionada]?"
- "¿Has considerado cómo [tendencia/tecnología] podría afectar tu negocio?"`;
  }
})()}

### Identificación de Valor

**Valor a Nivel de Producto:**
${diagnosticData.productValue}

**Valor a Nivel de Proceso:**
${diagnosticData.processValue}

**Valor a Nivel de Rendimiento:**
${diagnosticData.performanceValue}

---

## ACCIÓN 4: IDENTIFICACIÓN DE FUGA DE VALOR

### Mapa de Valor Completo

**Valor a Nivel de Producto:**
${diagnosticData.productLevelValue || diagnosticData.productValue}

**Valor a Nivel de Proceso:**
${diagnosticData.processLevelValue || diagnosticData.processValue}

**Valor a Nivel de Rendimiento:**
${diagnosticData.performanceLevelValue || diagnosticData.performanceValue}

### Impacto de Ingresos Esperado
**Ingresos Adicionales Esperados:** ${diagnosticData.expectedRevenue}

### Análisis de Articulación de Valor

**Puntuación:** ${valueAnalysis.score}/3

${(() => {
  if (valueAnalysis.isComplete) {
    return `✅ **Excelente:** Tienes claridad en los tres niveles de valor. Esto te permite:
- Comunicar valor completo al cliente
- Justificar precios premium
- Reducir objeciones basadas en precio
- Crear propuestas más convincentes`;
  } else {
    const gapsList = valueAnalysis.gaps.map(g => `- ${g}`).join('\n');
    return `⚠️ **Oportunidad de Mejora:** Tienes ${valueAnalysis.score} de 3 niveles claramente articulados.

**Niveles que necesitas desarrollar:**
${gapsList}`;
  }
})()}

**Recomendaciones Específicas:**
${valueAnalysis.recommendations.map(r => r).join('\n')}

### Propuesta de Valor Integrada

**Cómo comunicar el valor completo:**

1. **Nivel de Producto** → "Nuestro producto es ${diagnosticData.productLevelValue || diagnosticData.productValue}"

2. **Nivel de Proceso** → "Esto significa que cuando lo usas, ${diagnosticData.processLevelValue || diagnosticData.processValue}"

3. **Nivel de Rendimiento** → "Lo cual resulta en ${diagnosticData.performanceLevelValue || diagnosticData.performanceValue}"

**Ejemplo de Propuesta Integrada:**
"Nuestro producto es ${diagnosticData.productLevelValue || diagnosticData.productValue}. Cuando lo implementas, ${diagnosticData.processLevelValue || diagnosticData.processValue}. Esto se traduce en ${diagnosticData.performanceLevelValue || diagnosticData.performanceValue}, lo que representa un impacto estimado de ${diagnosticData.expectedRevenue} en tu negocio."

---

## 🎯 ANÁLISIS ESTRATÉGICO COMPLETO

### Fortalezas Clave Identificadas

${[
  eraAnalysis.score >= 2 ? `- Enfoque avanzado hacia Era 3 (Diagnóstico)` : null,
  convAnalysis.score >= 2 ? `- Buenas prácticas en conversaciones diagnósticas` : null,
  valueAnalysis.isComplete ? `- Articulación completa de valor en tres niveles` : null,
  progressionAnalysis.probability === 'Alta' || progressionAnalysis.probability === 'Muy Alta' ? `- Cliente en etapa avanzada con alta probabilidad de compra` : null
].filter(Boolean).map(s => s).join('\n') || '- Estás en proceso de desarrollo de tus habilidades'}

### Áreas Críticas de Mejora

${[
  eraAnalysis.score < 2 ? `- Transición hacia Era 3 (Diagnóstico) - Prioridad Alta` : null,
  convAnalysis.needsImprovement ? `- Mejora de estructura de conversaciones diagnósticas - Prioridad Alta` : null,
  !valueAnalysis.isComplete ? `- Completar articulación de valor en los tres niveles - Prioridad Media` : null,
  progressionAnalysis.probability === 'Baja' || progressionAnalysis.probability === 'Muy Baja' ? `- Desarrollo de estrategias para avanzar clientes en etapas tempranas - Prioridad Media` : null
].filter(Boolean).map(s => s).join('\n') || '- Continúa desarrollando y refinando tus habilidades'}

### Oportunidades de Alto Impacto

1. **Comunicación de Valor:** ${valueAnalysis.isComplete ? 'Tienes una base sólida. Enfócate en personalizar la propuesta para cada cliente.' : 'Completa la articulación de los tres niveles de valor para aumentar significativamente tu capacidad de justificar precios y cerrar ventas.'}

2. **Estrategia de Progresión:** ${progressionAnalysis.probability === 'Alta' || progressionAnalysis.probability === 'Muy Alta' ? 'Cliente listo para avanzar. Enfócate en facilitar la decisión y reducir riesgo percibido.' : 'Desarrolla estrategias específicas para avanzar clientes desde etapas tempranas hacia decisión.'}

3. **Evolución de Enfoque:** ${eraAnalysis.score >= 2 ? 'Mantén y profundiza tu enfoque diagnóstico. Desarrolla métricas y casos de estudio.' : 'Prioriza la transición hacia Era 3. Esto transformará tu efectividad en ventas complejas.'}

---

## 📋 PLAN DE ACCIÓN PRIORIZADO

### Acciones Inmediatas (Próximas 2 Semanas)

1. **Desarrollar Preguntas Diagnósticas Específicas**
   - Crea un banco de 10-15 preguntas para cada etapa de progresión
   - Practica hacer preguntas de descubrimiento e implicación
   - Documenta las respuestas y ajusta tu enfoque

2. **Completar Articulación de Valor**
   ${(() => {
     if (!valueAnalysis.isComplete) {
       return `   - Desarrolla el valor en los niveles faltantes: ${valueAnalysis.gaps.join(', ')}
   - Crea ejemplos concretos y cuantificables
   - Practica comunicar el valor en los tres niveles`;
     } else {
       return `   - Personaliza la propuesta de valor para cada cliente
   - Desarrolla casos de estudio que demuestren el valor`;
     }
   })()}

3. **Estrategia para Cliente Actual**
   - Implementa las estrategias específicas para etapa ${progressionAnalysis.stage}
   - Prepara las preguntas diagnósticas sugeridas
   - Desarrolla un plan de seguimiento

### Acciones a Mediano Plazo (Próximo Mes)

1. **Transición hacia Era 3**
   ${(() => {
     if (eraAnalysis.score < 2) {
       return `   - Capacítate en técnicas de diagnóstico de negocio
   - Desarrolla habilidades de cuantificación de impacto
   - Practica co-creación de soluciones con clientes`;
     } else {
       return `   - Refina tus técnicas de diagnóstico
   - Desarrolla herramientas de visualización de impacto
   - Comparte conocimiento con tu equipo`;
     }
   })()}

2. **Optimización de Conversaciones**
   - Graba y analiza tus conversaciones (con permiso)
   - Identifica patrones y áreas de mejora
   - Practica la estructura de conversación diagnóstica

3. **Construcción de Casos de Estudio**
   - Documenta resultados de clientes exitosos
   - Cuantifica el impacto entregado
   - Crea materiales que muestren transformación de negocio

### Acciones a Largo Plazo (Próximos 3 Meses)

1. **Desarrollo de Habilidades Avanzadas**
   - Certificación en metodologías de ventas consultivas
   - Desarrollo de habilidades de facilitación de decisiones
   - Construcción de expertise en tu industria

2. **Escalamiento del Enfoque**
   - Comparte metodología con tu equipo
   - Crea procesos y herramientas reutilizables
   - Desarrolla métricas de efectividad

3. **Optimización Continua**
   - Revisa y ajusta tu enfoque mensualmente
   - Solicita feedback de clientes
   - Mide resultados y ajusta estrategias

---

## 🔍 MÉTRICAS DE SEGUIMIENTO SUGERIDAS

### KPIs Recomendados

1. **Efectividad de Conversaciones**
   - Tasa de conversión de primera llamada a siguiente paso
   - Tiempo promedio en cada etapa de progresión
   - Calidad de información recopilada

2. **Articulación de Valor**
   - Tasa de aceptación de propuestas
   - Reducción de objeciones basadas en precio
   - Tiempo promedio de ciclo de venta

3. **Progresión de Clientes**
   - Porcentaje de clientes que avanzan de etapa
   - Tiempo promedio en cada etapa
   - Tasa de cierre por etapa

4. **Evolución de Enfoque**
   - Porcentaje de conversaciones con enfoque diagnóstico
   - Feedback de clientes sobre el proceso
   - Resultados de negocio (ingresos, margen, satisfacción)

---

## 💡 RECOMENDACIONES ESPECÍFICAS POR ÁREA

### Para Mejorar Conversaciones

${(() => {
  if (convAnalysis.needsImprovement) {
    return `1. **Estructura tus conversaciones:**
   - Siempre comienza con contexto y propósito
   - Dedica 60% del tiempo a descubrimiento
   - Usa preguntas abiertas (qué, cómo, por qué)
   - Reformula lo que escuchas para validar entendimiento

2. **Desarrolla tu banco de preguntas:**
   - Preguntas de descubrimiento: "¿Qué está pasando actualmente con...?"
   - Preguntas de implicación: "¿Qué ocurre si esto continúa?"
   - Preguntas de visualización: "¿Cómo sería si pudieras...?"

3. **Practica la escucha activa:**
   - Toma notas durante la conversación
   - Haz pausas antes de responder
   - Pide clarificación cuando no entiendas
   - Resume lo que escuchaste antes de proponer`;
  } else {
    return `1. **Optimiza tus conversaciones existentes:**
   - Mide el tiempo en cada fase
   - Identifica oportunidades de profundizar
   - Desarrolla preguntas más específicas por industria

2. **Comparte tu conocimiento:**
   - Capacita a otros en tu equipo
   - Documenta mejores prácticas
   - Crea recursos reutilizables`;
  }
})()}

### Para Comunicar Valor Efectivamente

${(() => {
  if (!valueAnalysis.isComplete) {
    const gapsDetails = valueAnalysis.gaps.map(gap => {
      if (gap === 'Nivel de Producto') return `   - **Producto:** Identifica características específicas, beneficios tangibles, ventajas competitivas`;
      if (gap === 'Nivel de Proceso') return `   - **Proceso:** Define cómo mejora flujos de trabajo, reduce tiempos, elimina errores`;
      if (gap === 'Nivel de Rendimiento') return `   - **Rendimiento:** Cuantifica impacto en ingresos, costos, satisfacción, cuota de mercado`;
      return '';
    }).filter(Boolean).join('\n');
    
    return `1. **Completa los niveles faltantes:**
${gapsDetails}

2. **Cuantifica cuando sea posible:**
   - Usa números específicos, no generalidades
   - Conecta características con resultados
   - Muestra cálculos de ROI

3. **Personaliza para cada cliente:**
   - Adapta el mensaje según la industria
   - Enfócate en lo que más importa al cliente
   - Usa su lenguaje y métricas`;
  } else {
    return `1. **Personaliza y profundiza:**
   - Adapta la propuesta de valor para cada cliente
   - Desarrolla casos de estudio específicos por industria
   - Crea visualizaciones del impacto

2. **Optimiza la comunicación:**
   - Practica diferentes formas de presentar el valor
   - Desarrolla materiales de apoyo
   - Mide qué mensajes resuenan más`;
  }
})()}

### Para Avanzar Clientes en la Escala de Progresión

${(() => {
  if (progressionAnalysis.probability === 'Alta' || progressionAnalysis.probability === 'Muy Alta') {
    return `**Cliente en Etapa Avanzada - Enfócate en:**

1. **Facilitar la decisión:**
   - Simplifica el proceso de compra
   - Proporciona garantías y reducción de riesgo
   - Crea urgencia positiva (costo de esperar)

2. **Construir confianza:**
   - Comparte casos de éxito similares
   - Proporciona referencias
   - Ofrece pruebas o pilotos si es apropiado

3. **Involucrar stakeholders:**
   - Identifica todos los decisores
   - Aborda preocupaciones de cada uno
   - Facilita reuniones con el equipo`;
  } else {
    return `**Cliente en Etapa Temprana - Enfócate en:**

1. **Despertar conciencia:**
   - Educa sobre tendencias del mercado
   - Comparte insights de la industria
   - Muestra casos de transformación

2. **Construir relación:**
   - Proporciona valor sin vender
   - Mantén contacto regular
   - Comparte contenido relevante

3. **Esperar señales:**
   - Identifica triggers de cambio
   - Establece puntos de contacto regulares
   - Sé paciente pero presente`;
  }
})()}

---

## 🎓 RECURSOS Y PRÓXIMOS PASOS

### Recursos Recomendados

1. **Libros:**
   - "Mastering the Complex Sale" - Jeff Thull
   - "The Challenger Sale" - Matthew Dixon
   - "SPIN Selling" - Neil Rackham

2. **Habilidades a Desarrollar:**
   - Análisis de negocio del cliente
   - Cuantificación de impacto financiero
   - Facilitación de decisiones complejas
   - Comunicación de valor

3. **Práctica:**
   - Graba y revisa tus conversaciones
   - Practica con colegas
   - Solicita feedback de mentores
   - Únete a comunidades de ventas consultivas

### Siguiente Revisión Recomendada

**Fecha sugerida:** ${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}

**Preparación:**
- Documenta resultados de implementación
- Mide métricas de seguimiento
- Identifica nuevas áreas de mejora
- Trae casos específicos para análisis

---

*Informe generado por Coach de Ventas con IA - Plan de Implementación Mastering the Complex Sale*
*Análisis basado en metodología de Jeff Thull y mejores prácticas de ventas consultivas*
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
