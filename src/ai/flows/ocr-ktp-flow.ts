'use server';
/**
 * @fileOverview A Genkit flow for extracting identity information from a KTP (Indonesian ID Card) photo.
 *
 * - extractKtpData - A function that handles the OCR process using Gemini Multimodal.
 * - KtpOcrInput - The input type for the extraction function.
 * - KtpOcrOutput - The return type containing extracted fields.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const KtpOcrInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a KTP, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type KtpOcrInput = z.infer<typeof KtpOcrInputSchema>;

const KtpOcrOutputSchema = z.object({
  isKtp: z.boolean().describe('Whether or not the image is a valid Indonesian KTP.'),
  fullName: z.string().optional().describe('Full name extracted from the KTP.'),
  idNumber: z.string().optional().describe('16-digit NIK (Nomor Induk Kependudukan).'),
  address: z.string().optional().describe('Complete address extracted from the KTP.'),
  province: z.string().optional().describe('Province listed on the KTP.'),
  city: z.string().optional().describe('City/Regency listed on the KTP.'),
});
export type KtpOcrOutput = z.infer<typeof KtpOcrOutputSchema>;

export async function extractKtpData(input: KtpOcrInput): Promise<KtpOcrOutput> {
  return ktpOcrFlow(input);
}

const ktpOcrPrompt = ai.definePrompt({
  name: 'ktpOcrPrompt',
  input: { schema: KtpOcrInputSchema },
  output: { schema: KtpOcrOutputSchema },
  prompt: `You are an expert document analyzer for AliBank. 
Your task is to extract information from the provided Indonesian identity card (KTP).

1. Determine if the image is a valid Indonesian KTP.
2. If it is a KTP, extract the following fields exactly as they appear:
   - Full Name (Nama)
   - NIK (16-digit number)
   - Address (Alamat)
   - Province (PROVINSI)
   - City (KABUPATEN/KOTA)

Return the results in the specified JSON format. If a field is unreadable, return null or empty string.

Photo: {{media url=photoDataUri}}`,
});

const ktpOcrFlow = ai.defineFlow(
  {
    name: 'ktpOcrFlow',
    inputSchema: KtpOcrInputSchema,
    outputSchema: KtpOcrOutputSchema,
  },
  async (input) => {
    const { output } = await ktpOcrPrompt(input);
    if (!output) throw new Error('AI Node failed to parse the document.');
    return output;
  }
);
