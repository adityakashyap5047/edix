"use client";

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { useCanvas } from '@/context/Context';
import { Project } from '@/types'
import { IText } from 'fabric';
import { AlignCenter, AlignJustify, AlignLeft, AlignRight, Bold, Italic, RotateCcw, Trash2, Type, Underline } from 'lucide-react';
import { useCallback, useEffect, useLayoutEffect, useState } from 'react';

const FONT_FAMILIES = [
  "Arial",
  "Arial Black",
  "Baskerville",
  "Book Antiqua",
  "Brush Script MT",
  "Calibri",
  "Cambria",
  "Caslon",
  "Century Gothic",
  "Comic Sans MS",
  "Consolas",
  "Courier",
  "Courier New",
  "Didot",
  "Franklin Gothic Medium",
  "Futura",
  "Garamond",
  "Georgia",
  "Helvetica",
  "Helvetica Neue",
  "Impact",
  "Lucida Sans Unicode",
  "Menlo",
  "Minion Pro",
  "Monaco",
  "Myriad Pro",
  "Open Sans",
  "Palatino",
  "Papyrus",
  "Roboto",
  "Segoe UI",
  "Tahoma",
  "Times",
  "Times New Roman",
  "Trebuchet MS",
  "Verdana",
];

const FONT_SIZES = { min: 8, max: 120, default: 20 };

