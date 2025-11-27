// types/forms/forms.types.ts
export interface FormAnswer {
    questionId: string;
    answer: string | string[] | boolean | number | null;
    remarks?: string;
  }
  
  export interface FormResponse {
    id: string;               // document id in 'forms'
    answeredBy: string;       // user or reviewer id
    answeredAt: string;       // ISO date string
    answers: FormAnswer[];    // actual answers
    status: "pending" | "submitted" | "reviewed";
  }
  
