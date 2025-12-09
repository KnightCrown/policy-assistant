# PolicyPrompt Mini

A simple AI-powered policy scratchpad for policy analysts, task team leaders, and program managers.

## Overview

PolicyPrompt Mini helps you:
- Ask quick questions about policies, interventions, or program designs
- Get concise AI-generated responses in a chat interface
- Automatically extract and visualize decision support metrics:
  - **Evidence Strength** (0-100): How well-supported the response is by research and data
  - **Implementation Complexity** (0-100): How difficult the proposed intervention would be to implement

## Version 1.0 Features

- ✅ Chat interface with AI policy assistant
- ✅ Automatic metrics computation for each response
- ✅ Visual metrics panel with progress bars and rationales
- ✅ Mobile-first responsive design
- ✅ Basic accessibility features (ARIA labels, keyboard navigation)
- ✅ Error handling and loading states

## Tech Stack

- **Next.js 15** (App Router)
- **TypeScript**
- **React 19**
- **Tailwind CSS**
- **OpenAI API** (GPT-4o-mini)

## Getting Started

First, run the development server:

```bash
npm install
```

3. Create your environment file:
```bash
cp .env.example .env.local
```

4. Add your OpenAI API key to `.env.local`:
```
OPENAI_API_KEY=your-actual-api-key-here
OPENAI_MODEL=gpt-4o-mini
NEXT_PUBLIC_APP_NAME=PolicyPrompt Mini
```

5. Run the development server:
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

npm run dev
# or
yarn dev
# or
pnpm dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

1. Type a policy question in the input field (e.g., "What are effective interventions to reduce maternal mortality?")
2. Press Enter or click Send
3. Wait for the AI assistant to respond
4. View the metrics panel below the chat to see:
   - Evidence Strength score and rationale
   - Implementation Complexity score and rationale

### Example Questions

- "What are best practices for improving primary education outcomes in rural areas?"
- "How can we reduce urban air pollution in developing countries?"
- "What interventions have proven effective for financial inclusion of women?"
- "How should we design a conditional cash transfer program?"

## Project Structure

```
├── app/
│   ├── api/
│   │   └── chat/
│   │       └── route.ts          # OpenAI API integration
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Main chat interface
│   └── globals.css               # Global styles
├── lib/
│   └── metrics.ts                # Metrics computation logic
├── types/
│   └── chat.ts                   # TypeScript type definitions
├── .env.local                    # Environment variables (not in git)
├── .env.example                  # Environment template
└── README.md                     # This file
```

## How Metrics Work

### Evidence Strength (0-100)
Analyzes the AI response for:
- References to studies, research, data, evaluations
- Presence of statistics and numbers
- Citations or references to evidence sources
- Overall depth and specificity

### Implementation Complexity (0-100)
Analyzes the AI response for:
- **Increases complexity**: regulatory changes, multi-stakeholder coordination, infrastructure needs
- **Decreases complexity**: pilot programs, incremental approaches, low-cost interventions
- Institutional and governance requirements

## Security Notes

- The OpenAI API key is stored in `.env.local` and never exposed to the browser
- All API calls are made server-side through Next.js API routes
- `.env.local` is excluded from git via `.gitignore`

## Future Versions

- **v2.0**: Conversation persistence, tagging by country/sector, export functionality
- **v3.0**: Multi-user support, advanced search, conversation history

## Additional Resources

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

