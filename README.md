
![demo](https://github.com/royceanton/eifi1_lbt4/blob/main/assets/ranton-reportgen-3.gif)

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
cd web
# then
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Configuring Google LLM API Key

To use the Google LLM API, you need to obtain an API key. Follow these steps:

1. Visit [Google AI Studio](https://aistudio.google.com/u/4/apikey) to get your API key.
2. Create a new project or select an existing project.
3. Enable the Google LLM API for your project.
4. Generate an API key and copy it.

Once you have your API key, create a `.env.local` file in the root of your project and add the following line:

```env
GOOGLE_API_KEY=your_api_key_here
```

Replace `your_api_key_here` with the API key you copied.
