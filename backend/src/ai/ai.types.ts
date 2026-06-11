export interface GenerateBaristaReplyInput {
  userMessage: string;
  chatHistory?: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
  menuContext?: Array<{
    productId: string;
    name: string;
    price: number;
    category: string;
    tags?: string[];
    aiDescription?: string | null;
  }>;
  recommendedProducts?: Array<{
    productId: string;
    name: string;
    price: number;
    matchScore: number;
    aiReasonText?: string;
  }>;
  language?: 'id' | 'en';
}

export interface GenerateBaristaReplyResult {
  content: string;
  provider: 'groq';
  model: string;
  fallbackUsed: boolean;
  rawResponse?: unknown;
}
