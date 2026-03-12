'use server';
/**
 * @fileOverview A Genkit flow for a financial assistant to generate a personalized monthly budget.
 *
 * - budgetingAssistant - A function that analyzes past transactions and generates a monthly budget.
 * - BudgetingAssistantInput - The input type for the budgetingAssistant function.
 * - BudgetingAssistantOutput - The return type for the budgetingAssistant function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const BudgetingAssistantInputSchema = z.object({
  transactions: z.array(
    z.object({
      date: z.string().describe('The date of the transaction in YYYY-MM-DD format.'),
      amount: z.number().describe('The amount of the transaction.'),
      category: z.string().describe('The category of the transaction (e.g., "Groceries", "Utilities", "Salary").'),
      description: z.string().describe('A brief description of the transaction.'),
      type: z.enum(['income', 'expense']).describe('Type of transaction, either income or expense.')
    })
  ).describe('A list of past financial transactions.'),
});
export type BudgetingAssistantInput = z.infer<typeof BudgetingAssistantInputSchema>;

const BudgetingAssistantOutputSchema = z.object({
  monthlyBudget: z.object({
    estimatedMonthlyIncome: z.number().describe('Estimated total monthly income based on transactions.'),
    totalMonthlyExpenses: z.number().describe('Estimated total monthly expenses based on transactions.'),
    allocations: z.array(
      z.object({
        category: z.string().describe('The budget category (e.g., "Housing", "Food", "Transportation").'),
        allocatedAmount: z.number().describe('The recommended allocated amount for this category.'),
        description: z.string().describe('Justification or explanation for this allocation.')
      })
    ).describe('Recommended budget allocations per category.'),
  }).describe('The generated personalized monthly budget.'),
  summary: z.string().describe('An overall summary of spending patterns and budgeting insights.'),
  financialGoalsRecommendations: z.array(z.string()).describe('Personalized recommendations for financial goals and savings strategies.'),
});
export type BudgetingAssistantOutput = z.infer<typeof BudgetingAssistantOutputSchema>;

export async function budgetingAssistant(input: BudgetingAssistantInput): Promise<BudgetingAssistantOutput> {
  return budgetingAssistantFlow(input);
}

const budgetingAssistantPrompt = ai.definePrompt({
  name: 'budgetingAssistantPrompt',
  input: { schema: BudgetingAssistantInputSchema },
  output: { schema: BudgetingAssistantOutputSchema },
  prompt: `You are an expert AI financial assistant. Your task is to analyze the provided transaction history and generate a personalized monthly budget, along with insights and recommendations.

Analyze the following transactions:

{{#each transactions}}
- Date: {{{date}}}, Type: {{{type}}}, Category: {{{category}}}, Amount: {{{amount}}}, Description: {{{description}}}
{{/each}}

Based on these transactions, provide:
1. An estimated total monthly income and total monthly expenses.
2. A detailed breakdown of recommended monthly budget allocations for various categories, including justification for each.
3. A summary of insights into the user's spending patterns and overall financial health.
4. Personalized recommendations for managing spending, saving strategies, and achieving financial goals.

Ensure the output strictly follows the JSON schema provided. Focus on actionable advice and a balanced budget plan.`,
});

const budgetingAssistantFlow = ai.defineFlow(
  {
    name: 'budgetingAssistantFlow',
    inputSchema: BudgetingAssistantInputSchema,
    outputSchema: BudgetingAssistantOutputSchema,
  },
  async (input) => {
    let attempts = 0;
    const maxAttempts = 3;
    
    while (attempts < maxAttempts) {
      try {
        const { output } = await budgetingAssistantPrompt(input);
        if (!output) throw new Error('Empty output from AI');
        return output;
      } catch (error) {
        attempts++;
        if (attempts >= maxAttempts) throw error;
        await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
      }
    }
    throw new Error('Failed to generate budget after retries.');
  }
);
