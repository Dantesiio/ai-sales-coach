import React, { useState, useEffect, useRef } from 'react';
import { Send, User, Bot, FileText, DollarSign, TrendingUp } from 'lucide-react';

const SalesCoachBot = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [phase, setPhase] = useState(0);
  const [diagnosticData, setDiagnosticData] = useState({
    clientGoals: '',
    currentChallenges: '',
    problemDuration: '',
    affectedProcesses: '',
    affectedPeople: '',
    previousAttempts: '',
    timeCost: '',
    moneyCost: '',
    futureImpact: '',
    hiddenCosts: '',
    desiredResults: '',
    improvements: ''
  });
  const messagesEndRef = useRef(null);

  const phases = [
    {
      title: "Fase 1: Diagnóstico del Entorno",
      icon: User,
      color: "bg-blue-500",
      questions: [
        "¡Hola! Soy tu AI Diagnostic Coach. Voy a guiarte para diagnosticar el problema de tu cliente y construir un caso de valor sólido.",
        "Empecemos con el diagnóstico del entorno. ¿Qué resultados busca tu cliente y qué métricas usa para medirlos?",
        "Entendido. Ahora, ¿qué desafíos actuales le impiden alcanzar esos resultados?",
        "Interesante. ¿Desde cuándo está ocurriendo este problema?"
      ],
      dataKeys: ['clientGoals', 'currentChallenges', 'problemDuration']
    },
    {
      title: "Fase 2: Profundización Causal",
      icon: TrendingUp,
      color: "bg-purple-500",
      questions: [
        "Perfecto. Ahora profundicemos en las causas raíz del problema.",
        "¿Qué procesos o sistemas están involucrados en este problema?",
        "¿Quiénes en la organización se ven más afectados por esta situación?",
        "¿Qué intentos previos se han hecho para resolverlo? ¿Por qué no funcionaron?"
      ],
      dataKeys: ['affectedProcesses', 'affectedPeople', 'previousAttempts']
    },
    {
      title: "Fase 3: Costo del Problema",
      icon: DollarSign,
      color: "bg-red-500",
      questions: [
        "Excelente información. Ahora cuantifiquemos el impacto financiero.",
        "¿Cuánto representa este problema en términos de tiempo perdido, dinero o pérdida de oportunidades? (Ej: 20 horas/semana, $50,000/mes)",
        "Si este problema persiste, ¿qué impacto tendría en los próximos 12 meses?",
        "¿Qué otros costos ocultos podrían estar asociados? (retrabajo, rotación de personal, reputación, clientes perdidos, etc.)"
      ],
      dataKeys: ['timeCost', 'moneyCost', 'futureImpact', 'hiddenCosts']
    },
    {
      title: "Fase 4: Construcción de Valor",
      icon: FileText,
      color: "bg-green-500",
      questions: [
        "Muy bien. Ahora construyamos el caso de valor.",
        "¿Qué resultados financieros serían más relevantes para tu cliente si se resuelve el problema?",
        "¿Qué indicadores específicos se podrían mejorar y en cuánto? (Ej: reducción de costos en 30%, aumento de productividad en 40%)"
      ],
      dataKeys: ['desiredResults', 'improvements']
    }
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (messages.length === 0) {
      addBotMessage(phases[0].questions[0], 500);
      setTimeout(() => {
        addBotMessage(phases[0].questions[1], 1500);
      }, 1000);
    }
  }, []);

  const addBotMessage = (text, delay = 0) => {
    setTimeout(() => {
      setMessages(prev => [...prev, { type: 'bot', text }]);
    }, delay);
  };

  const calculateROI = () => {
    const monthlyLoss = parseFloat(diagnosticData.moneyCost.replace(/[^0-9.]/g, '')) || 0;
    const annualLoss = monthlyLoss * 12;
    const improvement = parseFloat(diagnosticData.improvements.match(/\d+/)?.[0]) || 50;
    const potentialSavings = annualLoss * (improvement / 100);
    
    return {
      annualLoss: annualLoss.toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }),
      potentialSavings: potentialSavings.toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }),
      improvement
    };
  };

  const generateReport = () => {
    const roi = calculateROI();
    
    const report = `
# 📊 REPORTE DE IMPACTO DE VALOR

## Resumen Ejecutivo
**Cliente:** ${diagnosticData.clientGoals.split('.')[0] || 'Cliente'}
**Duración del problema:** ${diagnosticData.problemDuration}

---

## 🎯 DIAGNÓSTICO DEL PROBLEMA

**Objetivos del Cliente:**
${diagnosticData.clientGoals}

**Desafíos Identificados:**
${diagnosticData.currentChallenges}

**Procesos Afectados:**
${diagnosticData.affectedProcesses}

**Personas/Áreas Impactadas:**
${diagnosticData.affectedPeople}

---

## 💰 COSTO TOTAL DEL PROBLEMA

**Costo Directo:**
- ${diagnosticData.timeCost}
- ${diagnosticData.moneyCost}

**Proyección Anual:** ${roi.annualLoss}

**Costos Ocultos:**
${diagnosticData.hiddenCosts}

**Impacto a 12 meses si no se resuelve:**
${diagnosticData.futureImpact}

---

## ✅ CASO DE VALOR

**Resultados Esperados:**
${diagnosticData.desiredResults}

**Mejoras Cuantificables:**
${diagnosticData.improvements}

**Ahorro Potencial Anual:** ${roi.potentialSavings}
**Retorno Estimado:** ${roi.improvement}% de mejora

---

## 🚀 PRÓXIMOS PASOS

1. Validar estos números con el cliente
2. Identificar stakeholders clave para la decisión
3. Construir timeline de implementación
4. Preparar propuesta de valor personalizada

---

*Generado por AI Diagnostic Coach - Metodología Jeff Thull*
    `;
    
    return report;
  };

  const handleSend = () => {
    if (!input.trim()) return;

    setMessages(prev => [...prev, { type: 'user', text: input }]);
    
    const currentPhase = phases[phase];
    const questionIndex = messages.filter(m => m.type === 'user').length;
    const dataKeyIndex = questionIndex - (phase === 0 ? 0 : phases.slice(0, phase).reduce((sum, p) => sum + p.dataKeys.length, 0));
    
    if (dataKeyIndex < currentPhase.dataKeys.length) {
      setDiagnosticData(prev => ({
        ...prev,
        [currentPhase.dataKeys[dataKeyIndex]]: input
      }));
    }

    const nextQuestionIndex = questionIndex + (phase === 0 ? 1 : phases.slice(0, phase).reduce((sum, p) => sum + p.questions.length, 0));
    const allQuestions = phases.flatMap(p => p.questions);

    if (nextQuestionIndex < allQuestions.length) {
      addBotMessage(allQuestions[nextQuestionIndex], 800);
      
      const totalQuestionsInCurrentPhase = currentPhase.questions.length - 1;
      const currentQuestionInPhase = messages.filter(m => m.type === 'user').length - 
        (phase === 0 ? 0 : phases.slice(0, phase).reduce((sum, p) => sum + (p.questions.length - 1), 0));
      
      if (currentQuestionInPhase >= currentPhase.dataKeys.length && phase < phases.length - 1) {
        setPhase(prev => prev + 1);
      }
    } else {
      addBotMessage("¡Excelente trabajo! Ahora generaré tu Reporte de Impacto de Valor...", 800);
      setTimeout(() => {
        const report = generateReport();
        setMessages(prev => [...prev, { type: 'report', text: report }]);
      }, 2000);
    }

    setInput('');
  };

  const PhaseIcon = phases[phase].icon;

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700 p-4 shadow-lg">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-white mb-2">AI Diagnostic Coach</h1>
          <div className="flex items-center gap-2 text-sm text-slate-300">
            <PhaseIcon className="w-4 h-4" />
            <span>{phases[phase].title}</span>
            <span className="ml-auto bg-slate-700 px-3 py-1 rounded-full">
              Fase {phase + 1} de {phases.length}
            </span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-slate-800 px-4 pb-2">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-1">
            {phases.map((p, idx) => (
              <div 
                key={idx} 
                className={`h-1 flex-1 rounded-full transition-all ${
                  idx < phase ? 'bg-green-500' : 
                  idx === phase ? 'bg-blue-500' : 
                  'bg-slate-700'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.type === 'report' ? (
                <div className="bg-white rounded-lg p-6 shadow-xl max-w-3xl w-full">
                  <pre className="whitespace-pre-wrap font-sans text-sm text-slate-800">{msg.text}</pre>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(msg.text);
                      alert('Reporte copiado al portapapeles');
                    }}
                    className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    📋 Copiar Reporte
                  </button>
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
                    {msg.text}
                  </div>
                </div>
              )}
            </div>
          ))}
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
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Escribe tu respuesta..."
            className="flex-1 bg-slate-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleSend}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-6 py-3 transition-colors flex items-center gap-2"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default SalesCoachBot;