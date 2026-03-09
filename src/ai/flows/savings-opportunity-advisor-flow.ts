'use server';
/**
 * @fileOverview An AI financial assistant that reviews user spending and suggests actionable savings opportunities or strategies.
 *
 * - adviseOnSavingsOpportunities - A function that handles the savings opportunity advisory process.
 * - SavingsOpportunityAdvisorInput - The input type for the adviseOnSavingsOpportunities function.
 * - SavingsOpportunityAdvisorOutput - The return type for the adviseOnSavingsOpportunities function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const TransactionSchema = z.object({
  date: z.string().describe('The date of the transaction (e.g., YYYY-MM-DD).'),
  description: z.string().describe('A brief description of the transaction.'),
  category: z.string().describe('The category of the expense (e.g., Groceries, Dining Out, Utilities).'),
  amount: z.number().describe('The amount of the transaction. Positive for income, negative for expense.'),
});

const SavingsOpportunityAdvisorInputSchema = z.object({
  transactionHistory: z.array(TransactionSchema).describe('A list of the user\'s recent financial transactions.'),
});
export type SavingsOpportunityAdvisorInput = z.infer<typeof SavingsOpportunityAdvisorInputSchema>;

const SavingsOpportunityAdvisorOutputSchema = z.object({
  expenditureSummary: z.string().describe('A concise summary of the user\'s overall spending habits based on the provided transaction history.'),
  savingsOpportunities: z.array(
    z.object({
      opportunity: z.string().describe('A specific area identified for potential savings.'),
      potentialSavings: z.string().describe('An estimate of how much could be saved (e.g., "$50/month", "10% of dining budget").'),
      recommendation: z.string().describe('An actionable recommendation to realize the savings opportunity.'),
    })
  ).describe('A list of actionable savings opportunities tailored to the user\'s habits.'),
  personalizedStrategies: z.array(
    z.object({
      strategy: z.string().describe('A broader financial strategy for increasing savings.'),
      explanation: z.string().describe('A detailed explanation of the strategy and how it can be implemented.'),
    })
  ).describe('A list of personalized savings strategies.'),
});
export type SavingsOpportunityAdvisorOutput = z.infer<typeof SavingsOpportunityAdvisorOutputSchema>;

export async function adviseOnSavingsOpportunities(input: SavingsOpportunityAdvisorInput): Promise<SavingsOpportunityAdvisorOutput> {
  return savingsOpportunityAdvisorFlow(input);
}

const prompt = ai.definePrompt({
  name: 'savingsOpportunityAdvisorPrompt',
  input: { schema: SavingsOpportunityAdvisorInputSchema },
  output: { schema: SavingsOpportunityAdvisorOutputSchema },
  prompt: `You are an AI financial assistant. Your goal is to review a user's spending habits based on their transaction history and provide personalized budgeting insights, expenditure summaries, and tailored recommendations for financial products or savings strategies.

Analyze the provided transaction history and identify recurring expenses, areas of high spending, and potential inefficiencies.

Then, generate:
1. An 'expenditureSummary': A concise summary of the user's spending habits.
2. 'savingsOpportunities': A list of specific, actionable savings opportunities. For each opportunity, provide:
   - 'opportunity': A clear description of the area.
   - 'potentialSavings': An estimate of how much could be saved.
   - 'recommendation': A practical, actionable step the user can take.
3. 'personalizedStrategies': A list of broader, personalized savings strategies. For each strategy, provide:
   - 'strategy': The name or concept of the strategy.
   - 'explanation': How the strategy works and how the user can implement it.

Ensure your suggestions are realistic and helpful, based solely on the provided transaction data.

Transaction History:
{{#each transactionHistory}}
  - Date: {{{this.date}}}, Description: {{{this.description}}}, Category: {{{this.category}}}, Amount: {{{this.amount}}}
{{/each}}
`,
});

const savingsOpportunityAdvisorFlow = ai.defineFlow(
  {
    name: 'savingsOpportunityAdvisorFlow',
    inputSchema: SavingsOpportunityAdvisorInputSchema,
    outputSchema: SavingsOpportunityAdvisorOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) {
      throw new Error('Failed to get a response from the AI assistant.');
    }
    return output;
  }
);
