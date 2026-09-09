'use client';

import { FileUp, LoaderCircle } from 'lucide-react';
import { useId, useRef } from 'react';

import { Button } from '@/components/ui/button';

type FileDropProps = {
  label: string;
  buttonLabel?: string;
  accept: string;
  hint: string;
  loading?: boolean;
  error?: string;
  onFile: (file: File) => void;
};

export function FileDrop({
  label,
  buttonLabel,
  accept,
  hint,
  loading = false,
  error,
  onFile,
}: FileDropProps) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="rounded-xl border border-dashed border-border-strong bg-surface-muted px-5 py-7 text-center">
      <input
        ref={inputRef}
        id={id}
        type="file"
        className="sr-only"
        aria-label={label}
        accept={accept}
        disabled={loading}
        onChange={(event) => {
          const file = event.currentTarget.files?.[0];
          if (file) onFile(file);
          event.currentTarget.value = '';
        }}
      />
      <span className="mx-auto grid size-11 place-items-center rounded-xl bg-accent text-accent-foreground">
        {loading ? (
          <LoaderCircle aria-hidden="true" className="size-5 animate-spin" />
        ) : (
          <FileUp aria-hidden="true" className="size-5" />
        )}
      </span>
      <p className="mt-4 text-sm font-semibold">{label}</p>
      <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-muted-foreground">
        {hint}
      </p>
      <Button
        type="button"
        size="lg"
        className="mt-5 min-w-56"
        disabled={loading}
        onClick={() => inputRef.current?.click()}
      >
        {loading ? 'Reading file…' : (buttonLabel ?? label)}
      </Button>
      {error ? (
        <p role="alert" className="mt-3 text-sm font-medium text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