const TextControls = ({project}: {project: Project}) => {

    const { canvasEditor } = useCanvas();
    const [selectedText, setSelectedText] = useState<IText | null>(null);
    const [fontFamily, setFontFamily] = useState("Arial");
    const [fontSize, setFontSize] = useState(FONT_SIZES.default);
    const [textColor, setTextColor] = useState("#000000");
    const [textAlign, setTextAlign] = useState("left");
    const [fontWeight, setFontWeight] = useState<"normal" | "bold">("normal");
    const [fontStyle, setFontStyle] = useState<"normal" | "italic">("normal");
    const [underline, setUnderline] = useState(false);
    const [, setChanged] = useState(0);

    const updateSelectedText = useCallback(() => { 
        if (!canvasEditor) return;

        const activeObject = canvasEditor.getActiveObject();

        if (activeObject && activeObject.type === "i-text") {
            const textObj = activeObject as IText;
            setSelectedText(textObj);
            setFontFamily(textObj.fontFamily || "Arial");
            setFontSize(textObj.fontSize || FONT_SIZES.default);
            setTextColor(typeof textObj.fill === "string" ? textObj.fill : "#000000");
            setTextAlign(textObj.textAlign || "left");
            setFontWeight((textObj.fontWeight === "bold" || textObj.fontWeight === 700) ? "bold" : "normal");
            setFontStyle(textObj.fontStyle === "italic" ? "italic" : "normal");
            setUnderline(textObj.underline || false);
        } else {
            setSelectedText(null);
        }
    }, [canvasEditor]);

    useEffect(() => {
        if (!canvasEditor || !project) return;
        
        updateSelectedText();

        const handleSelectionCreated = () => updateSelectedText();
        const handleSelectionUpdated = () => updateSelectedText();
        const handleSelectionCleared = () => setSelectedText(null);

        canvasEditor.on('selection:created', handleSelectionCreated);
        canvasEditor.on('selection:updated', handleSelectionUpdated);
        canvasEditor.on('selection:cleared', handleSelectionCleared);

        return () => {
            canvasEditor.off('selection:created', handleSelectionCreated);
            canvasEditor.off('selection:updated', handleSelectionUpdated);
            canvasEditor.off('selection:cleared', handleSelectionCleared);   
        }
    }, [canvasEditor, updateSelectedText, project]);

    const addText = useCallback(() => {
        if (!canvasEditor) return;

        const text = new IText("Edit this text", {
            left: canvasEditor.width / 2,
            top: canvasEditor.height / 2,
            originX: "center",
            originY: "center",

            fontFamily,
            fontSize,
            fill: textColor,
            textAlign,
            fontWeight,
            fontStyle,
            underline,
            editable: true,
            selectable: true
        });

        canvasEditor.add(text);
        canvasEditor.setActiveObject(text);
        canvasEditor.requestRenderAll();

        setTimeout(() => {
            text.enterEditing();
            text.selectAll();
        }, 100);
    }, [canvasEditor, fontFamily, fontSize, textColor, textAlign, fontWeight, fontStyle, underline]);

    const hasTextOnCanvas = useCallback(() => {
        if (!canvasEditor) return false;
        return canvasEditor.getObjects().some(obj => obj.type === "i-text" || obj.type === "text");
    }, [canvasEditor]);

    const getLatestTextObject = useCallback(() => {
        if (!canvasEditor) return null;
        
        const objects = canvasEditor.getObjects();
        const textObjects = objects.filter(obj => obj.type === "i-text" || obj.type === "text");
        
        return textObjects.length > 0 ? textObjects[textObjects.length - 1] : null;
    }, [canvasEditor]);

    useLayoutEffect(() => {
        // Only auto-select the latest text if there is text on canvas
        // Don't automatically add text - let user click "Add Text" button
        if (hasTextOnCanvas()) {
            const latestText = getLatestTextObject();
            if (latestText && canvasEditor) {
                canvasEditor.setActiveObject(latestText);
                canvasEditor.requestRenderAll();
            }
        }
    }, [hasTextOnCanvas, getLatestTextObject, canvasEditor]);

    if (!canvasEditor) {
        return <div className="p-4">
            <p className='text-white/70 text-sm'>Canvas not ready</p>
        </div>
    }

    const applyFontFamily = (fontFamily: string) => {
        if (!selectedText || !canvasEditor) return;

        setFontFamily(fontFamily);
        selectedText.set("fontFamily", fontFamily);
        canvasEditor.requestRenderAll();
    };

    const applyFontSize = (size: number[]) => {
        if (!selectedText || !canvasEditor) return;

        const newSize = Array.isArray(size) ? size[0] : size;
        setFontSize(newSize);
        selectedText.set("fontSize", newSize);
        canvasEditor.requestRenderAll();
    };

    const applyTextAlign = (align: string) => {
        if (!selectedText || !canvasEditor) return;

        setTextAlign(align);
        selectedText.set("textAlign", align);
        canvasEditor.requestRenderAll();
    }

    const applyTextColor = (color: string) => {
        if (!selectedText || !canvasEditor) return;

        setTextColor(color);
        selectedText.set("fill", color);
        canvasEditor.requestRenderAll();
    }

    const toggleFormat = (format: "bold" | "italic" | "underline") => {
        if (!selectedText || !canvasEditor) return;

        let newValue;
        switch (format) {
            case "bold":
                newValue = selectedText.fontWeight === "bold" ? "normal" : "bold";
                selectedText.set("fontWeight", newValue);
                break;
            case "italic":
                newValue = selectedText.fontStyle === "italic" ? "normal" : "italic";
                selectedText.set("fontStyle", newValue);
                break;
            case "underline":
                newValue = !selectedText.underline;
                selectedText.set("underline", newValue);
                break;
        }

        canvasEditor.requestRenderAll();
        setChanged(prev => prev + 1);       // Force component re-render to updae button active state
    };

    const deleteSelectedText = () => {
        if (!canvasEditor || !selectedText) return;

        canvasEditor.remove(selectedText);
        canvasEditor.requestRenderAll();
        setSelectedText(null);
        // Keep text editing mode active - don't switch tools
        // The current font settings are preserved for next text addition
    };

    const handleTextReset = () => {
        if (!canvasEditor) {
            return;
        }

        const objects = canvasEditor.getObjects();
        
        const textObjects = objects.filter(obj => obj.type === "i-text" || obj.type === "text");
        
        textObjects.forEach(textObj => {
            canvasEditor.remove(textObj);
        });

        canvasEditor.discardActiveObject();
        setSelectedText(null);
        
        // Reset all configuration to defaults
        setFontFamily("Arial");
        setFontSize(FONT_SIZES.default);
        setTextColor("#000000");
        setTextAlign("left");
        setFontWeight("normal");
        setFontStyle("normal");
        setUnderline(false);
        
        canvasEditor.requestRenderAll();
    }

  return (
    <div className='space-y-6'>
        <div className="space-y-4">
            <div className='flex gap-6 justify-center'>
                <div>
                    <h3 className='text-sm font-medium text-white mb-2'>Add Text</h3>
                    <p className="text-xs text-white/70 mb-4">
                        Click to add editable text to your canvas     
                    </p>
                </div>
                <Button variant={"glass"} onClick={handleTextReset} size={"sm"} className='text-white/70 hover:text-white'>
                    <RotateCcw className='h-4 w-4 mr-2' />
                    Reset
                </Button>
            </div>
            <Button className='w-full hover:scale-101' onClick={addText} variant={"primary"}>
                <Type className='h-4 w-4 mr-2' />
                Add Text
            </Button>
            
            {/* Current Configuration Preview */}
            {!selectedText && (
                <div className='p-3 bg-blue-900/20 border border-blue-500/30 rounded-sm'>
                    <h4 className='text-xs font-medium text-blue-300 mb-2'>ℹ️ Current Text Style</h4>
                    <div className='grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-blue-200/80'>
                        <div className='flex gap-4'>
                            <span>Font:</span>
                            <span className='font-mono text-blue-200'>{fontFamily}</span>
                        </div>
                        <div className='flex gap-4'>
                            <span>Size:</span>
                            <span className='font-mono text-blue-200'>{fontSize}px</span>
                        </div>
                        <div className='flex gap-4'>
                            <span>Color:</span>
                            <span className='font-mono text-blue-200'>{textColor}</span>
                        </div>
                        <div className='flex gap-4'>
                            <span>Align:</span>
                            <span className='font-mono text-blue-200 capitalize'>{textAlign}</span>
                        </div>
                        <div className='col-span-2 flex gap-4'>
                            <span>Format:</span>
                            <span className='font-mono text-blue-200'>
                                {fontWeight === "bold" && "Bold "}
                                {fontStyle === "italic" && "Italic "}
                                {underline && "Underline "}
                                {fontWeight === "normal" && fontStyle === "normal" && !underline && "Normal"}
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </div>

        {/* Text Configuration Section - Always Visible */}
        <div className="border-t border-white/10 pt-6">
            <h3 className="text-sm font-medium text-white mb-4">
                {selectedText ? "Edit Selected Text" : "Text Configuration"}
            </h3>
            <p className="text-xs text-white/60 mb-4">
                {selectedText 
                    ? "Modify the currently selected text" 
                    : "Set up font styles for new text"
                }
            </p>

            <div className="space-y-2 mb-4">
                <label className="text-xs text-white/70">Font Family</label>
                <Select value={fontFamily} onValueChange={selectedText ? applyFontFamily : setFontFamily}>
                    <SelectTrigger className='w-full cursor-pointer !bg-slate-700'>
                        <SelectValue placeholder="Select a font" />
                    </SelectTrigger>
                    <SelectContent className='!bg-slate-700'>
                        {FONT_FAMILIES.map((font) => (
                            <SelectItem 
                                className='cursor-pointer hover:!bg-slate-600 focus:!bg-slate-600 data-[highlighted]:!bg-slate-600 data-[state=checked]:!bg-slate-900' 
                                key={font} 
                                value={font}
                            >
                                {font}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-2 mb-4">
                <div className="flex justify-between items-center">
                <label className="text-xs text-white/70">Font Size</label>
                <span className="text-xs text-white/70">{fontSize}px</span>
                </div>
                <Slider
                value={[fontSize]}
                onValueChange={selectedText ? applyFontSize : (value) => setFontSize(value[0])}
                min={FONT_SIZES.min}
                max={FONT_SIZES.max}
                step={1}
                className="w-full cursor-pointer"
                />
            </div>

            <div className="space-y-2 mb-4">
                <label className="text-xs text-white/70">Text Alignment</label>
                <div className="grid grid-cols-4 gap-1">
                    {[
                        ["left", AlignLeft],
                        ["center", AlignCenter],
                        ["right", AlignRight],
                        ["justify", AlignJustify],
                    ].map(([align, Icon], idx) => (
                        <Button
                            key={idx}
                            onClick={() => selectedText ? applyTextAlign(align as string) : setTextAlign(align as string)}
                            variant={textAlign === align ? "default" : "outline"}
                            size="sm"
                            className="p-2"
                        >
                        <Icon className="h-4 w-4" />
                        </Button>
                    ))}
                </div>
            </div>

            <div className="space-y-2 mb-4">
                <label className="text-xs text-white/70">Text Color</label>
                <div className="flex gap-2">
                <input
                    type="color"
                    value={textColor}
                    onChange={(e) => selectedText ? applyTextColor(e.target.value) : setTextColor(e.target.value)}
                    className="w-10 h-10 rounded border border-white/20 bg-transparent cursor-pointer"
                />
                <Input
                    value={textColor}
                    onChange={(e) => selectedText ? applyTextColor(e.target.value) : setTextColor(e.target.value)}
                    placeholder="#000000"
                    className="flex-1 bg-slate-700 border-white/20 text-white text-sm"
                />
                </div>
            </div>

            {/* Formatting Section - Always Visible */}
            <div className="space-y-2 mb-4">
                <label className="text-xs text-white/70">Formatting</label>
                <div className="flex gap-2">
                    <Button
                        onClick={() => selectedText ? toggleFormat("bold") : setFontWeight(fontWeight === "bold" ? "normal" : "bold")}
                        variant={
                        selectedText 
                            ? (selectedText.fontWeight === "bold" ? "default" : "outline")
                            : (fontWeight === "bold" ? "default" : "outline")
                        }
                        size="sm"
                        className="flex-1"
                    >
                        <Bold className="h-4 w-4" />
                    </Button>
                    <Button
                        onClick={() => selectedText ? toggleFormat("italic") : setFontStyle(fontStyle === "italic" ? "normal" : "italic")}
                        variant={
                        selectedText 
                            ? (selectedText.fontStyle === "italic" ? "default" : "outline")
                            : (fontStyle === "italic" ? "default" : "outline")
                        }
                        size="sm"
                        className="flex-1"
                    >
                        <Italic className="h-4 w-4" />
                    </Button>
                    <Button
                        onClick={() => selectedText ? toggleFormat("underline") : setUnderline(!underline)}
                        variant={
                        selectedText 
                            ? (selectedText.underline ? "default" : "outline")
                            : (underline ? "default" : "outline")
                        }
                        size="sm"
                        className="flex-1"
                    >
                        <Underline className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Delete Button - Always Visible but Disabled when no text */}
            <Button
                onClick={deleteSelectedText}
                variant="outline"
                className="w-full text-red-400 border-red-400/20 hover:bg-red-400/10 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!selectedText}
            >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Text
            </Button>
        </div>

        <div className="p-3 bg-emerald-900/20 border border-emerald-500/30 rounded-sm">
            <h4 className="text-xs font-medium text-emerald-300 mb-3 flex items-center gap-2">
                💡 Quick Guide
            </h4>
            <div className="space-y-2 text-xs text-emerald-200/80">
                <div className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">1.</span>
                    <span><strong className="text-emerald-200">Configure</strong> your text style above (font, size, color, formatting)</span>
                </div>
                <div className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">2.</span>
                    <span><strong className="text-emerald-200">Add Text</strong> button creates text with your settings</span>
                </div>
                <div className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">3.</span>
                    <span><strong className="text-emerald-200">Select</strong> text on canvas to edit, format, or delete it</span>
                </div>
                <div className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">4.</span>
                    <span><strong className="text-emerald-200">Reset</strong> clears all text and resets to defaults</span>
                </div>
            </div>
            <div className="mt-3 pt-2 border-t border-emerald-500/20">
                <p className="text-xs text-emerald-300/70 italic">
                    💡 Tip: Double-click text on canvas for quick editing
                </p>
            </div>
        </div>
    </div>
  )
}

export default TextControls