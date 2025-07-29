"use client"

import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { useCanvas } from '@/context/Context';
import { Project } from '@/types'
import { filters } from 'fabric'
import { Loader2, RotateCcw } from 'lucide-react';
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

const AdjustControls = ({}: {project: Project}) => {
    const [filterValues, setFilterValues] = useState<Partial<Record<string, number>>>(DEFAULT_VALUES);
    const [isProcessing, setIsProcessing] = useState<boolean>(false);

    const { canvasEditor } = useCanvas();

    const resetFilter = () => {
        setFilterValues(DEFAULT_VALUES);
        applyFilters(DEFAULT_VALUES);
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
            <div className='p-4'>
                <p className='text-white/70 text-sm'>Load an Image to start adjusting</p>
            </div>
        )
        
    }

  return (
    <div className='space-y-6'>
        <div className='flex items-center justify-between'>
            <h3 className='text-sm font-medium text-white'>Image Adjustments</h3>
            <Button variant={"ghost"} size={"sm"} onClick={resetFilter} className='text-white/70 hover:text-white'>
                <RotateCcw className='h-4 w-4 mr-2' />
                Reset
            </Button>
        </div>

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

        <div className='mt-6 p-3 bg-slate-700/50 rounded-sm'>
            <p className='text-xs text-white/70'>
                Adjustments are applied in real-time. Use the Reset button to restore original values.
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
    </div>
  )
}

export default AdjustControls