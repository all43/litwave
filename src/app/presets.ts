export interface MessagePreset {
  label: string;
  message: string;
  category: 'general' | 'meme' | 'event';
}

export const MESSAGE_PRESETS: MessagePreset[] = [
  // General
  { label: 'Hello', message: 'HELLO', category: 'general' },
  { label: 'SOS', message: 'SOS', category: 'general' },
  { label: 'Love', message: 'LOVE', category: 'general' },
  { label: 'Peace', message: 'PEACE', category: 'general' },
  { label: 'Go!', message: 'GO', category: 'general' },
  { label: 'Yes', message: 'YES', category: 'general' },
  { label: 'No', message: 'NO', category: 'general' },

  // Meme / fun
  { label: 'Send Nudes', message: 'SEND NUDES', category: 'meme' },
  { label: 'HODL', message: 'HODL', category: 'meme' },
  { label: 'Bruh', message: 'BRUH', category: 'meme' },
  { label: 'Ligma', message: 'LIGMA', category: 'meme' },
  { label: 'gg', message: 'GG', category: 'meme' },
  { label: 'F', message: 'F', category: 'meme' },
  { label: 'Yolo', message: 'YOLO', category: 'meme' },
  { label: 'OMG', message: 'OMG', category: 'meme' },
  { label: 'Rickroll', message: 'NEVER GONNA GIVE YOU UP', category: 'meme' },
  { label: 'To The Moon', message: 'TO THE MOON', category: 'meme' },

  // Event / flashmob
  { label: 'We Are One', message: 'WE ARE ONE', category: 'event' },
  { label: 'Happy Birthday', message: 'HAPPY BIRTHDAY', category: 'event' },
  { label: 'Surprise', message: 'SURPRISE', category: 'event' },
  { label: 'Thank You', message: 'THANK YOU', category: 'event' },
  { label: 'Welcome', message: 'WELCOME', category: 'event' },
  { label: 'Encore', message: 'ENCORE', category: 'event' },
];
