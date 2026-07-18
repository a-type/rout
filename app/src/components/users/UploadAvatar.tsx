import { API_ORIGIN } from '@/config';
import { sdkHooks } from '@/services/publicSdk';
import { Icon, ImageUploader, ImageUploaderRoot } from '@a-type/ui';

export interface UploadAvatarProps {
  className?: string;
}

export function UploadAvatar({ className }: UploadAvatarProps) {
  const setAvatar = sdkHooks.useSetAvatar();
  const { data: me } = sdkHooks.useGetMe();
  return (
    <ImageUploaderRoot
      value={me?.hasAvatar ? `${API_ORIGIN}/users/${me.id}/avatar` : null}
      className={className}
      style={{
        width: 128,
        aspectRatio: '1 / 1',
        overflow: 'clip',
      }}
      onChange={async (image) => {
        if (image) {
          await setAvatar.mutateAsync({ image });
        }
      }}
      maxDimension={128}
    >
      <ImageUploader.EmptyControls>
        <Icon name="profile" size={48} />
      </ImageUploader.EmptyControls>
      <ImageUploader.Display crossOrigin="use-credentials" />
      <ImageUploader.FileButton
        emphasis="default"
        style={{
          position: 'absolute',
          top: 'var(--m-sp-sm)',
          right: 'var(--m-sp-sm)',
        }}
      >
        <Icon name="upload" />
      </ImageUploader.FileButton>
    </ImageUploaderRoot>
  );
}
