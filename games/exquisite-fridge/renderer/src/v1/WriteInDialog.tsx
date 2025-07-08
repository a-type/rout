import { Dialog, FormikForm, SubmitButton } from '@a-type/ui';
import { isValidWriteIn } from '@long-game/game-exquisite-fridge-definition/v1';
import { useEffect, useState } from 'react';

export interface WriteInDialogProps {}

export function WriteInDialog({}: WriteInDialogProps) {
  const [requestId, setRequestId] = useState<string | null>(null);
  useEffect(() => {
    const handleRequest = (event: Event) => {
      setRequestId((event as CustomEvent).detail.id);
    };

    const handleComplete = () => {
      setRequestId(null);
    };

    writeInEvents.addEventListener('request', handleRequest);
    writeInEvents.addEventListener('complete', handleComplete);

    return () => {
      writeInEvents.removeEventListener('request', handleRequest);
      writeInEvents.removeEventListener('complete', handleComplete);
    };
  }, []);

  return (
    <Dialog
      open={!!requestId}
      onOpenChange={(open) => {
        if (!open) {
          setRequestId(null);
          writeInEvents.dispatchEvent(
            new CustomEvent('complete', { detail: { text: null } }),
          );
        }
      }}
    >
      <Dialog.Content>
        <FormikForm
          key={requestId}
          initialValues={{ text: '' }}
          enableReinitialize
          validate={(values) => {
            if (!isValidWriteIn(values.text)) {
              return { text: 'Please enter a single word.' };
            }
          }}
          onSubmit={({ text }) => {
            writeInEvents.dispatchEvent(
              new CustomEvent('complete', {
                detail: { text: text.trim() },
              }),
            );
            setRequestId(null);
          }}
        >
          <Dialog.Title>Write your own word</Dialog.Title>
          <Dialog.Description>
            Enter a single word to write into your blank tile.
          </Dialog.Description>
          <FormikForm.TextField name="text" required autoCapitalize="none" />
          <Dialog.Actions>
            <Dialog.Close>Nevermind</Dialog.Close>
            <SubmitButton>Write it!</SubmitButton>
          </Dialog.Actions>
        </FormikForm>
      </Dialog.Content>
    </Dialog>
  );
}

const writeInEvents = new EventTarget();

export async function collectInput() {
  writeInEvents.dispatchEvent(
    new CustomEvent('request', { detail: { id: Math.random() } }),
  );
  // Show the write-in dialog and wait for the user to submit their input
  const result = await new Promise<string | null>((resolve) => {
    writeInEvents.addEventListener(
      'complete',
      (event) => {
        resolve((event as CustomEvent<{ text: string | null }>).detail.text);
      },
      { once: true },
    );
  });

  return result;
}
