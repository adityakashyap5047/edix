"use client";

import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useCanvas } from "@/context/Context";
import { Project } from "@/types";
import axios from "axios";
import { FabricImage } from "fabric";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, RotateCcw, Wand2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const DIRECTIONS = [
  { key: "top", label: "Top", icon: ArrowUp },
  { key: "bottom", label: "Bottom", icon: ArrowDown },
  { key: "left", label: "Left", icon: ArrowLeft },
  { key: "right", label: "Right", icon: ArrowRight },
];

const FOCUS_MAP = {
  left: "fo-right",
  right: "fo-left",
  top: "fo-bottom",
  bottom: "fo-top",
};

const AiExtends = ({project}: {project: Project}) => {

    const { canvasEditor, setProcessingMessage } = useCanvas();
    const [selectedDirection, setSelectedDirection] = useState<string | null>(null);
    const [extensionAmount, setExtensionAmount] = useState(200);

    const getMainImage = () => canvasEditor?.getObjects().find(obj => obj.type === 'image') || null;

    const getImageSrc = (image: FabricImage) => {
        if (!image) return undefined;
        if (typeof image.getSrc === "function") return image.getSrc();
        if (image._element && image._element instanceof HTMLImageElement) return image._element.src;
        return undefined;
    };

    const hasBackgroundRemoval = () => {
        const imageSrc = getImageSrc(getMainImage() as FabricImage);

        return (
            imageSrc?.includes("e-bgremove") ||
            imageSrc?.includes("e-removedotbg") ||
            imageSrc?.includes("e-changebg")
        );
    };

    if (hasBackgroundRemoval()) {

        return (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
                <h3 className="text-amber-400 font-medium mb-2">
                Extension Not Available
                </h3>
                <p className="text-amber-300/80 text-sm">
                AI Extension cannot be used on images with removed backgrounds. Use
                extension first, then remove background.
                </p>
            </div>
        );
    }

    const buildExtensionUrl = (imageUrl: string) => {
        const baseUrl = imageUrl.split("?")[0];
        const { width, height } = calculateDimensions();

        const transformations = [
            "bg-genfill", // AI generative fill for new areas
            `w-${width}`,
            `h-${height}`,
            "cm-pad_resize", // Pad resize mode (adds space rather than cropping)
        ]

        const focus = FOCUS_MAP[selectedDirection as keyof typeof FOCUS_MAP];

        if (focus) transformations.push(focus);

        return `${baseUrl}?tr=${transformations.join(",")}`;
    };

    const applyExtension = async () => {
        const mainImage = getMainImage();
        if (!mainImage || !selectedDirection || !canvasEditor) return;

        setProcessingMessage("Extending Image with AI...");

        try {
            const currentImageUrl = getImageSrc(mainImage as FabricImage);
            const extenedImageUrl = buildExtensionUrl(currentImageUrl as string);

            const extendedImage = await FabricImage.fromURL(extenedImageUrl, {
                crossOrigin: "anonymous",
            });

            const scale = Math.min(
                project.width / extendedImage.width,
                project.height / extendedImage.height,
                1
            );

            extendedImage.set({
                left: project.width / 2,
                top: project.height / 2,
                originX: "center",
                originY: "center",
                scaleX: scale,
                scaleY: scale,
                selectable: true,
                evented: true,
            });

            // Replace image
            canvasEditor.remove(mainImage);
            canvasEditor.add(extendedImage);
            canvasEditor.setActiveObject(extendedImage);
            canvasEditor.requestRenderAll();

            const response = await axios.post(`/api/projects/${project.id}`, {
                currentImageUrl: extenedImageUrl,
                canvasState: canvasEditor.toJSON(),
            }, {
                headers: {
                "Content-Type": "application/json"
                }
            });

            if (response.status === 200) {
                toast.success(`Image Extended and Auto Saved!`);
            } else {
                toast.error("Image extended but failed to Auto Saved. Please save manually.");
            }
        } catch (error) {
            console.error("Error applying AI extension:", error);
            toast.error("Failed to extend image with AI. Please try again.");
        } finally {
            setSelectedDirection(null);
            setProcessingMessage(null);
        }
    };

    const selectDirection = (direction: string) => {
        setSelectedDirection((prev) => (prev === direction ? null : direction));
    }

    const calculateDimensions = () => {
        const image = getMainImage();
        if (!image || !selectedDirection) return { width: 0, height: 0 }; 

        const currentWidth = image.width * (image.scaleX || 1);
        const currentHeight = image.height * (image.scaleY || 1);

        const isHorizontal = ["left", "right"].includes(selectedDirection);
        const isVertical = ["top", "bottom"].includes(selectedDirection);

        return {
            width: Math.round(currentWidth + (isHorizontal ? extensionAmount : 0)),
            height: Math.round(currentHeight + (isVertical ? extensionAmount : 0))
        };
    }

    const handleExtendReset = () => {
        // Reset all extension configuration to default state
        setSelectedDirection(null);
        setExtensionAmount(200);
        
        // Clear any active selection on canvas
        if (canvasEditor) {
            canvasEditor.discardActiveObject();
            canvasEditor.requestRenderAll();
        }
        
        // Show feedback to user
        toast.success("Extension settings reset to default");
    };

    const { width: newWidth, height: newHeight } = calculateDimensions();
    const currentImage = getMainImage();

    return (
        <div className="space-y-6">
            {/* Header Section */}
            <div className='p-3 flex gap-4 bg-purple-900/20 border border-purple-500/30 rounded-sm'>
                <div>
                    <h4 className='text-xs font-medium text-purple-300 mb-2'>🔮 AI Image Extension</h4>
                    <p className='text-xs text-purple-200/80'>
                        Expand your image boundaries using artificial intelligence to seamlessly generate new content in any direction.
                    </p>
                </div>
                <Button disabled={!selectedDirection} onClick={handleExtendReset} variant={"glass"} size={"sm"} className='text-white/70 hover:text-white'>
                    <RotateCcw className='h-4 w-4 mr-2' />
                    Reset
                </Button>
            </div>

            {/* Direction Selection */}
            <div>
                <h3 className="text-sm font-medium text-white mb-3">
                    Select Extension Direction
                </h3>
                <p className="text-xs text-white/70 mb-4">
                    Choose one direction to extend your image with AI-generated content
                </p>

                <div className="grid grid-cols-2 gap-3">
                    {DIRECTIONS.map(({ key, label, icon: Icon }) => (
                        <Button
                        key={key}
                        onClick={() => selectDirection(key)}
                        variant={selectedDirection === key ? "default" : "outline"}
                        className={`flex items-center gap-2 h-12 transition-all duration-200 ${
                            selectedDirection === key 
                                ? "bg-cyan-500 hover:bg-cyan-600 shadow-lg shadow-cyan-500/20" 
                                : "hover:bg-white/5 border-white/20 hover:border-white/40"
                        }`}
                        >
                        <Icon className="h-4 w-4" />
                        <span className="font-medium">{label}</span>
                        </Button>
                    ))}
                </div>
            </div>

            {/* Extension Amount Control */}
            <div>
                <div className="flex justify-between items-center mb-3">
                    <label className="text-sm font-medium text-white">Extension Amount</label>
                    <span className="text-xs text-cyan-400 font-mono bg-cyan-500/10 px-2 py-1 rounded">
                        {extensionAmount}px
                    </span>
                </div>
                <Slider
                    value={[extensionAmount]}
                    onValueChange={([value]) => setExtensionAmount(value)}
                    min={50}
                    max={500}
                    step={25}
                    className="w-full cursor-pointer"
                    disabled={!selectedDirection}
                />
                <div className="flex justify-between text-xs text-white/50 mt-1">
                    <span>50px</span>
                    <span>500px</span>
                </div>
                {!selectedDirection && (
                    <p className="text-xs text-white/40 mt-2 italic">
                        Select a direction to enable extension amount control
                    </p>
                )}
            </div>

            {/* Extension Preview */}
            {selectedDirection && (
                <div className='p-3 bg-blue-900/20 border border-blue-500/30 rounded-sm'>
                    <h4 className='text-xs font-medium text-blue-300 mb-3'>📐 Extension Preview</h4>
                    <div className='grid grid-cols-2 gap-3 text-xs text-blue-200/80'>
                        <div className='flex justify-between'>
                            <span>Current Size:</span>
                            <span className='font-mono text-blue-200'>
                                {Math.round(currentImage!.width * (currentImage!.scaleX || 1))} × {Math.round(currentImage!.height * (currentImage!.scaleY || 1))}px
                            </span>
                        </div>
                        <div className='flex justify-between'>
                            <span>Extended Size:</span>
                            <span className='font-mono text-cyan-300 font-medium'>
                                {newWidth} × {newHeight}px
                            </span>
                        </div>
                        <div className='flex justify-between'>
                            <span>Direction:</span>
                            <span className='font-mono text-blue-200 capitalize'>
                                {DIRECTIONS.find((d) => d.key === selectedDirection)?.label}
                            </span>
                        </div>
                        <div className='flex justify-between'>
                            <span>Extension:</span>
                            <span className='font-mono text-purple-300'>
                                +{extensionAmount}px
                            </span>
                        </div>
                    </div>
                    <div className="mt-3 pt-2 border-t border-blue-500/20">
                        <p className="text-xs text-blue-300/70">
                            Canvas size ({project.width} × {project.height}px) remains unchanged
                        </p>
                    </div>
                </div>
            )}

            {/* Apply Button */}
            <Button
                onClick={applyExtension}
                disabled={!selectedDirection}
                className="w-full hover:!scale-101 h-12 font-medium transition-all duration-200"
                variant="primary"
            >
                <Wand2 className="h-5 w-5 mr-2" />
                Apply AI Extension
            </Button>

            {/* Pro Tips Section */}
            <div className='p-3 bg-emerald-900/20 border border-emerald-500/30 rounded-sm'>
                <h4 className='text-xs font-medium text-emerald-300 mb-3'>💡 Pro Tips</h4>
                <div className='space-y-2 text-xs text-emerald-200/80'>
                    <div className='flex items-start gap-2'>
                        <span className='text-emerald-400 font-bold'>•</span>
                        <span><strong className='text-emerald-200'>Best Results:</strong> Use high-resolution images for better AI generation quality</span>
                    </div>
                    <div className='flex items-start gap-2'>
                        <span className='text-emerald-400 font-bold'>•</span>
                        <span><strong className='text-emerald-200'>Multiple Extensions:</strong> You can extend multiple directions sequentially</span>
                    </div>
                    <div className='flex items-start gap-2'>
                        <span className='text-emerald-400 font-bold'>•</span>
                        <span><strong className='text-emerald-200'>Background Removal:</strong> Apply extensions before removing backgrounds</span>
                    </div>
                    <div className='flex items-start gap-2'>
                        <span className='text-emerald-400 font-bold'>•</span>
                        <span><strong className='text-emerald-200'>Processing Time:</strong> Larger extensions may take longer to process</span>
                    </div>
                </div>
            </div>

            {/* How It Works Section */}
            <div className="p-3 bg-slate-700/30 border border-slate-500/30 rounded-sm">
                <h4 className="text-xs font-medium text-slate-300 mb-3">⚙️ How AI Extension Works</h4>
                <div className="space-y-2 text-xs text-slate-400">
                    <div className="flex items-start gap-2">
                        <span className="text-cyan-400 font-bold">1.</span>
                        <span>AI analyzes your image content and edges</span>
                    </div>
                    <div className="flex items-start gap-2">
                        <span className="text-cyan-400 font-bold">2.</span>
                        <span>Generates seamless content in the selected direction</span>
                    </div>
                    <div className="flex items-start gap-2">
                        <span className="text-cyan-400 font-bold">3.</span>
                        <span>Blends new content naturally with existing image</span>
                    </div>
                    <div className="flex items-start gap-2">
                        <span className="text-cyan-400 font-bold">4.</span>
                        <span>Auto-saves the extended image to your project</span>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default AiExtends