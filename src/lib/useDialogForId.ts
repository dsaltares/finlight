import { useCallback, useState } from 'react';

const useDialogId = () => {
  const [openFor, setOpenFor] = useState<string | undefined>();
  const onOpen = useCallback((id: string) => setOpenFor(id), [setOpenFor]);
  const onClose = useCallback(() => setOpenFor(undefined), [setOpenFor]);
  return {
    open: !!openFor,
    openFor,
    onOpen,
    onClose,
  };
};

export default useDialogId;
