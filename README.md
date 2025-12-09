# Policy Assistant

**Policy Assistant** is an AI-powered scratchpad for policy professionals. Chat to generate structured briefs and instantly visualize Evidence Strength and Implementation Complexity metrics. Features a clean UI, local storage persistence, and automatic source extraction. Built with Next.js, TypeScript, and OpenAI.

![Policy Assistant Logo](/public/ppmLogo2.png)

## Overview

Policy Assistant helps policy analysts, task team leaders, and program managers to:
- Ask quick questions about policies, interventions, or program designs.
- Get concise, structured AI-generated responses suitable for policy notes.
- **Automatically extract and visualize decision support metrics**:
  - **Evidence Strength** (0-100): How well-supported the response is by research and data. Includes a "View Evidence" feature to see source links.
  - **Implementation Complexity** (0-100): How difficult the proposed intervention would be to implement.

## Features (v1.3.0)

- **AI Policy Assistant**: Powered by OpenAI (GPT-5 nano) with a specialized system prompt for policy analysis.
- **Smart Metrics**: Automatic computation of "Evidence Strength" and "Implementation Complexity" based on response heuristics.
- **Source Extraction**: Automatically detects and extracts source URLs from the AI response, accessible via a "View Evidence" button.
- **Conversation History**: Persists your chat history locally in your browser so you can pick up where you left off.
- **Responsive Design**: Mobile-first interface with a collapsible sidebar and mobile-optimized layout.
- **Clean UI**: Polished interface using Tailwind CSS and the Inter font.

## Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **UI Library**: [React 19](https://react.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **AI Integration**: [OpenAI API](https://platform.openai.com/docs/api-reference)

## Getting Started

### Prerequisites

- Node.js 18+ installed
- An OpenAI API Key

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/policy-assistant.git
   cd policy-assistant
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment:**
   Create a `.env.local` file in the root directory and add your OpenAI API key:
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local`:
   ```env
   OPENAI_API_KEY=your_openai_api_key_here
   OPENAI_MODEL=gpt-5-nano
   NEXT_PUBLIC_APP_NAME=Policy Assistant
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```

5. **Open the app:**
   Navigate to [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. **Start a Chat**: Type a policy question in the input field (e.g., "What are effective interventions to reduce maternal mortality?").
2. **Analyze Metrics**: View the "Analysis Metrics" panel below the response.
   - **Evidence Strength**: Check the score and click "View Evidence" to see cited sources.
   - **Implementation Complexity**: Review the score and rationale.
3. **Manage History**: Use the sidebar to switch between conversations or start a new one.

## Project Structure

```
├── app/
│   ├── api/chat/         # API route for OpenAI integration
│   ├── layout.tsx        # Root layout and font configuration
│   ├── page.tsx          # Main application UI and logic
│   └── globals.css       # Global styles and Tailwind directives
├── lib/
│   └── metrics.ts        # Heuristic logic for computing metrics and extracting sources
├── types/
│   └── chat.ts           # TypeScript interfaces
├── public/               # Static assets (logos, icons)
└── ...
```

