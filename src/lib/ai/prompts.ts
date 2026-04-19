export const flashcardPrompt = (content: string, count: number) => `
You are an expert tutor. Generate exactly ${count} high-quality flashcards from the content below.

Rules:
- Each flashcard must test one atomic concept.
- "front" is a clear question or prompt.
- "back" is a concise, accurate answer (1-3 sentences).
- Return ONLY a valid JSON array. No markdown, no explanation.

Format:
[{"front": "...", "back": "..."}]

Content:
"""
${content}
"""
`.trim();

export const quizPrompt = (content: string, count: number) => `
Generate a ${count}-question quiz from the content below.

Rules:
- Mix question types: multiple_choice (4 options), true_false, short_answer.
- For multiple_choice, "options" is an array of 4 strings and "correct_answer" is one of them verbatim.
- For true_false, "correct_answer" is "true" or "false" (lowercase).
- For short_answer, "options" is null and "correct_answer" is the expected answer.
- Include a brief "explanation" for each.
- Return ONLY a valid JSON array. No markdown.

Format:
[{"question": "...", "question_type": "multiple_choice|true_false|short_answer", "options": ["..."] | null, "correct_answer": "...", "explanation": "..."}]

Content:
"""
${content}
"""
`.trim();

export const summaryPrompt = (content: string) => `
Summarize the following content for a student. Include:
1. A 2-3 sentence overview.
2. 5-7 key takeaways as bullet points.
3. Important terms with brief definitions.

Use clear Markdown formatting.

Content:
"""
${content}
"""
`.trim();

export const tutorSystemPrompt = `
You are Notestify, a friendly and rigorous tutor. Help the student understand concepts deeply.
- Ask clarifying questions when helpful.
- Explain step by step.
- Use analogies and examples.
- Encourage active recall.
- Keep answers focused and well-structured.
`.trim();
