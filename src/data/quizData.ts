export type Category = 'LING' | 'LOGI' | 'VISU' | 'MUSI' | 'KINE' | 'NATU' | 'INTRA' | 'INTE';

export const categoryNames: Record<Category, string> = {
  LING: 'Linguistic (Word Smart)',
  LOGI: 'Logical-Mathematical (Number/Reasoning Smart)',
  VISU: 'Visual-Spatial (Picture Smart)',
  MUSI: 'Musical (Sound Smart)',
  KINE: 'Bodily-Kinesthetic (Body Smart)',
  NATU: 'Naturalist (Nature Smart)',
  INTRA: 'Intrapersonal (Self Smart)',
  INTE: 'Interpersonal (People Smart)',
};

export interface Question {
  id: string;
  text: string;
  category: Category;
}

export const questions: Question[] = [
  { id: 'q1', text: 'I enjoy listening to stories or reading books.', category: 'LING' },
  { id: 'q2', text: 'I find it easy to remember names, dates, or trivia facts.', category: 'LING' },
  { id: 'q3', text: 'I like playing word games like Scrabble or crosswords.', category: 'LING' },
  { id: 'q4', text: 'I like to organize things by category (color, size, or type).', category: 'LOGI' },
  { id: 'q5', text: 'I enjoy solving math problems or logical puzzles.', category: 'LOGI' },
  { id: 'q6', text: 'I often ask "How does this work?" or look for patterns.', category: 'LOGI' },
  { id: 'q7', text: 'I prefer looking at pictures or charts rather than long texts.', category: 'VISU' },
  { id: 'q8', text: 'I love building things with LEGO, blocks, or 3D models.', category: 'VISU' },
  { id: 'q9', text: 'I can easily visualize objects or rooms in my head.', category: 'VISU' },
  { id: 'q10', text: 'I can notice when a note or rhythm is out of tune.', category: 'MUSI' },
  { id: 'q11', text: 'I often tap my fingers or move my feet to a beat.', category: 'MUSI' },
  { id: 'q12', text: 'I can remember melodies or songs easily without lyrics.', category: 'MUSI' },
  { id: 'q13', text: 'I find it hard to sit still for a long time.', category: 'KINE' },
  { id: 'q14', text: 'I prefer "learning by doing" rather than just watching.', category: 'KINE' },
  { id: 'q15', text: 'I am good at using my hands for detailed work (cutting, fixing).', category: 'KINE' },
  { id: 'q16', text: 'I am very interested in animals, insects, or plants.', category: 'NATU' },
  { id: 'q17', text: 'I feel calm and happy when I am outdoors (parks, woods).', category: 'NATU' },
  { id: 'q18', text: 'I notice small changes in nature, like a flower blooming.', category: 'NATU' },
  { id: 'q19', text: 'I prefer working or playing alone rather than in a group.', category: 'INTRA' },
  { id: 'q20', text: 'I am very aware of my own feelings and what makes me upset.', category: 'INTRA' },
  { id: 'q21', text: 'I need "quiet time" to recharge after being in a crowd.', category: 'INTRA' },
  { id: 'q22', text: 'I can tell how others feel just by looking at their faces.', category: 'INTE' },
  { id: 'q23', text: 'I enjoy helping others or sharing my things.', category: 'INTE' },
  { id: 'q24', text: 'I like working in a team to solve a problem.', category: 'INTE' },
];
