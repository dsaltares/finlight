'use client';

import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { type CSVImportField, CSVImportFields } from '@/lib/importPresets';
import { cn } from '@/lib/utils';

type Props = {
  fields: CSVImportField[];
  onAppend: (field: CSVImportField) => void;
  onRemove: (index: number) => void;
  onMove: (from: number, to: number) => void;
};

export default function ImportFields({
  fields,
  onAppend,
  onRemove,
  onMove,
}: Props) {
  const fieldRows = toFieldRows(fields);
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 4,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const previousOrder = fieldRows.map((row) => row.key);
    const oldIndex = previousOrder.indexOf(String(active.id));
    const newIndex = previousOrder.indexOf(String(over.id));

    if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) {
      return;
    }

    const nextOrder = arrayMove(previousOrder, oldIndex, newIndex);
    const nextIndex = nextOrder.indexOf(String(active.id));

    if (nextIndex !== -1 && nextIndex !== oldIndex) {
      onMove(oldIndex, nextIndex);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <Select
        value=""
        onValueChange={(value) => {
          onAppend(value as CSVImportField);
        }}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Set field order" />
        </SelectTrigger>
        <SelectContent>
          {CSVImportFields.map((field) => (
            <SelectItem key={field} value={field}>
              {field}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Card className="gap-0 py-0">
        {fields.length > 0 ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={fieldRows.map((row) => row.key)}
              strategy={verticalListSortingStrategy}
            >
              <div className="divide-y">
                {fieldRows.map(({ key, field, index }) => (
                  <SortableFieldRow
                    key={key}
                    id={key}
                    field={field}
                    itemIndex={index}
                    onRemove={onRemove}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        ) : (
          <p className="px-4 py-3 text-xs text-muted-foreground">
            No fields selected
          </p>
        )}
      </Card>
    </div>
  );
}

type SortableFieldRowArgs = {
  id: string;
  field: CSVImportField;
  itemIndex: number;
  onRemove: (index: number) => void;
};

function SortableFieldRow({
  id,
  field,
  itemIndex,
  onRemove,
}: SortableFieldRowArgs) {
  const {
    setNodeRef,
    setActivatorNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex items-center gap-1 px-2 py-1',
        isDragging ? 'bg-muted/60' : '',
      )}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
    >
      <Button
        ref={setActivatorNodeRef}
        type="button"
        variant="ghost"
        size="icon-xs"
        aria-label={`Reorder ${field}`}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-3 text-muted-foreground" />
      </Button>
      <p className="min-w-0 flex-1 truncate text-xs text-foreground">{field}</p>
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        onClick={() => onRemove(itemIndex)}
        aria-label={`Remove ${field}`}
      >
        <Trash2 className="size-3.5" />
      </Button>
    </div>
  );
}

function toFieldRows(fields: CSVImportField[]) {
  const counts = new Map<CSVImportField, number>();

  return fields.map((field, index) => {
    const count = (counts.get(field) ?? 0) + 1;
    counts.set(field, count);
    return {
      key: `${field}-${count}`,
      field,
      index,
    };
  });
}
