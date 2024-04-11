import { SupabaseClient } from '@supabase/supabase-js';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import * as dotenv from 'dotenv';
import { readdir, readFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import React from 'react';

dotenv.config({ path: resolve(__dirname, '../../../.env.local') });

export const renderWithConfig = (
  element: React.ReactElement,
  queryClient?: QueryClient,
): ReturnType<typeof render> => {
  const client = queryClient ?? new QueryClient();
  const TestQueryClientProvider = ({
    children,
  }: {
    children: React.ReactNode;
  }) => <QueryClientProvider client={client}> {children} </QueryClientProvider>;
  return render(element, { wrapper: TestQueryClientProvider });
};

export const loadFixtures = async () => {
  const fixturesDir = resolve(__dirname, '__fixtures__');
  const fileNames = await readdir(fixturesDir);
  return {
    fileNames,
    files: await Promise.all(
      fileNames.map(
        async (f) =>
          new File([(await readFile(join(fixturesDir, f))) as BlobPart], f),
      ),
    ),
  };
};

export const upload = async (
  client: SupabaseClient,
  bucketName: string,
  dirName: string,
): Promise<string[]> => {
  const fixturesDir = resolve(__dirname, '__fixtures__');
  const fileNames = await readdir(fixturesDir);
  await Promise.all(
    fileNames.map(
      async (f) =>
        await client.storage
          .from(bucketName)
          .upload(`${dirName}/${f}`, await readFile(join(fixturesDir, f))),
    ),
  );
  return fileNames;
};

export const cleanup = async (
  client: SupabaseClient,
  bucketName: string,
  dirName: string,
) => {
  const { data } = await client.storage.from(bucketName).list(dirName);
  await client.storage
    .from(bucketName)
    .remove((data ?? []).map((d) => `${dirName}/${d.name}`));
};
