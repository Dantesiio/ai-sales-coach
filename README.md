# AI Sales Coach

An intelligent sales coaching bot based on Jeff Thull's **Mastering the Complex Sale** methodology. This application guides sales professionals through a comprehensive implementation plan to improve their sales approach.

## Features

- 🤖 **AI-Powered Conversations**: Uses free AI services (Hugging Face Inference API) with intelligent fallbacks
- 📊 **Four-Stage Diagnostic Process**:
  1. **Analyze Current State**: Identify which era of selling your company operates in
  2. **Analyze Sales Conversations**: Evaluate your current sales approach
  3. **Progression to Change Scale**: Understand where customers are in their buying journey
  4. **Value Leakage Identification**: Map value across Product, Process, and Performance levels
- 📈 **Progression Scale Visualization**: Interactive display of customer progression stages
- 📄 **Comprehensive Report Generation**: Detailed implementation plan report with insights and recommendations
- 💾 **Export Functionality**: Download or copy your implementation plan report

## Technology Stack

- **React 19** - Modern UI framework
- **Tailwind CSS** - Styling
- **Lucide React** - Icons
- **Hugging Face Inference API** - Free AI integration (no API key required)
- **Intelligent Fallbacks** - Rule-based responses when AI is unavailable

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd ai-sales-coach
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Optional: Enhanced AI Providers

The app works out of the box with Hugging Face's free API. For enhanced performance, especially in **Coach Mode**, you can optionally configure additional free AI providers:

1. Create a `.env` file in the root directory:
```bash
# Recommended: Gemini API for Coach Mode (better conversational AI)
REACT_APP_GEMINI_API_KEY=your_gemini_api_key_here

# Optional: Other AI providers
REACT_APP_GROQ_API_KEY=your_groq_api_key_here
REACT_APP_TOGETHER_API_KEY=your_together_api_key_here
```

2. Get free API keys:
   - **Google Gemini** (Recommended for Coach Mode): 
     - Sign up at [Google AI Studio](https://makersuite.google.com/app/apikey)
     - Free tier: 15 requests per minute, 1,500 requests per day
     - Best for natural, conversational responses
   - **Groq**: Sign up at [console.groq.com](https://console.groq.com) - Free tier available
   - **Together.ai**: Sign up at [together.ai](https://together.ai) - Free tier available

3. Gemini is already enabled by default. Just add your API key to `.env`:
```javascript
// In src/services/aiService.js - Gemini is already enabled
gemini: {
  enabled: true, // Already enabled
  apiKey: process.env.REACT_APP_GEMINI_API_KEY || '',
  model: 'gemini-1.5-flash', // Fast and free
  // ...
}
```

**Note**: The Coach Mode will automatically use Gemini if an API key is provided, otherwise it falls back to other AI providers or intelligent rule-based responses.

## How It Works

### Stage 1: Analyze Current State
The bot helps you identify which of the three eras of professional selling your company operates in:
- **Era 1 (1955)**: Persuader - Product-focused, scripted presentations
- **Era 2 (1975)**: Problem Solver - Solution-focused, needs-based
- **Era 3 (2000)**: Diagnostic - Value-focused, collaborative discovery

### Stage 2: Analyze Sales Conversations
Evaluate your current sales conversations to identify characteristics that may need improvement, such as:
- Following set scripts
- Focusing heavily on company/solution
- Customer defensive reactions

### Stage 3: Progression to Change Scale
Understand where your customers are in their buying journey:
- **Satisfied** (Life is Great) - Low probability of change
- **Neutral** (Comfortable) - Low probability
- **Aware** (It Could Happen) - Medium probability
- **Concern** (It is Happening) - Medium probability
- **Critical** (It's Costing $$$) - High probability
- **Crisis** (Decision to Change) - High probability

### Stage 4: Value Leakage Identification
Map your value proposition across three levels:
- **Product Level**: Obvious value (speed, features, maintenance)
- **Process Level**: Impact on organizational processes
- **Performance Level**: Overall company performance metrics

## AI Integration

The app uses multiple free AI providers with intelligent fallbacks:

1. **Hugging Face Inference API** (Primary) - Free, no API key needed
2. **Groq** (Optional) - Very fast, free tier available
3. **Together.ai** (Optional) - Free tier available
4. **Intelligent Fallbacks** - Rule-based responses when APIs are unavailable

The AI provides contextual, stage-aware responses that guide users through the diagnostic process.

## Report Generation

After completing all stages, the app generates a comprehensive implementation plan report including:
- Current state analysis
- Sales conversation evaluation
- Customer progression assessment
- Value leakage identification
- Key insights and recommendations
- Next steps for implementation

Reports can be copied to clipboard or downloaded as text files.

## Best Practices

1. **Be Honest**: The diagnostic process works best with honest, thoughtful responses
2. **Think Deeply**: Consider your actual business situation when answering
3. **Review the Report**: Take time to review and validate the generated report
4. **Share with Team**: Use the report as a starting point for team discussions
5. **Iterate**: The methodology is iterative - revisit as your approach evolves

## Methodology

This application is based on **Jeff Thull's Mastering the Complex Sale** methodology, which helps sales organizations:
- Move from Era 1/2 to Era 3 (Diagnostic) selling
- Understand customer progression to change
- Identify and articulate value at all levels
- Build stronger value propositions
- Close more complex deals successfully

## Development

### Project Structure

```
src/
  ├── App.js              # Main application component
  ├── services/
  │   └── aiService.js    # AI integration service
  ├── index.js            # React entry point
  └── index.css           # Global styles
```

### Available Scripts

- `npm start` - Runs the app in development mode
- `npm build` - Builds the app for production
- `npm test` - Launches the test runner

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is open source and available for educational and commercial use.

## Acknowledgments

- Methodology based on Jeff Thull's "Mastering the Complex Sale"
- AI powered by Hugging Face, Groq, and Together.ai
- Icons by Lucide

---

**Built with ❤️ for sales professionals who want to master complex sales**
