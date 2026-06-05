import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  type FirebaseStorage,
} from 'firebase/storage'
import { storage as _storage } from './firebase'

function getStorage(): FirebaseStorage {
  if (!_storage) throw new Error('Firebase Storage is not enabled on this project. Visit the Firebase Console to activate it.')
  return _storage
}

export interface UploadResult {
  url: string
  storagePath: string
}

export interface MediaUploader {
  uploadFile(
    file: File,
    storagePath: string,
    onProgress?: (pct: number) => void
  ): Promise<UploadResult>
  deleteFile(storagePath: string): Promise<void>
}

// ── Image compression ────────────────────────────────────────────────────────

export async function compressImage(file: File, maxEdge = 1600): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const objectUrl = URL.createObjectURL(file)
    img.onload = () => {
      const scale = Math.min(1, maxEdge / Math.max(img.width, img.height))
      const w = Math.round(img.width * scale)
      const h = Math.round(img.height * scale)
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')
      if (!ctx) { resolve(file); return }
      ctx.drawImage(img, 0, 0, w, h)
      URL.revokeObjectURL(objectUrl)
      canvas.toBlob(
        (blob) => {
          if (!blob) { resolve(file); return }
          resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), {
            type: 'image/jpeg',
            lastModified: Date.now(),
          }))
        },
        'image/jpeg',
        0.85
      )
    }
    img.onerror = reject
    img.src = objectUrl
  })
}

// ── Firebase Storage implementation ─────────────────────────────────────────

export class FirebaseMediaUploader implements MediaUploader {
  async uploadFile(
    file: File,
    storagePath: string,
    onProgress?: (pct: number) => void
  ): Promise<UploadResult> {
    return new Promise((resolve, reject) => {
      const storageRef = ref(getStorage(), storagePath)
      const task = uploadBytesResumable(storageRef, file, {
        contentType: file.type,
      })
      task.on(
        'state_changed',
        (snap) => {
          onProgress?.(Math.round((snap.bytesTransferred / snap.totalBytes) * 100))
        },
        reject,
        async () => {
          try {
            const url = await getDownloadURL(task.snapshot.ref)
            resolve({ url, storagePath })
          } catch (e) {
            reject(e)
          }
        }
      )
    })
  }

  async deleteFile(storagePath: string): Promise<void> {
    await deleteObject(ref(getStorage(), storagePath))
  }
}

// ── Cloudinary stub (Fallback ohne Firebase Blaze) ───────────────────────────

export class CloudinaryMediaUploader implements MediaUploader {
  private cloudName: string
  private uploadPreset: string

  constructor(cloudName: string, uploadPreset: string) {
    this.cloudName = cloudName
    this.uploadPreset = uploadPreset
  }

  async uploadFile(
    file: File,
    storagePath: string,
    onProgress?: (pct: number) => void
  ): Promise<UploadResult> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('upload_preset', this.uploadPreset)
    formData.append('public_id', storagePath.replace(/\//g, '_'))

    const xhr = new XMLHttpRequest()
    return new Promise((resolve, reject) => {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) onProgress?.(Math.round((e.loaded / e.total) * 100))
      }
      xhr.onload = () => {
        const res = JSON.parse(xhr.responseText)
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve({ url: res.secure_url, storagePath: res.public_id })
        } else {
          reject(new Error(res.error?.message ?? 'Upload failed'))
        }
      }
      xhr.onerror = () => reject(new Error('Network error'))
      xhr.open('POST', `https://api.cloudinary.com/v1_1/${this.cloudName}/auto/upload`)
      xhr.send(formData)
    })
  }

  async deleteFile(_storagePath: string): Promise<void> {
    // Cloudinary deletion requires server-side signed request — handled externally
    console.warn('Cloudinary deletion requires a signed server request')
  }
}

// ── No-op (unauthenticated / offline) ───────────────────────────────────────

export class NoOpMediaUploader implements MediaUploader {
  async uploadFile(): Promise<UploadResult> {
    throw new Error('MEDIA_UPLOAD_REQUIRES_LOGIN')
  }
  async deleteFile(): Promise<void> {
    throw new Error('MEDIA_DELETE_REQUIRES_LOGIN')
  }
}
