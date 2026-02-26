'use client';

import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { ImportParseError } from '@/lib/importErrors';
import { formatImportErrorMessage } from '@/lib/importErrors';

type Props = {
  errors: ImportParseError[];
  open: boolean;
  onClose: () => void;
};

const ErrorTypeLabels: Record<ImportParseError['type'], string> = {
  invalid_date: 'Invalid date',
  invalid_amount: 'Invalid amount',
  missing_required_field: 'Missing field',
  wrong_column_count: 'Column count',
};

export default function ImportErrorsDialog({ errors, open, onClose }: Props) {
  return (
    <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Import failed</DialogTitle>
          <DialogDescription>
            Found {errors.length} error{errors.length !== 1 ? 's' : ''} in the
            file. Fix the issues below and try again.
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-64 overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Row</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {errors.map((error, i) => (
                <TableRow key={`${error.row}-${error.column}-${i}`}>
                  <TableCell className="font-mono">{error.row}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {ErrorTypeLabels[error.type]}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatImportErrorMessage(error)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <DialogFooter showCloseButton />
      </DialogContent>
    </Dialog>
  );
}
