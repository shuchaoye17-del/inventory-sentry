import { act, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { InventorySafetyApp } from './InventorySafetyApp';

type RegisteredTool = {
  name: string;
  title?: string;
  inputSchema: Record<string, unknown>;
  annotations?: Record<string, boolean>;
  execute: (input: unknown) => unknown;
};

describe('InventorySafetyApp WebMCP contract', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    Reflect.deleteProperty(document, 'modelContext');
  });

  it('registers and executes the same bundled-sample action as the visible UI', async () => {
    let registeredTool: RegisteredTool | undefined;
    const registerTool = vi.fn((tool: RegisteredTool) => {
      registeredTool = tool;
    });
    Object.defineProperty(document, 'modelContext', {
      configurable: true,
      value: { registerTool },
    });
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response('SKU,Quantity\nSAMPLE-001,8\n', {
          status: 200,
          headers: { 'content-type': 'text/csv' },
        }),
      ),
    );

    render(<InventorySafetyApp />);

    expect(registerTool).toHaveBeenCalledOnce();
    expect(registeredTool).toMatchObject({
      name: 'load_sample_inventory',
      inputSchema: {
        type: 'object',
        properties: {},
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
    });

    await act(async () => {
      await registeredTool?.execute({});
    });

    expect(await screen.findByText('clean-current.csv')).toBeInTheDocument();
    expect(screen.getByText('1 data row')).toBeInTheDocument();
  });

  it('rejects invalid input without loading or changing the visible workflow', async () => {
    let registeredTool: RegisteredTool | undefined;
    Object.defineProperty(document, 'modelContext', {
      configurable: true,
      value: {
        registerTool: (tool: RegisteredTool) => {
          registeredTool = tool;
        },
      },
    });
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    render(<InventorySafetyApp />);

    await expect(
      registeredTool?.execute({ unexpected: true }),
    ).rejects.toThrow(/accepts an empty object/i);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(
      screen.getByRole('button', { name: /upload current supplier file/i }),
    ).toBeInTheDocument();
  });
});
