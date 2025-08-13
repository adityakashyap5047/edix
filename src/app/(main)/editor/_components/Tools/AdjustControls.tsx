"use client"

import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { useCanvas } from '@/context/Context';
import { Project } from '@/types'
import { filters } from 'fabric'
import { Loader2, RotateCcw, Palette, Zap, Sun, Moon, Eye, Sparkles } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

const FILTER_CONFIGS = [
  {
    key: "brightness",
    label: "Brightness",
    min: -100,
    max: 100,
    step: 1,
    defaultValue: 0,
    filterClass: filters.Brightness,
    valueKey: "brightness",
    transform: (value: number) => value / 100,
  },
  {
    key: "contrast",
    label: "Contrast",
    min: -100,
    max: 100,
    step: 1,
    defaultValue: 0,
    filterClass: filters.Contrast,
    valueKey: "contrast",
    transform: (value: number) => value / 100,
  },
  {
    key: "saturation",
    label: "Saturation",
    min: -100,
    max: 100,
    step: 1,
    defaultValue: 0,
    filterClass: filters.Saturation,
    valueKey: "saturation",
    transform: (value: number) => value / 100,
  },
  {
    key: "vibrance",
    label: "Vibrance",
    min: -100,
    max: 100,
    step: 1,
    defaultValue: 0,
    filterClass: filters.Vibrance,
    valueKey: "vibrance",
    transform: (value: number) => value / 100,
  },
  {
    key: "blur",
    label: "Blur",
    min: 0,
    max: 100,
    step: 1,
    defaultValue: 0,
    filterClass: filters.Blur,
    valueKey: "blur",
    transform: (value: number) => value / 100,
  },
  {
    key: "hue",
    label: "Hue",
    min: -180,
    max: 180,
    step: 1,
    defaultValue: 0,
    filterClass: filters.HueRotation,
    valueKey: "rotation",
    transform: (value: number) => value * (Math.PI / 180),
    suffix: "°",
  },
];

const DEFAULT_VALUES = FILTER_CONFIGS.reduce((acc: Record<string, number>, config) => {
  acc[config.key] = config.defaultValue;
  return acc;
}, {});

// Preset filter combinations for quick application
const FILTER_PRESETS = [
  {
    name: "None",
    icon: RotateCcw,
    description: "Original image",
    values: DEFAULT_VALUES,
  },
  {
    name: "Bright",
    icon: Sun,
    description: "Increase brightness and contrast",
    values: {
      brightness: 15,
      contrast: 10,
      saturation: 5,
      vibrance: 0,
      blur: 0,
      hue: 0,
    },
  },
  {
    name: "Dramatic",
    icon: Zap,
    description: "High contrast, vivid colors",
    values: {
      brightness: 5,
      contrast: 25,
      saturation: 20,
      vibrance: 15,
      blur: 0,
      hue: 0,
    },
  },
  {
    name: "Vintage",
    icon: Palette,
    description: "Warm, faded look",
    values: {
      brightness: -5,
      contrast: -10,
      saturation: -15,
      vibrance: -10,
      blur: 1,
      hue: 10,
    },
  },
  {
    name: "Cool",
    icon: Moon,
    description: "Cool tones, reduced warmth",
    values: {
      brightness: 0,
      contrast: 5,
      saturation: -5,
      vibrance: 0,
      blur: 0,
      hue: -15,
    },
  },
  {
    name: "Sharp",
    icon: Eye,
    description: "Enhanced clarity and definition",
    values: {
      brightness: 5,
      contrast: 20,
      saturation: 10,
      vibrance: 5,
      blur: 0,
      hue: 0,
    },
  },
  {
    name: "Soft",
    icon: Sparkles,
    description: "Gentle, dreamy effect",
    values: {
      brightness: 10,
      contrast: -5,
      saturation: -5,
      vibrance: 5,
      blur: 2,
      hue: 5,
    },
  },
];

