import { useEffect, useRef, useState } from 'react'
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/browser'
import { X } from 'lucide-react'

interface Props {
  onDetected: (barcode: string) => void
  onClose: () => void
}

export function BarcodeScanner({ onDetected, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const readerRef = useRef<BrowserMultiFormatReader | null>(null)
  const detectedRef = useRef(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const reader = new BrowserMultiFormatReader()
    readerRef.current = reader

    if (!videoRef.current) return

    reader
      .decodeFromVideoDevice(undefined, videoRef.current, (result, err) => {
        if (detectedRef.current) return
        if (result) {
          detectedRef.current = true
          onDetected(result.getText())
        }
        if (err && !(err instanceof NotFoundException)) {
          setError('Kamerazugriff nicht möglich')
        }
      })
      .catch(() => setError('Kamerazugriff verweigert. Bitte Berechtigung erteilen.'))

    return () => {
      reader.reset()
    }
  }, [onDetected])

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      <div className="flex items-center justify-between p-4 text-white">
        <h2 className="font-semibold text-lg">Barcode scannen</h2>
        <button onClick={onClose} className="p-2 rounded-full bg-white/10 active:bg-white/20">
          <X size={20} />
        </button>
      </div>

      {error ? (
        <div className="flex-1 flex flex-col items-center justify-center text-white text-center px-8 gap-4">
          <p className="text-base">{error}</p>
          <button onClick={onClose} className="px-6 py-3 bg-white/20 rounded-xl text-sm font-medium">
            Schließen
          </button>
        </div>
      ) : (
        <>
          <video ref={videoRef} className="flex-1 object-cover w-full" autoPlay playsInline muted />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-64 h-48 border-2 border-white rounded-2xl" />
          </div>
          <div className="p-6 text-center">
            <p className="text-white/70 text-sm">Barcode in den Rahmen halten</p>
          </div>
        </>
      )}
    </div>
  )
}
