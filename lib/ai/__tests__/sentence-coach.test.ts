import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock server-only (no-op in test env)
vi.mock('server-only', () => ({}));

// Mock Anthropic SDK
const mockCreate = vi.fn();
vi.mock('@anthropic-ai/sdk', () => ({
  default: class {
    messages = { create: mockCreate };
  },
}));

import { evaluateSentence } from '../sentence-coach';

describe('evaluateSentence', () => {
  beforeEach(() => {
    mockCreate.mockReset();
  });

  it('parses tool_use response correctly', async () => {
    mockCreate.mockResolvedValueOnce({
      content: [
        {
          type: 'tool_use',
          id: 'call_1',
          name: 'evaluate_sentence',
          input: {
            naturalness: 4,
            corrected_sentence: 'The project moved the needle on retention.',
            explanation: 'Good use of the collocation. Minor article needed.',
            alternative_phrase: 'The initiative shifted the needle on retention.',
          },
        },
      ],
      usage: { input_tokens: 100, output_tokens: 50 },
    });

    const result = await evaluateSentence(
      'Project move the needle on retention.',
      'move the needle',
      'make a real difference',
      'This can move the needle on retention.'
    );

    expect(result.evaluation.naturalness).toBe(4);
    expect(result.evaluation.correctedSentence).toContain('moved the needle');
    expect(result.evaluation.explanation).toBeTruthy();
    expect(result.evaluation.alternativePhrase).toBeTruthy();
    expect(result.inputTokens).toBe(100);
    expect(result.outputTokens).toBe(50);
  });

  it('clamps naturalness to 1-5 range', async () => {
    mockCreate.mockResolvedValueOnce({
      content: [
        {
          type: 'tool_use',
          id: 'call_2',
          name: 'evaluate_sentence',
          input: {
            naturalness: 8,
            corrected_sentence: 'test',
            explanation: 'test',
            alternative_phrase: 'test',
          },
        },
      ],
      usage: { input_tokens: 50, output_tokens: 30 },
    });

    const result = await evaluateSentence('test', 'test', 'test', null);
    expect(result.evaluation.naturalness).toBe(5);
  });

  it('clamps naturalness minimum to 1', async () => {
    mockCreate.mockResolvedValueOnce({
      content: [
        {
          type: 'tool_use',
          id: 'call_3',
          name: 'evaluate_sentence',
          input: {
            naturalness: -1,
            corrected_sentence: 'test',
            explanation: 'test',
            alternative_phrase: 'test',
          },
        },
      ],
      usage: { input_tokens: 50, output_tokens: 30 },
    });

    const result = await evaluateSentence('test', 'test', 'test', null);
    expect(result.evaluation.naturalness).toBe(1);
  });

  it('throws when no tool_use block in response', async () => {
    mockCreate.mockResolvedValueOnce({
      content: [{ type: 'text', text: 'Some text response' }],
      usage: { input_tokens: 50, output_tokens: 30 },
    });

    await expect(
      evaluateSentence('test', 'test', 'test', null)
    ).rejects.toThrow('No tool_use block');
  });

  it('uses forced tool_choice in API call', async () => {
    mockCreate.mockResolvedValueOnce({
      content: [
        {
          type: 'tool_use',
          id: 'call_4',
          name: 'evaluate_sentence',
          input: {
            naturalness: 3,
            corrected_sentence: 'test',
            explanation: 'test',
            alternative_phrase: 'test',
          },
        },
      ],
      usage: { input_tokens: 50, output_tokens: 30 },
    });

    await evaluateSentence('test', 'test phrase', 'test translation', null);

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        tool_choice: { type: 'tool', name: 'evaluate_sentence' },
        tools: expect.arrayContaining([
          expect.objectContaining({ name: 'evaluate_sentence' }),
        ]),
      })
    );
  });

  it('includes collocation details in the prompt', async () => {
    mockCreate.mockResolvedValueOnce({
      content: [
        {
          type: 'tool_use',
          id: 'call_5',
          name: 'evaluate_sentence',
          input: {
            naturalness: 3,
            corrected_sentence: 'test',
            explanation: 'test',
            alternative_phrase: 'test',
          },
        },
      ],
      usage: { input_tokens: 50, output_tokens: 30 },
    });

    await evaluateSentence(
      'My sentence here',
      'break new ground',
      'do something innovative',
      'The team broke new ground.'
    );

    const callArgs = mockCreate.mock.calls[0][0];
    const userMessage = callArgs.messages[0].content[0].text;
    expect(userMessage).toContain('break new ground');
    expect(userMessage).toContain('do something innovative');
    expect(userMessage).toContain('The team broke new ground');
    expect(userMessage).toContain('My sentence here');
  });
});
