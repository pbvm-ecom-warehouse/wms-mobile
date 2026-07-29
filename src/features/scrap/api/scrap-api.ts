import { apiClient, cachedGet, unwrapData } from '@/shared/lib/api-client';
import type {
  CreateScrapNoteInput,
  QueryScrapNotesInput,
  RejectScrapNoteInput,
  ScrapNote,
} from '../types/scrap';

interface ApiListLike<T> {
  data?: T[];
  items?: T[];
  total?: number;
  page?: number;
  limit?: number;
}

export async function listScrapNotes(
  input: QueryScrapNotesInput = {},
  forceRefresh = false,
): Promise<ScrapNote[]> {
  const response = await cachedGet<ApiListLike<ScrapNote> | ScrapNote[]>('/scrap-notes', {
    params: {
      limit: input.limit,
      page: input.page,
      status: input.status && input.status !== 'ALL' ? input.status : undefined,
    },
  }, { forceRefresh });
  const unwrapped = unwrapData<ApiListLike<ScrapNote> | ScrapNote[]>(response.data);
  if (Array.isArray(unwrapped)) {
    return unwrapped;
  }
  if (unwrapped && Array.isArray((unwrapped as ApiListLike<ScrapNote>).data)) {
    return (unwrapped as ApiListLike<ScrapNote>).data!;
  }
  if (unwrapped && Array.isArray((unwrapped as ApiListLike<ScrapNote>).items)) {
    return (unwrapped as ApiListLike<ScrapNote>).items!;
  }
  return [];
}

export async function getScrapNote(id: string): Promise<ScrapNote> {
  const response = await cachedGet<ScrapNote>(`/scrap-notes/${encodeURIComponent(id)}`);
  return unwrapData<ScrapNote>(response.data);
}

export async function createScrapNote(input: CreateScrapNoteInput): Promise<ScrapNote> {
  const formData = new FormData();
  if (input.note?.trim()) {
    formData.append('note', input.note.trim());
  }
  formData.append('items', JSON.stringify(input.items));

  if (input.imageUris && input.imageUris.length > 0) {
    input.imageUris.forEach((uri) => {
      const filename = uri.split('/').pop() || 'scrap_evidence.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';
      // @ts-ignore React Native FormData file payload
      formData.append('images_0', {
        uri,
        name: filename,
        type,
      });
    });
  }

  const response = await apiClient.post<ScrapNote>('/scrap-notes', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return unwrapData<ScrapNote>(response.data);
}

export async function approveScrapNote(id: string): Promise<ScrapNote> {
  const response = await apiClient.post<ScrapNote>(
    `/scrap-notes/${encodeURIComponent(id)}/approve`,
  );
  return unwrapData<ScrapNote>(response.data);
}

export async function rejectScrapNote(
  id: string,
  input: RejectScrapNoteInput,
): Promise<ScrapNote> {
  const response = await apiClient.post<ScrapNote>(
    `/scrap-notes/${encodeURIComponent(id)}/reject`,
    input,
  );
  return unwrapData<ScrapNote>(response.data);
}
