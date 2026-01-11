export interface QuizQuestion {
    question: string;
    options: string[];
    correctIndex: number;
}

export interface QuizResult {
    questions: QuizQuestion[];
}
