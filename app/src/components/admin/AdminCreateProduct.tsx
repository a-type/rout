import { sdkHooks } from '@/services/publicSdk';
import { Button } from '@a-type/ui';
import { useNavigate } from '@tanstack/react-router';

export interface AdminCreateProductProps {
  className?: string;
}

export function AdminCreateProduct({ className }: AdminCreateProductProps) {
  const navigate = useNavigate();

  const mutation = sdkHooks.useAdminCreateGameProduct();

  const createProduct = async () => {
    const product = await mutation.mutateAsync(undefined);

    navigate({
      from: '/admin/products',
      search: (prev) => ({ ...prev, productId: product.id }),
    });
  };

  return (
    <Button className={className} emphasis="primary" onClick={createProduct}>
      Create Product
    </Button>
  );
}
