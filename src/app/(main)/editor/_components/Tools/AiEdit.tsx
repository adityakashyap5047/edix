"use client";

import { Button } from "@/components/ui/button";
import { useCanvas } from "@/context/Context";
import { Project } from "@/types"
import axios from "axios";
import { FabricImage } from "fabric";
import { Camera, Info, Mountain, Sparkles, User, Wand2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const RETOUCH_PRESETS = [
  {
    key: "ai_retouch",
    label: "AI Retouch",
    description: "Improve image quality with AI",
    icon: Sparkles,
    transform: "e-retouch",
    recommended: true,
  },
  {
    key: "ai_upscale",
    label: "AI Upscale",
    description: "Increase resolution to 16MP",
    icon: User,
    transform: "e-upscale",
    recommended: false,
  },
  {
    key: "enhance_sharpen",
    label: "Enhance & Sharpen",
    description: "AI retouch + contrast + sharpening",
    icon: Mountain,
    transform: "e-retouch,e-contrast,e-sharpen",
    recommended: false,
  },
  {
    key: "premium_quality",
    label: "Premium Quality",
    description: "AI retouch + upscale + enhancements",
    icon: Camera,
    transform: "e-retouch,e-upscale,e-contrast,e-sharpen",
    recommended: false,
  },
];

const AiEdit = ( {project}: {project: Project} ) => {

    const { canvasEditor, setProcessingMessage } = useCanvas();
    const [selectedPreset, setSelectedPreset] = useState("ai_retouch");

    const getMainImage = () => canvasEditor?.getObjects().find((obj) => obj.type === "image") || null;
    const selectedPresetData = RETOUCH_PRESETS.find((p) => p.key === selectedPreset);

    const buildRetouchUrl = (imageUrl: string, presetKey: string) => {
        const preset = RETOUCH_PRESETS.find((p) => p.key === presetKey);
        if (!imageUrl || !preset) return imageUrl;

        const [baseUrl, existingQuery] = imageUrl.split("?");

        if (existingQuery) {
            const params = new URLSearchParams(existingQuery);
            const existingTr = params.get("tr");

            if (existingTr) {
                return `${baseUrl}?tr=${existingTr},${preset.transform}`;
            }
        }

        return `${baseUrl}?tr=${preset.transform}`;
    };

    const getImageSrc = (image: FabricImage) => {
        if (!image) return undefined;
        if (typeof image.getSrc === "function") return image.getSrc();
        if (image._element && image._element instanceof HTMLImageElement) return image._element.src;
        return undefined;
    };

    const applyRetouch = async () => {
        const mainImage = getMainImage() as FabricImage;
        if (!mainImage || !project || !selectedPresetData || !canvasEditor) return;

        const currentImageUrl = getImageSrc(mainImage);
        if (!currentImageUrl) return;

        setProcessingMessage(`Enhancing image with ${selectedPresetData.label}...`);

        try {
            const retouchedUrl = buildRetouchUrl(currentImageUrl, selectedPreset);

            const retouchedImage = await FabricImage.fromURL(retouchedUrl, {
                crossOrigin: "anonymous",
            });

            const imageProps = {
                left: mainImage.left,
                top: mainImage.top,
                originX: mainImage.originX,
                originY: mainImage.originY,
                angle: mainImage.angle,
                scaleX: mainImage.scaleX,
                scaleY: mainImage.scaleY,
                selectable: true,
                evented: true,
            };

            canvasEditor.remove(mainImage);
            retouchedImage.set(imageProps);
            canvasEditor.add(retouchedImage);
            retouchedImage.setCoords();
            canvasEditor.setActiveObject(retouchedImage);
            canvasEditor.requestRenderAll();
            const response = await axios.post(`/api/projects/${project.id}`, {
                currentImageUrl: retouchedUrl,
                canvasState: canvasEditor.toJSON(),
            })

           if (response.status === 200) {
                toast.success(`Image Edited and Auto Saved!`);
            } else {
                toast.error("Image Edited but failed to Auto Saved. Please save manually.");
            }
        }
        catch (error) {
            console.error("Error retouching image:", error);
            toast.error("Failed to retouch image. Please try again.");
        } finally {
            setProcessingMessage(null);
        }
    }

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-sm font-medium text-white mb-3">
                    Choose Enhancement Style
                </h3>
                <div className="grid grid-cols-2 gap-3">
                    {RETOUCH_PRESETS.map((preset) => {
                        const Icon = preset.icon;
                        const isSelected = selectedPreset === preset.key;

                        return (
                            <div
                                key={preset.key}
                                className={`relative p-4 rounded-lg border cursor-pointer transition-all ${
                                isSelected
                                    ? "border-cyan-400 bg-cyan-400/10"
                                    : "border-white/20 bg-slate-700/30 hover:border-white/40"
                                }`}
                                onClick={() => setSelectedPreset(preset.key)}
                            >
                                <div className="flex flex-col items-center text-center">
                                    <Icon className="h-8 w-8 text-cyan-400 mb-2" />
                                    <div className="flex items-center gap-2 mb-1">
                                        <h4 className="text-white font-medium text-sm">
                                        {preset.label}
                                        </h4>
                                        {preset.recommended && (
                                        <span className="px-1.5 py-0.5 bg-cyan-500 text-white text-xs rounded-full">
                                            ★
                                        </span>
                                        )}
                                    </div>
                                    <p className="text-white/70 text-xs">{preset.description}</p>
                                </div>

                                {isSelected && (
                                <div className="absolute top-2 right-2">
                                    <div className="w-3 h-3 bg-cyan-400 rounded-full"></div>
                                </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            <Button onClick={applyRetouch} className="w-full hover:scale-101" variant="primary">
                <Wand2 className="h-4 w-4 mr-2" />
                Apply {selectedPresetData?.label}
            </Button>

            <div className="bg-slate-700/30 rounded-lg p-4">
                <h4 className="text-sm font-medium text-white mb-2 flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    How AI Retouch Works
                </h4>
                <div className="space-y-2 text-xs text-white/70">
                    <p>
                        • <strong>AI Retouch:</strong> AI analyzes and applies optimal
                        improvements
                    </p>
                    <p>
                        • <strong>Smart Processing:</strong> Preserves details while
                        enhancing quality
                    </p>
                    <p>
                        • <strong>Multiple Styles:</strong> Choose enhancement that fits
                        your image
                    </p>
                    <p>
                        • <strong>Instant Results:</strong> See improvements in seconds
                    </p>
                </div>
            </div>
        </div>
   )
}

export default AiEdit