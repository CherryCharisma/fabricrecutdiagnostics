import axios from "axios";
import type { RecutRow, UploadFull, UploadSummary } from "./types";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export async function createUpload(
  filename: string,
  rows: RecutRow[]
): Promise<UploadSummary> {
  const { data } = await axios.post<UploadSummary>(`${API}/uploads`, {
    filename,
    rows,
  });
  return data;
}

export async function listUploads(): Promise<UploadSummary[]> {
  const { data } = await axios.get<UploadSummary[]>(`${API}/uploads`);
  return data;
}

export async function fetchUpload(id: string): Promise<UploadFull> {
  const { data } = await axios.get<UploadFull>(`${API}/uploads/${id}`);
  return data;
}

export async function deleteUpload(id: string): Promise<void> {
  await axios.delete(`${API}/uploads/${id}`);
}
