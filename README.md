# 🩺 Medical Term Simplifier

An AI-powered web app that turns complex medical reports into plain language a 10-year-old could follow — without losing medical accuracy.

## Problem

Medical reports are full of jargon patients are not equipped to parse: hyperlipidemia, hypertension, BID, PRN, CBC, and dyslipidemia. That gap can lead to confusion, anxiety, and missed doses.

## Solution

Medical Term Simplifier uses AI to rewrite conditions, medicines, lab results, abbreviations, and prescription instructions in everyday language while preserving the original meaning.

## Features

- 📄 Paste report text or upload a PDF, DOCX, or TXT file
- 🤖 AI-powered plain-language rewriting
- 📚 Medical term dictionary
- 💊 Medicine explanations
- 🧪 Lab result explanations
- 📝 Plain-language summary
- ❓ Suggested questions to bring to a doctor
- 📋 Copy results or download as PDF
- 📱 Fully responsive

## Target Users

- Patients
- Parents
- Elderly users
- Caregivers
- Students
- Anyone without a medical background

## How It Works

1. Paste or upload a medical report.
2. Click Simplify.
3. The AI analyzes the report and rewrites it in plain language.
4. You receive:
   - a plain-language explanation
   - term definitions
   - medicine information
   - lab result breakdowns
   - a summary
   - questions to ask your doctor

### Example

Input:

> Patient has hyperlipidemia. Prescribed Atorvastatin 20 mg BID. Follow-up in 4 weeks.

Output:

> Your blood has more cholesterol than normal.
>
> Your doctor has given you Atorvastatin, a medicine that helps lower cholesterol.
>
> BID means take it twice a day.
>
> See your doctor again in 4 weeks so they can check how you are doing.

## Tech Stack

| Layer | Choice |
| --- | --- |
| Frontend | Next.js, React, TypeScript, Tailwind CSS, shadcn/ui |
| Backend | Node.js, Express.js |
| Database | PostgreSQL + Prisma ORM |
| AI | OpenAI GPT API |
| File processing | pdf-parse (PDF), mammoth (DOCX) |
| Auth | Clerk / Auth.js |
| Storage | Supabase Storage |
| Deployment | Vercel (frontend), Railway / Render (backend) |

## Getting Started

```bash
git clone https://github.com/<your-org>/medical-term-simplifier.git
cd medical-term-simplifier
npm install
```

Create a `.env` file:

```env
OPENAI_API_KEY=your_openai_key
DATABASE_URL=your_postgres_connection_string
CLERK_SECRET_KEY=your_clerk_key
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_supabase_key
```

Run migrations and start the dev server:

```bash
npx prisma migrate dev
npm run dev
```

The app runs at http://localhost:3000 by default.

## API Reference

| Method | Endpoint | Description |
| --- | --- | --- |
| POST | /api/upload | Accepts a PDF, DOCX, or TXT file and returns extracted plain text |
| POST | /api/simplify | Accepts report text and returns a simplified explanation |
| GET | /api/reports/:id | Fetches a saved simplified report |
| POST | /api/reports/:id/export | Generates a downloadable PDF of the simplified report |

## Project Structure

```text
medical-term-simplifier/
├── app/           # Next.js app router pages
├── components/    # Shared React components
├── pages/         # Legacy/API routes (if not using app router exclusively)
├── public/        # Static assets
├── styles/        # Global styles
├── lib/           # Shared utilities
├── services/      # File parsing, AI calls, business logic
├── prisma/        # Prisma schema and migrations
├── api/           # Express API routes
├── utils/         # Helper functions
├── types/         # Shared TypeScript types
├── README.md
└── package.json
```

## Security

- HTTPS everywhere
- Input validation on all endpoints
- Files parsed in memory and never persisted unencrypted
- Rate limiting on API routes
- Auth-protected endpoints
- Privacy-first by design — no report data used for model training

## Performance Goals

- Fast response times end to end
- Responsive across desktop, tablet, and mobile
- Optimized, minimal AI requests
- Lightweight UI with no unnecessary re-renders

## Accessibility

- WCAG 2.1 AA target
- Full keyboard navigation
- High-contrast mode support
- Screen-reader compatible

## Disclaimer

This application is for educational purposes only. It does not diagnose conditions, replace a doctor, recommend treatment, or suggest medication changes. Always consult a qualified healthcare professional.

## Roadmap

- [ ] Multi-language support
- [ ] Voice explanations
- [ ] OCR for scanned reports
- [ ] Image upload support
- [ ] Patient history dashboard
- [ ] Doctor portal
- [ ] Medication reminders
- [ ] AI chatbot for follow-up questions

## Contributing

This project started as a hackathon idea. Issues and pull requests are welcome. Please open an issue before submitting large changes so the scope can be aligned.

## License

This project is licensed under the MIT License.
