import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { getCroppedImg } from '../../../../../../utils/cropImage';
import { X, Check, ZoomIn, ZoomOut } from 'lucide-react';

export default function ImageCropperModal({ imageSrc, aspect = 1, onCropComplete, onClose, theme }) {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

    const onCropChange = (crop) => {
        setCrop(crop);
    };

    const onZoomChange = (zoom) => {
        setZoom(zoom);
    };

    const onCropCompleteHandler = useCallback((croppedArea, croppedAreaPixels) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const handleSave = async () => {
        try {
            const croppedImageBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
            onCropComplete(croppedImageBlob);
            onClose();
        } catch (e) {
            console.error(e);
            alert("Gagal crop image");
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className={`w-full max-w-lg rounded-2xl overflow-hidden flex flex-col max-h-[90vh] ${theme.cardBg} border ${theme.border} shadow-2xl`}>
                <div className={`p-4 border-b ${theme.border} flex justify-between items-center`}>
                    <h3 className={`font-bold ${theme.text}`}>Crop Image</h3>
                    <button onClick={onClose} className={`p-2 rounded-full hover:bg-slate-500/20 ${theme.textMuted}`}>
                        <X size={20} />
                    </button>
                </div>

                <div className="relative w-full h-80 bg-black">
                    <Cropper
                        image={imageSrc}
                        crop={crop}
                        zoom={zoom}
                        aspect={aspect}
                        onCropChange={onCropChange}
                        onCropComplete={onCropCompleteHandler}
                        onZoomChange={onZoomChange}
                    />
                </div>

                <div className="p-4 space-y-4">
                    <div className="flex items-center gap-4">
                        <ZoomOut size={16} className={theme.textMuted} />
                        <input
                            type="range"
                            value={zoom}
                            min={1}
                            max={3}
                            step={0.1}
                            aria-labelledby="Zoom"
                            onChange={(e) => setZoom(e.target.value)}
                            className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                        />
                        <ZoomIn size={16} className={theme.textMuted} />
                    </div>

                    <div className="flex gap-3">
                        <button onClick={onClose} className={`flex-1 py-2.5 rounded-xl font-semibold text-sm ${isDarkMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}>
                            Cancel
                        </button>
                        <button onClick={handleSave} className="flex-1 py-2.5 rounded-xl font-bold text-sm bg-indigo-600 text-white hover:bg-indigo-500 flex items-center justify-center gap-2">
                            <Check size={16} /> Apply Crop
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Helper dummy variable for theme check inside component if needed, 
// but we pass theme object as prop.
const isDarkMode = true; 