const AdjustControls = ({}: {project: Project}) => {
    const [filterValues, setFilterValues] = useState<Partial<Record<string, number>>>(DEFAULT_VALUES);
    const [isProcessing, setIsProcessing] = useState<boolean>(false);

    const { canvasEditor } = useCanvas();

    const resetFilter = () => {
        setFilterValues(DEFAULT_VALUES);
        applyFilters(DEFAULT_VALUES);
    }

    const applyPreset = (presetValues: Record<string, number>) => {
        setFilterValues(presetValues);
        applyFilters(presetValues);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const extractFilterValues = (imageObject: any) => {
        if (!imageObject?.filters?.length) return DEFAULT_VALUES;

        const extractedValues = { ...DEFAULT_VALUES };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        imageObject.filters.forEach((filter: any) => {
            const config = FILTER_CONFIGS.find(c => c.filterClass.name === filter.constructor.name);
            if (config) {
                const filterValue = filter[config.valueKey];
                if (config.key === "hue") {
                    extractedValues[config.key] = Math.round(filterValue * (180 / Math.PI));
                } else {
                    extractedValues[config.key] = Math.round(filterValue * 100);
                }
            }
        });
        return extractedValues;
    }

    const getActiveImage = useCallback(() => {
        if(!canvasEditor) return null;

        const activeObject = canvasEditor.getActiveObject();

        if (activeObject && activeObject.type === 'image') {
            return activeObject;
        }

        const objects = canvasEditor.getObjects();
        return objects.find(obj => obj.type === 'image') || null;
    }, [canvasEditor]);

    useEffect(() => {
        const imageObject = getActiveImage();

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const imageObj = imageObject as any;
        if (imageObj.filters) {
            const existingValues = extractFilterValues(imageObj);
            setFilterValues(existingValues);
        }
    }, [canvasEditor, getActiveImage]);

    const applyFilters = async (newValues: Partial<Record<string, number>>) => {
        const imageObject = getActiveImage();
        if (!imageObject || isProcessing) return;

        setIsProcessing(true);

        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const filterToApply: any[] = [];

            FILTER_CONFIGS.forEach((config) => {
                const value = newValues[config.key];

                if (value !== undefined && value !== config.defaultValue) {
                    const transformedValue = config.transform(value);
                    filterToApply.push(
                        new config.filterClass({
                            [config.valueKey]: transformedValue,
                        })
                    )
                }
            })

            // Type assertion for Fabric.js image object
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const imageObj = imageObject as any;
            imageObj.filters = filterToApply;

            await new Promise<void>((resolve) => {
                imageObj.applyFilters();
                canvasEditor?.requestRenderAll();
                setTimeout(resolve, 50);
            })

            // Trigger canvas modification event to auto-save the changes
            if (canvasEditor) {
                canvasEditor.fire('object:modified', { target: imageObject });
            }
        } catch (error) {
            console.error("Error applying filters:", error);
        } finally {
            setIsProcessing(false);
        }
    }

    const handleValueChange = (key: string, value: number[]) => {
        const newValues = {
            ...filterValues,
            [key]: Array.isArray(value) ? value[0] : value,
        }

        setFilterValues(newValues);
        applyFilters(newValues);
    }

    if (!canvasEditor) {
        return (
            <div className='p-4 space-y-4'>
                <div className='text-center'>
                    <Palette className='h-12 w-12 mx-auto text-white/30 mb-3' />
                    <p className='text-white/70 text-sm font-medium mb-2'>
                        No Image Selected
                    </p>
                    <p className='text-white/50 text-xs'>
                        Upload or select an image to start adjusting colors, brightness, and other properties.
                    </p>
                </div>
                
                <div className='bg-slate-700/30 rounded-lg p-3'>
                    <h4 className='text-xs font-medium text-white mb-2'>Available Adjustments:</h4>
                    <div className='grid grid-cols-2 gap-1 text-xs text-white/60'>
                        <div>• Brightness</div>
                        <div>• Contrast</div>
                        <div>• Saturation</div>
                        <div>• Vibrance</div>
                        <div>• Blur</div>
                        <div>• Hue Rotation</div>
                    </div>
                </div>
            </div>
        )
        
    }

  return (
    <div className='space-y-6'>
        {!getActiveImage() ? (
            <div className='p-4 space-y-4'>
                <div className='text-center'>
                    <Eye className='h-12 w-12 mx-auto text-white/30 mb-3' />
                    <p className='text-white/70 text-sm font-medium mb-2'>
                        No Image Found
                    </p>
                    <p className='text-white/50 text-xs'>
                        Please add an image to the canvas to access adjustment controls.
                    </p>
                </div>
                
                <div className='bg-slate-700/30 rounded-lg p-3'>
                    <h4 className='text-xs font-medium text-white mb-2'>How to add an image:</h4>
                    <ol className='list-decimal list-inside text-xs text-white/60 space-y-1'>
                        <li>Click on an image tool or upload button</li>
                        <li>Select an image from your device</li>
                        <li>The image will appear on the canvas</li>
                        <li>Return here to adjust its properties</li>
                    </ol>
                </div>
            </div>
        ) : (
            <>
        <div className="flex justify-between bg-cyan-500/10 border border-cyan-500/20 rounded-sm p-3">
            <div>
                <p className="text-cyan-400 text-sm font-medium">
                    🎨 Adjust Image Properties
                </p>
                <p className="text-cyan-300/80 text-xs mt-1">
                    Transform your image with presets or fine-tune with manual controls.
                </p>
            </div>
            <Button variant={"ghost"} size={"sm"} onClick={resetFilter} className='text-white/70 hover:text-white'>
                <RotateCcw className='h-4 w-4 mr-2' />
                Reset
            </Button>
        </div>

        {/* Filter Presets Section */}
        <div className='space-y-3'>
            <h3 className='text-sm font-medium text-white'>Quick Presets</h3>
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                {FILTER_PRESETS.map((preset) => {
                    const Icon = preset.icon;
                    const isActive = JSON.stringify(filterValues) === JSON.stringify(preset.values);
                    
                    return (
                        <Button
                            key={preset.name}
                            variant={isActive ? "default" : "outline"}
                            size="sm"
                            onClick={() => applyPreset(preset.values)}
                            className={`group relative flex items-center gap-3 h-auto p-4 min-h-[60px] w-full transition-all duration-200 ${
                                isActive 
                                    ? "bg-cyan-500 hover:!bg-cyan-900 text-white border-cyan-500 shadow-lg shadow-cyan-500/20" 
                                    : "hover:!bg-cyan-800/90 border-white/20 hover:border-white/40 hover:shadow-md"
                            }`}
                        >
                            <div className={`flex-shrink-0 p-2 rounded-lg ${
                                isActive 
                                    ? "bg-white/20" 
                                    : "bg-white/10 group-hover:bg-white/15"
                            }`}>
                                <Icon className="h-4 w-4" />
                            </div>
                            <div className="text-left min-w-0 flex-1">
                                <div className="text-sm font-medium truncate">{preset.name}</div>
                                <div className={`text-xs truncate ${
                                    isActive ? "text-white/80" : "text-white/60"
                                }`}>
                                    {preset.description}
                                </div>
                            </div>
                        </Button>
                    );
                })}
            </div>
        </div>

        <h3 className='text-sm text-center font-bold text-gray-500'>Manual Adjustments</h3>
        
        {
            FILTER_CONFIGS.map((config) => {
                return (
                    <div key={config.key} className='space-y-2'>
                        <div className='flex justify-between items-center'>
                            <label className='text-sm text-white'>{config.label}</label>
                            <span className='text-xs text-white/70'>
                                {filterValues[config.key] || config.defaultValue}
                                {config.suffix || ""}
                            </span>
                        </div>
                        <Slider
                            value={[filterValues[config.key] || config.defaultValue]}
                            min={config.min}
                            max={config.max}
                            step={config.step}
                            onValueChange={(value) => handleValueChange(config.key, value)}
                            className='w-full cursor-pointer'
                        />
                    </div>
                )
            })
        }

        {/* Tips and Information */}
        <div className='space-y-3'>
            <div className='p-3 bg-slate-700/50 rounded-sm'>
                <h4 className='text-xs font-medium text-white mb-2'>💡 Pro Tips</h4>
                <ul className='text-xs text-white/70 space-y-1'>
                    <li>• Start with presets, then fine-tune with sliders</li>
                    <li>• Brightness affects overall light/dark balance</li>
                    <li>• Contrast makes light areas lighter and dark areas darker</li>
                    <li>• Saturation affects color intensity</li>
                    <li>• Vibrance affects muted colors more than vivid ones</li>
                </ul>
            </div>

            <div className='p-3 bg-blue-900/20 border border-blue-500/30 rounded-sm'>
                <h4 className='text-xs font-medium text-blue-300 mb-2'>ℹ️ Current Settings</h4>
                <div className='grid grid-cols-2 gap-2 text-xs text-blue-200/80'>
                    {FILTER_CONFIGS.map((config) => {
                        const value = filterValues[config.key] || config.defaultValue;
                        if (value === config.defaultValue) return null;
                        
                        return (
                            <div key={config.key} className='flex gap-4'>
                                <span>{config.label}:</span>
                                <span className='font-mono'>
                                    {value}{config.suffix || ""}
                                </span>
                            </div>
                        );
                    })}
                    {Object.values(filterValues).every((value, index) => 
                        value === FILTER_CONFIGS[index]?.defaultValue
                    ) && (
                        <div className='col-span-2 text-center italic'>
                            No adjustments applied
                        </div>
                    )}
                </div>
            </div>
        </div>

        <div className='mt-6 p-3 bg-slate-700/50 rounded-sm'>
            <p className='text-xs text-white/70'>
                ⚡ Adjustments are applied in real-time. Use presets for quick styling or fine-tune with individual sliders.
            </p>
        </div>

        {isProcessing && (
            <div className='flex items-center justify-center py-2'>
                <Loader2 className='h-4 w-4 animate-spin' />
                <span className='ml-2 text-xs text-white/70'>
                    Applying Filters...
                </span>
            </div>
        )}
            </>
        )}
    </div>
  )
}

export default AdjustControls