'use server';

/**
 * @fileOverview AI-powered tool that dynamically validates capacity during order assignment, suggesting optimal allocation based on production line capabilities.
 *
 * - validateCapacity - A function that handles the capacity validation process.
 * - ValidateCapacityInput - The input type for the validateCapacity function.
 * - ValidateCapacityOutput - The return type for the validateCapacity function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ValidateCapacityInputSchema = z.object({
  orderId: z.string().describe('The ID of the order to be assigned.'),
  unitId: z.string().describe('The ID of the production unit to which the order is being assigned.'),
  quantity: z.number().describe('The quantity of the order to be assigned.'),
  etdDate: z.string().describe('The expected time of departure date for the order (YYYY-MM-DD).'),
  dailyCap: z.number().describe('The daily capacity of the production line.'),
  assignedCapacity: z.number().describe('The currently assigned capacity of the production line.'),
});
export type ValidateCapacityInput = z.infer<typeof ValidateCapacityInputSchema>;

const ValidateCapacityOutputSchema = z.object({
  isValid: z.boolean().describe('Whether the order assignment is valid based on capacity.'),
  suggestedQuantity: z
    .number()
    .optional()
    .describe('A suggested quantity for the order if the original quantity is not valid.'),
  reason: z.string().describe('The reason for the validation result.'),
});
export type ValidateCapacityOutput = z.infer<typeof ValidateCapacityOutputSchema>;

export async function validateCapacity(input: ValidateCapacityInput): Promise<ValidateCapacityOutput> {
  return validateCapacityFlow(input);
}

const validateCapacityPrompt = ai.definePrompt({
  name: 'validateCapacityPrompt',
  input: {schema: ValidateCapacityInputSchema},
  output: {schema: ValidateCapacityOutputSchema},
  prompt: `You are an AI-powered production planning assistant. Your task is to validate the capacity of a production line when assigning an order.

Given the following information about an order and a production unit, determine if the order can be assigned without exceeding the production line's capacity.

Order ID: {{{orderId}}}
Unit ID: {{{unitId}}}
Quantity to Assign: {{{quantity}}}
ETD Date: {{{etdDate}}}
Daily Capacity: {{{dailyCap}}}
Assigned Capacity: {{{assignedCapacity}}}

Consider the daily capacity of the production line and the already assigned capacity. If the order's quantity can be accommodated within the remaining capacity, respond with isValid: true and a reason. If the order's quantity exceeds the remaining capacity, respond with isValid: false, a suggestedQuantity that does not exceed capacity, and a reason.

Make sure the values are valid numbers.

Output in JSON format:
`,
});

const validateCapacityFlow = ai.defineFlow(
  {
    name: 'validateCapacityFlow',
    inputSchema: ValidateCapacityInputSchema,
    outputSchema: ValidateCapacityOutputSchema,
  },
  async input => {
    const {output} = await validateCapacityPrompt(input);
    return output!;
  }
);
