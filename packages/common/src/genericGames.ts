export interface Drawing {
  strokes: {
    path: number[][];
    color: 'light' | 'dark' | 'contrast';
  }[];
}
