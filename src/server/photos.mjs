// Owner-managed photos. kind: 'project' (completed work the owner is authorized to publish) or 'concept'
// (design concepts/renderings, always labeled). Only status 'published' photos are served or listed publicly.
import { all, get } from './db.mjs';

export const PHOTO_KINDS = { project: 'Completed project (authorized)', concept: 'Design concept / rendering' };

export function publishedPhotos(kind) {
  return all("SELECT * FROM photos WHERE status = 'published' AND kind = ? ORDER BY sort, created_at DESC", kind);
}
export function publishedPhoto(id) {
  return get("SELECT * FROM photos WHERE id = ? AND status = 'published'", id);
}
