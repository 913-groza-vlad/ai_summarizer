import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: "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",
});

const completion = openai.chat.completions.create({
  model: "gpt-4o-mini",
  store: true,
  messages: [
    {"role": "user", "content": "write a haiku about ai"},
  ],
});

completion.then((result) => console.log(result.choices[0].message));