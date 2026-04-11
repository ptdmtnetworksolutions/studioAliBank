'use server';
/**
 * @fileOverview A Genkit flow for extracting full identity information from an Indonesian KTP.
 *
 * - extractKtpData - A function that handles the full OCR process using Gemini Multimodal.
 * - KtpOcrInput - The input type for the extraction function.
 * - KtpOcrOutput - The return type containing all Indonesian KTP fields.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const KtpOcrInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a KTP, as a data URI that must include a MIME type and use Base64 encoding."
    ),
});
export type KtpOcrInput = z.infer<typeof KtpOcrInputSchema>;

const KtpOcrOutputSchema = z.object({
  isKtp: z.boolean().describe('Whether or not the image is a valid Indonesian KTP.'),
  nik: z.string().optional().describe('16-digit NIK.'),
  nama: z.string().optional().describe('Full name (Nama).'),
  tempatTglLahir: z.string().optional().describe('Place and Date of Birth (Tempat/Tgl Lahir).'),
  jenisKelamin: z.string().optional().describe('Gender (Jenis Kelamin).'),
  alamat: z.string().optional().describe('Main address (Alamat).'),
  rtRw: z.string().optional().describe('RT/RW information.'),
  kelDesa: z.string().optional().describe('Kelurahan or Desa.'),
  kecamatan: z.string().optional().describe('Kecamatan.'),
  agama: z.string().optional().describe('Religion (Agama).'),
  statusPerkawinan: z.string().optional().describe('Marital status (Status Perkawinan).'),
  pekerjaan: z.string().optional().describe('Occupation (Pekerjaan).'),
  kewarganegaraan: z.string().optional().describe('Nationality (Kewarganegaraan).'),
  berlakuHingga: z.string().optional().describe('Validity (Berlaku Hingga).'),
});
export type KtpOcrOutput = z.infer<typeof KtpOcrOutputSchema>;

export async function extractKtpData(input: KtpOcrInput): Promise<KtpOcrOutput> {
  return ktpOcrFlow(input);
}

const ktpOcrPrompt = ai.definePrompt({
  name: 'ktpOcrPrompt',
  input: { schema: KtpOcrInputSchema },
  output: { schema: KtpOcrOutputSchema },
  prompt: `You are a high-precision document analyzer for AliBank. 
Your task is to extract ALL information from the provided Indonesian identity card (KTP).

Please extract these fields EXACTLY as they appear:
- NIK (Nomor Induk Kependudukan)
- Nama
- Tempat/Tgl Lahir
- Jenis Kelamin
- Alamat
- RT/RW
- Kel/Desa
- Kecamatan
- Agama
- Status Perkawinan
- Pekerjaan
- Kewarganegaraan
- Berlaku Hingga

If a field is unreadable, leave it empty. Ensure isKtp is true ONLY if it looks like a valid KTP.

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
