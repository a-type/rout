import { API_ORIGIN } from '@/config';
import { sdkHooks } from '@/services/publicSdk';
import { clsx, Icon, ImageUploader, ImageUploaderRoot } from '@a-type/ui';

export interface UploadAvatarProps {
  className?: string;
}

export function UploadAvatar({ className }: UploadAvatarProps) {
  const setAvatar = sdkHooks.useSetAvatar();
  const { data: me } = sdkHooks.useGetMe();
  return (
    <ImageUploaderRoot
      value={me?.hasAvatar ? `${API_ORIGIN}/users/${me.id}/avatar` : null}
      className={clsx('w-32 aspect-1 overflow-hidden', className)}
      onChange={async (image) => {
        if (image) {
          await setAvatar.mutateAsync({ image });
        }
      }}
      maxDimension={128}
    >
      <ImageUploader.EmptyControls>
        <Icon name="profile" className="w-12 h-12" />
      </ImageUploader.EmptyControls>
      <ImageUploader.Display crossOrigin="use-credentials" />
      <ImageUploader.FileButton
        size="icon"
        color="default"
        className="absolute top-sm right-sm"
      >
        <Icon name="upload" />
      </ImageUploader.FileButton>
    </ImageUploaderRoot>
  );
}
