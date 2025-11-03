import React, { useState, useEffect, useRef } from 'react';
import { Send, User, Bot, TrendingUp, Target, MessageCircle, BarChart3, Sparkles, Loader2 } from 'lucide-react';
import { generateAIResponse } from './services/aiService';

const SalesCoachBot = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [stage, setStage] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  
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
      title: "Action 1: Analyze Your Current State",
      icon: BarChart3,
      color: "bg-blue-500",
      description: "Understanding which era of selling your company is in"
    },
    {
      id: 'conversations',
      title: "Action 2: Analyze Your Sales Conversations",
      icon: MessageCircle,
      color: "bg-purple-500",
      description: "Evaluating your current sales approach"
    },
    {
      id: 'progression',
      title: "Action 3: Progression to Change Scale",
      icon: TrendingUp,
      color: "bg-green-500",
      description: "Understanding where your customer is on the change journey"
    },
    {
      id: 'value-leakage',
      title: "Action 4: Identifying Value Leakage",
      icon: Target,
      color: "bg-orange-500",
      description: "Mapping value across Product, Process, and Performance levels"
    }
  ];

  const progressionScale = [
    { stage: 'Satisfied', position: 'Life is Great', probability: 'Low' },
    { stage: 'Neutral', position: 'Comfortable', probability: 'Low' },
    { stage: 'Aware', position: 'It Could Happen', probability: 'Medium' },
    { stage: 'Concern', position: 'It is Happening', probability: 'Medium' },
    { stage: 'Critical', position: "It's Costing $$$", probability: 'High' },
    { stage: 'Crisis', position: 'Decision to Change', probability: 'High' }
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (messages.length === 0) {
      initializeConversation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const initializeConversation = () => {
    const welcomeMessage = "Hello! I'm your AI Sales Coach, based on Jeff Thull's Mastering the Complex Sale methodology. I'll guide you through creating an effective Implementation Plan for your organization.\n\nLet's start by understanding your current sales approach. This will help us identify opportunities for improvement.\n\n**Action 1: Analyze Your Current State**\n\nThink about the three eras of professional selling:\n- **Era 1 (1955)**: Persuader - Product-focused, scripted presentations\n- **Era 2 (1975)**: Problem Solver - Solution-focused, needs-based\n- **Era 3 (2000)**: Diagnostic - Value-focused, collaborative discovery\n\nWhich era do you think your company is currently performing in?";
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
    const aiResponse = await generateAIResponse(userMessage, context, stages[stage]);
    
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
        } else if (diagnosticData.eraIndicators === '') {
          setDiagnosticData(prev => ({ ...prev, eraIndicators: userInput }));
        }
        break;
        
      case 'conversations':
        if (diagnosticData.typicalConversation === '') {
          setDiagnosticData(prev => ({ ...prev, typicalConversation: userInput }));
        } else {
          // Extract characteristics from user input
          const characteristics = [];
          if (userInput.toLowerCase().includes('script')) characteristics.push('Set script');
          if (userInput.toLowerCase().includes('company') || userInput.toLowerCase().includes('solution')) characteristics.push('Focus on company/solution');
          if (userInput.toLowerCase().includes('problem') || userInput.toLowerCase().includes('situation')) characteristics.push('Focus on customer problems');
          if (userInput.toLowerCase().includes('defensive') || userInput.toLowerCase().includes('challenge')) characteristics.push('Customer reactions');
          setDiagnosticData(prev => ({ ...prev, conversationCharacteristics: characteristics }));
        }
        break;
        
      case 'progression':
        if (diagnosticData.customerStatements === '') {
          setDiagnosticData(prev => ({ ...prev, customerStatements: userInput }));
        } else if (diagnosticData.progressionStage === '') {
          setDiagnosticData(prev => ({ ...prev, progressionStage: userInput }));
        } else if (diagnosticData.progressionActions === '') {
          setDiagnosticData(prev => ({ ...prev, progressionActions: userInput }));
        } else if (diagnosticData.productValue === '') {
          setDiagnosticData(prev => ({ ...prev, productValue: userInput }));
        } else if (diagnosticData.processValue === '') {
          setDiagnosticData(prev => ({ ...prev, processValue: userInput }));
        } else if (diagnosticData.performanceValue === '') {
          setDiagnosticData(prev => ({ ...prev, performanceValue: userInput }));
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
            addBotMessage("**Action 2: Analyze Your Sales Conversations**\n\nNow let's look at your sales conversations. Can you describe a typical conversation you would have with a potential customer? Write it out in 1-2 paragraphs.", 2000);
          }, 2000);
        }
        break;
        
      case 'conversations':
        if (diagnosticData.typicalConversation && diagnosticData.conversationCharacteristics.length > 0) {
          setTimeout(() => {
            setStage(2);
            addBotMessage("**Action 3: Evaluating Where Your Customer Is on the Progression to Change Scale**\n\nIt's important to understand where your customer is in their journey. Think of a potential customer you currently have.\n\nWrite down some things this customer said in conversations that indicate where they are in their intent to buy:", 2000);
          }, 2000);
        }
        break;
        
      case 'progression':
        if (diagnosticData.customerStatements && diagnosticData.progressionStage && diagnosticData.productValue && diagnosticData.processValue && diagnosticData.performanceValue) {
          setTimeout(() => {
            setStage(3);
            addBotMessage("**Action 4: Identifying Your Value Leakage**\n\nAs the methodology illustrates, only 10% of value is captured during the sales proposal. Let's map out the value your product or service brings at different levels.\n\nWhat value does your product or service bring on the **product level** itself? (Examples: speed, features, maintenance, etc.)", 2000);
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
    const report = `# 📊 IMPLEMENTATION PLAN REPORT
*Based on Jeff Thull's Mastering the Complex Sale Methodology*

---

## ACTION 1: CURRENT STATE ANALYSIS

### Current Era Assessment
**Era Identified:** ${diagnosticData.currentEra}

**Key Indicators:**
${diagnosticData.eraIndicators}

---

## ACTION 2: SALES CONVERSATIONS ANALYSIS

### Typical Conversation
${diagnosticData.typicalConversation}

### Conversation Characteristics Identified
${diagnosticData.conversationCharacteristics.length > 0 
  ? diagnosticData.conversationCharacteristics.map(c => `- ${c}`).join('\n')
  : 'None specifically identified'}

**Assessment:** ${diagnosticData.conversationCharacteristics.length > 2 
  ? '⚠️ Your conversations may need to shift toward Era 3 (Diagnostic) approach - focus more on collaborative discovery and customer situation analysis.'
  : '✅ Your conversations show characteristics of a more diagnostic approach.'}

---

## ACTION 3: PROGRESSION TO CHANGE SCALE

### Customer Statements
${diagnosticData.customerStatements}

### Identified Stage
**Stage:** ${diagnosticData.progressionStage}

### Actions to Move Customer Forward
${diagnosticData.progressionActions || 'To be developed based on customer stage'}

### Value Identification

**Product Level Value:**
${diagnosticData.productValue}

**Process Level Value:**
${diagnosticData.processValue}

**Performance Level Value:**
${diagnosticData.performanceValue}

---

## ACTION 4: VALUE LEAKAGE IDENTIFICATION

### Product Level Value
${diagnosticData.productLevelValue}

### Process Level Value
${diagnosticData.processLevelValue}

### Performance Level Value
${diagnosticData.performanceLevelValue}

### Expected Revenue Impact
**Expected Additional Revenue:** ${diagnosticData.expectedRevenue}

---

## 🎯 KEY INSIGHTS & RECOMMENDATIONS

1. **Era Transition:** Focus on moving from ${diagnosticData.currentEra} toward Era 3 (Diagnostic) selling approach
2. **Customer Progression:** Customer is at ${diagnosticData.progressionStage} stage - develop strategies to move them forward
3. **Value Articulation:** Ensure you're communicating value at all three levels (Product, Process, Performance)
4. **Conversation Style:** Shift from ${diagnosticData.conversationCharacteristics.length > 2 ? 'scripted/presentational' : 'current'} to collaborative diagnostic conversations

---

## 📋 NEXT STEPS

1. Review and validate this assessment with your team
2. Develop specific action items for each identified area
3. Create customer-specific diagnostic questions based on progression stage
4. Build value propositions that address all three levels of value
5. Practice Era 3 diagnostic conversations with your sales team

---

*Report generated by AI Sales Coach - Mastering the Complex Sale Implementation Plan*
*${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}*`;

    addBotMessage("🎉 **Congratulations!** You've completed the Implementation Plan. Here's your comprehensive report:", 1000);
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
              AI Sales Coach
            </h1>
            <span className="bg-slate-700 px-3 py-1 rounded-full text-sm text-slate-300">
              Action {stage + 1} of {stages.length}
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
            <p className="text-xs text-slate-400 mb-2">Progression to Change Scale:</p>
            <div className="flex gap-1 overflow-x-auto pb-2">
              {progressionScale.map((item, idx) => (
                <div key={idx} className="flex-shrink-0 text-center min-w-[100px]">
                  <div className={`text-xs px-2 py-1 rounded mb-1 ${
                    item.probability === 'High' ? 'bg-red-500/20 text-red-300' :
                    item.probability === 'Medium' ? 'bg-yellow-500/20 text-yellow-300' :
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
                        alert('Report copied to clipboard!');
                      }}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    >
                      📋 Copy Report
                    </button>
                    <button 
                      onClick={() => {
                        const blob = new Blob([msg.text], { type: 'text/plain' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `sales-coach-report-${new Date().toISOString().split('T')[0]}.txt`;
                        a.click();
                      }}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm"
                    >
                      💾 Download Report
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
            placeholder="Type your response..."
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
          Powered by AI • Based on Jeff Thull's Mastering the Complex Sale
        </p>
      </div>
    </div>
  );
};

export default SalesCoachBot;
