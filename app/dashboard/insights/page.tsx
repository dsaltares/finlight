'use client';

import Link from 'next/link';
import { Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { reportGroups } from '@/lib/reports';

const allReports = reportGroups.flat();

export default function InsightsPage() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
      {allReports.map((report) => (
        <Card key={report.key}>
          <CardHeader>
            <CardTitle>
              <Link
                href={`/dashboard/insights/${report.key}`}
                className="hover:underline"
              >
                {report.label}
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-0">
            <Suspense
              fallback={
                <div className="flex h-48 items-center justify-center">
                  <Spinner />
                </div>
              }
            >
              <Link
                href={`/dashboard/insights/${report.key}`}
                className="block"
              >
                <report.Component compact />
              </Link>
            </Suspense>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
