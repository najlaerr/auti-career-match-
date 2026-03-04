import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function generateCareerReport(topCategories: string[]) {
  const prompt = `You are a Career Counselor specialized in Neurodiversity (Autism/ASD). Based on the results of a Gardner Multiple Intelligences test where the student scored highest in ${topCategories.join(', ')}, generate a supportive, strength-based career report. Focus on environments with low sensory overload, structured routines, and clear objectives. Suggest 3 specific job roles and 2 learning strategies tailored for an autistic student. Format the output in clean Markdown.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
  });

  return response.text;
}

export async function generateResume(topCategories: string[]) {
  const prompt = `You are an expert resume writer. Based on a student whose top multiple intelligences are ${topCategories.join(', ')}, create a simple, beginner-friendly functional resume template. Include a Professional Summary, Key Strengths (based on their intelligences), and Suggested Entry-Level Roles. Format the output in clean Markdown.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
  });

  return response.text;
}
