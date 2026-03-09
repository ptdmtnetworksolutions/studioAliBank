'use server';
/**
 * @fileOverview An AI agent that analyzes transaction history and provides insights into spending patterns.
 *
 * - getSpendingPatternInsight - A function that handles the spending pattern analysis process.
 * - SpendingPatternInsightInput - The input type for the getSpendingPatternInsight function.
 * - SpendingPatternInsightOutput - The return type for the getSpendingPatternInsight function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TransactionSchema = z.object({
  date: z
    .string()
    .describe('The date of the transaction in YYYY-MM-DD format.'),
  description: z.string().describe('A brief description of the transaction.'),
  category: z.string().describe('The spending category of the transaction.'),
  amount: z.number().describe('The amount of the transaction. Positive for expense, negative for income.'),
});

const SpendingPatternInsightInputSchema = z.object({
  transactions: z
    .array(TransactionSchema)
    .describe('A list of the user\u0027s recent financial transactions.'),
});
export type SpendingPatternInsightInput = z.infer<
  typeof SpendingPatternInsightInputSchema
>;

const SpendingPatternInsightOutputSchema = z.object({
  overallSummary: z.string().describe('A concise overall summary of the user\u0027s spending patterns.'),
  keyCategories: z
    .array(
      z.object({
        name: z.string().describe('The name of the spending category.'),
        totalSpent: z.number().describe('The total amount spent in this category.'),
        percentageOfTotal: z
          .number()
          .describe('The percentage of total spending this category represents.'),
      })
    )
    .describe('A list of key spending categories with total amounts and percentages.'),
  spendingTrends: z
    .array(z.string())
    .describe('Identified trends in spending behavior (e.g., increased spending on dining out).'),
  recommendations: z
    .array(z.string())
    .describe('Personalized recommendations for budgeting or financial products.'),
});
export type SpendingPatternInsightOutput = z.infer<
  typeof SpendingPatternInsightOutputSchema
>;

export async function getSpendingPatternInsight(
  input: SpendingPatternInsightInput
): Promise<SpendingPatternInsightOutput> {
  return spendingPatternInsightFlow(input);
}

const spendingPatternInsightPrompt = ai.definePrompt({
  name: 'spendingPatternInsightPrompt',
  input: {schema: SpendingPatternInsightInputSchema},
  output: {schema: SpendingPatternInsightOutputSchema},
  prompt: `You are an AI financial assistant. Your task is to analyze the provided transaction history and generate an insightful summary of the user's spending patterns, identify key categories, detect trends, and offer personalized recommendations.\n\nHere is the transaction history:\n\n{{#each transactions}}\n- Date: {{{date}}}, Description: {{{description}}}, Category: {{{category}}}, Amount: {{{amount}}}\n{{/each}}\n\nBased on this history, provide the following:\n1.  A concise overall summary of the user's spending habits.\n2.  A list of key spending categories, including the total amount spent in each and its percentage of the total spending.\n3.  Any noticeable spending trends (e.g., increased spending in certain areas, seasonal patterns, unusual expenses).\n4.  Personalized recommendations for budgeting, savings strategies, or relevant financial products based on their spending behavior.`,
});

const spendingPatternInsightFlow = ai.defineFlow(
  {
    name: 'spendingPatternInsightFlow',
    inputSchema: SpendingPatternInsightInputSchema,
    outputSchema: SpendingPatternInsightOutputSchema,
  },
  async (input) => {
    const {output} = await spendingPatternInsightPrompt(input);
    return output!;
  }
);
