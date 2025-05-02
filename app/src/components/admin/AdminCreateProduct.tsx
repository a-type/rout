import { sdkHooks } from '@/services/publicSdk';
import { Button } from '@a-type/ui';
import { useSearchParams } from '@verdant-web/react-router';

export interface AdminCreateProductProps {
  className?: string;
}

export function AdminCreateProduct({ className }: AdminCreateProductProps) {
  const [_, setSearch] = useSearchParams();

  const mutation = sdkHooks.useAdminCreateGameProduct();

  const createProduct = async () => {
    const product = await mutation.mutateAsync(undefined);

    setSearch((prev) => {
      prev.set('productId', product.id);
      return prev;
    });
  };

  return (
    <Button className={className} color="primary" onClick={createProduct}>
      Create Product
    </Button>
  );
}
