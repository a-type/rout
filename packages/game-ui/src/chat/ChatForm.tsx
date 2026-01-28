import {
  AvatarList,
  Box,
  BoxProps,
  Button,
  Checkbox,
  FormikForm,
  H3,
  Icon,
  Popover,
  SubmitButton,
  TextAreaField,
  useField,
} from '@a-type/ui';
import { PrefixedId } from '@long-game/common';
import { withGame } from '@long-game/game-client';
import { RefObject, useImperativeHandle, useRef } from 'react';
import { PlayerAvatar } from '../players/PlayerAvatar.js';
import { PlayerName } from '../players/PlayerName.js';

export interface ChatFormProps extends BoxProps {
  timing?: 'round' | 'endgame';
  sceneId?: string;
  position?: { x: number; y: number };
  toolsRef?: RefObject<{ focus: () => void } | null>;
  autoFocus?: boolean;
  onSent?: () => void;
}

export const ChatForm = withGame<ChatFormProps>(function ChatForm({
  gameSuite,
  timing,
  sceneId,
  position,
  toolsRef,
  autoFocus,
  onSent,
  ...props
}) {
  const { latestRoundIndex } = gameSuite;
  const fieldRef = useRef<HTMLTextAreaElement>(null);
  useImperativeHandle(toolsRef, () => ({
    focus: () => {
      fieldRef.current?.focus();
    },
  }));
  return (
    <Box d="col" {...props}>
      <FormikForm
        initialValues={{ text: '', recipientIds: [] as PrefixedId<'u'>[] }}
        onSubmit={(values, { resetForm }) => {
          const roundIndex =
            timing === 'endgame'
              ? -1
              : timing === 'round'
                ? latestRoundIndex
                : undefined;
          gameSuite.sendChat({
            content: values.text,
            position,
            sceneId,
            roundIndex,
          });
          resetForm();
          onSent?.();
        }}
        className="!gap-0"
      >
        {(form) => (
          <>
            <TextAreaField
              name="text"
              placeholder="Say something..."
              autoSize
              className="max-h-200px flex-1"
              textAreaClassName="w-full"
              inputRef={fieldRef}
              autoFocus={autoFocus}
              onKeyDown={(ev) => {
                if (
                  ev.key === 'Enter' &&
                  !(ev.shiftKey || ev.ctrlKey || ev.metaKey)
                ) {
                  ev.preventDefault();
                  form.handleSubmit();
                }
              }}
            />
            <Box gap p="sm" items="center" justify="between" full="width">
              <Box gap>
                <RecipientsField />
              </Box>
              <SubmitButton emphasis="primary">
                <Icon name="send" />
              </SubmitButton>
            </Box>
          </>
        )}
      </FormikForm>
    </Box>
  );
});

const RecipientsField = withGame(function RecipientsField({ gameSuite }) {
  const [field, _, tools] = useField<PrefixedId<'u'>[]>({
    name: 'recipientIds',
  });

  const selectedUsers = gameSuite.members.filter((u) =>
    field.value.includes(u.id),
  );

  return (
    <Popover>
      <Popover.Trigger render={<Button emphasis="ghost" size="small" />}>
        {selectedUsers.length > 0 ? (
          <AvatarList count={selectedUsers.length}>
            {selectedUsers.map(({ id }, index) => (
              <AvatarList.ItemRoot index={index} key={id}>
                <PlayerAvatar playerId={id} />
              </AvatarList.ItemRoot>
            ))}
          </AvatarList>
        ) : (
          <Icon name="globe" />
        )}
      </Popover.Trigger>
      <Popover.Content>
        <Box container="reset" d="col" gap>
          <H3>Select recipients</H3>
          <Box gap items="center">
            <Checkbox
              checked={selectedUsers.length === 0}
              onCheckedChange={(checked) => {
                if (checked) {
                  tools.setValue([]);
                }
              }}
              disabled={selectedUsers.length === 0}
            />
            <Icon name="globe" size={24} />
            Everyone
          </Box>
          {gameSuite.members.map(({ id }) => (
            <Box key={id} gap items="center">
              <Checkbox
                checked={field.value.includes(id)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    tools.setValue([...field.value, id]);
                  } else {
                    tools.setValue(field.value.filter((uId) => uId !== id));
                  }
                }}
              />
              <PlayerAvatar playerId={id} />
              <PlayerName playerId={id} />
            </Box>
          ))}
        </Box>
      </Popover.Content>
    </Popover>
  );
});
