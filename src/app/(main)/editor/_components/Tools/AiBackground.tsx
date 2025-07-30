import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCanvas } from "@/context/Context";
import { Project } from "@/types"
import { FabricImage } from "fabric";
import { ImageIcon, Palette, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { HexColorPicker } from "react-colorful"
import { Input } from "@/components/ui/input";

const UNSPLASH_ACCESS_KEY = process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY!;
const UNSPLASH_API_URL= "https://api/unsplash.com";

const AiBackground = ({project}: {project: Project}) => {

  const { canvasEditor, processingMessage, setProcessingMessage } = useCanvas();

  const [backgroundColor, setBackgroundColor] = useState("#ffffff");
  const [searchQuery, setSearchQuery] = useState("");
  const [unsplashImages, setUnsplashImages] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedImageId, setSelectedImageId] = useState(null);

  const getMainImage = () => {
    if (!canvasEditor) return null;

    const objects = canvasEditor.getObjects(); // Get all objects on canvas
    return objects.find((obj) => obj.type === "image") || null; // Find 1st image object
  };

  const handleBackgroundRemoval = async () => {
    const mainImage = getMainImage();

    if (!mainImage || !project || !canvasEditor) return;

    setProcessingMessage("Removing background with AI...")
    try {
      const currentImageUrl = project.currentImageUrl || project.originalImageUrl;

      const bgRemovedUrl = currentImageUrl?.includes("ik.imagekit.io") ? `${currentImageUrl.split("?")[0]}?tr=e-bgremove` : currentImageUrl;

      const processedImage = await FabricImage.fromURL(bgRemovedUrl!, {
        crossOrigin: "anonymous",
      });

      const currentProps = {
        left: mainImage.left,
        top: mainImage.top,
        scaleX: mainImage.scaleX,
        scaleY: mainImage.scaleY,
        angle: mainImage.angle,
        originX: mainImage.originX,
        originY: mainImage.originY,
      };

      // Remove the old image and add the new one
      canvasEditor.remove(mainImage);
      processedImage.set(currentProps);
      canvasEditor.add(processedImage);

      // IMPORTANT: Update coordinates after replacing the image
      processedImage.setCoords();

      // Set as active object and recalculate canvas offset
      canvasEditor.setActiveObject(processedImage);
      canvasEditor.calcOffset();
      canvasEditor.requestRenderAll();

      toast.success("Background removed successfully!");
    } catch (error) {
      console.error("Error removing background:", error);
      toast.error("Failed to remove background. Please try again.");
    } finally {
      setProcessingMessage(null);
    }
  };

  const handleColorBackground = () => {
    if (!canvasEditor) return;

    canvasEditor.backgroundColor = backgroundColor;
    canvasEditor.requestRenderAll();
  };

  return (
    <div className="space-y-6 relative h-full">
      <div>
        <div>
          <h3 className="text-sm font-medium text-white mb-2">
            AI Background Removal
          </h3>
          <p className="text-xs text-white/70 mb-4">
            Automatically remove the background from your image using AI.
          </p>
        </div>

        <Button
          className="w-full hover:!scale-101"
          variant={"primary"}
          onClick={handleBackgroundRemoval}
          disabled={!!processingMessage || !getMainImage()}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Remove Image Background
        </Button>

        {!getMainImage() && (
          <p className="text-xs text-amber-400">
            Please add an image to the canvas first to remove its background.
          </p>
        )}
      </div>

      <Tabs defaultValue="color" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-slate-700/50">
          <TabsTrigger value="color" className="cursor-pointer data-[state-active]:bg-cyan-500 data-[state-active]:text-white">
            <Palette className="h-4 w-4 mr-2" />
          </TabsTrigger>
          <TabsTrigger value="image" className="cursor-pointer data-[state-active]:bg-cyan-500 data-[state-active]:text-white">
            <ImageIcon className="h-4 w-4 mr-2" />
          </TabsTrigger>
        </TabsList>
        <TabsContent value="color" className="space-y-4 mt-6">
          <div>
            <h3 className="text-sm font-medium text-white mb-2">
              Solid Color Background
            </h3>
            <p className="text-xs text-white/70 mb-4">
              Choose a solid color for your canvas background
            </p>
          </div>

          <div className="space-y-4">
            <HexColorPicker
              color={backgroundColor}
              style={{width: "100%", cursor: "pointer"}}
              onChange={setBackgroundColor}
            />

            <div className="flex items-center gap-2">
              <Input
                value={backgroundColor}
                onChange={(e) => setBackgroundColor(e.target.value)}
                placeholder="#ffffff"
                className="flex-1 bg-slate-700 border-white/20 text-white"
              />
              
              <div 
                className="w-10 h-10 rounded border border-white/10"
                style={{backgroundColor}}
              />
            </div>

            <Button className="w-full hover:!scale-101" variant={"primary"} onClick={handleColorBackground}>
              <Palette className="h-4 w-4 mr-2" />
              Apply Color
            </Button>
          </div>
        </TabsContent>
        <TabsContent value="image" className="space-y-4 mt-6">jfls</TabsContent>
      </Tabs>
    </div>
  )
}

export default AiBackground