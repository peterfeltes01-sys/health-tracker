import type { MediaUploader } from './mediaUploader'
import { NoOpMediaUploader } from './mediaUploader'

let _current: MediaUploader = new NoOpMediaUploader()

export function getMediaUploader(): MediaUploader {
  return _current
}

export function setMediaUploader(uploader: MediaUploader): void {
  _current = uploader
}
