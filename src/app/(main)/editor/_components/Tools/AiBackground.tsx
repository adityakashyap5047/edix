import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCanvas } from "@/context/Context";
import { Project } from "@/types"
import { FabricImage } from "fabric";
import { Download, ImageIcon, Loader2, Palette, Search, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { HexColorPicker } from "react-colorful"
import { Input } from "@/components/ui/input";
import axios from "axios";
import Image from "next/image";

const UNSPLASH_ACCESS_KEY = process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY!;
const UNSPLASH_API_URL= "https://api.unsplash.com";

// Add interface for Unsplash image type
interface UnsplashImage {
  id: string;
  urls: {
    small: string;
    regular: string;
  };
  alt_description?: string;
  user: {
    name: string;
  };
}

const AiBackground = ({project}: {project: Project}) => {

  const { canvasEditor, processingMessage, setProcessingMessage } = useCanvas();

  const [backgroundColor, setBackgroundColor] = useState("#ffffff");
  const [searchQuery, setSearchQuery] = useState("");
  const [unsplashImages, setUnsplashImages] = useState<UnsplashImage[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [aiPrompt, setAiPrompt] = useState("");

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

  const handleGenerateBackground = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter" || !aiPrompt.trim()) return;
    const mainImage = getMainImage();

    if (!mainImage || !project || !canvasEditor) return;

    setProcessingMessage("Generating background with AI...")
    try {
      const currentImageUrl = project.currentImageUrl || project.originalImageUrl;

      const aiGeneratedUrl = currentImageUrl?.includes("ik.imagekit.io") ? `${currentImageUrl.split("?")[0]}?tr=e-changebg-prompt-${encodeURIComponent(aiPrompt)}` : currentImageUrl;
      const processedImage = await FabricImage.fromURL(aiGeneratedUrl!, {
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

      toast.success("Background Generated successfully!");
      setAiPrompt("");
    } catch (error) {
      console.error("Error generating background:", error);
      toast.error("Failed to generate background. Please try again.");
    } finally {
      setProcessingMessage(null);
    }
  }

  const handleColorBackground = async () => {
    if (!canvasEditor) return;

    const fabricImage = await FabricImage.fromURL("");
    canvasEditor.backgroundImage = fabricImage;
    canvasEditor.backgroundColor = backgroundColor;
    canvasEditor.requestRenderAll();
  };

  const searchUnsplashImages = async () => {
    if (!searchQuery.trim() || !UNSPLASH_ACCESS_KEY) return;
    
    setIsSearching(true);

    try {
      const response = await axios.get(`${UNSPLASH_API_URL}/search/photos?query=${encodeURIComponent(searchQuery)}&per_page=12`, {
        headers: {
          Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`
        }
      })

      if (response.data && response.data.results) {
        setUnsplashImages(response.data.results);
      } else {
        setUnsplashImages([]);
        toast.error("An Error Occurred while fetching the images.")
      }
    } catch (error) {
      console.error("Error searching Unsplash images:", error);
      toast.error("Failed to fetch images from Unsplash. Please try again.");
    } finally {
      setIsSearching(false);
    }
  }

  const handleSearchKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      searchUnsplashImages();
    }
  }

  const handleRemoveCanvasBackground = async () => {
    if (!canvasEditor) return;

    const fabricImage = await FabricImage.fromURL("");
    canvasEditor.backgroundColor = "";
    canvasEditor.backgroundImage = fabricImage;
    canvasEditor.requestRenderAll();
    toast.success("Canvas background cleared successfully!");
  }

  const handleImageBackground = async (imageUrl: string, imageId: string) => {
    if (!canvasEditor || !project) return;

    setSelectedImageId(imageId);
    setProcessingMessage("Applying background image...");

    try {
      if (UNSPLASH_ACCESS_KEY) {
        await axios.get(`${UNSPLASH_API_URL}/photos/${imageId}/download`, {
          headers: {
            Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`
          }
        });
      }

      const fabricImage = await FabricImage.fromURL(imageUrl, {
        crossOrigin: "anonymous",
      });

      const canvasWidth = canvasEditor.getWidth();
      const canvasHeight = canvasEditor.getHeight();

      const scaleX = canvasWidth / (fabricImage.width || 1);
      const scaleY = canvasHeight / (fabricImage.height || 1);

      const scale = Math.max(scaleX, scaleY);

      fabricImage.set({
        scaleX: scale,
        scaleY: scale,
        originX: "center",
        originY: "center",
        left: canvasWidth / 2,
        top: canvasHeight / 2,
      });

      canvasEditor.backgroundImage = fabricImage;
      canvasEditor.requestRenderAll();
      setSelectedImageId(null);
      toast.success("Background image applied successfully!");
    } catch (error) {
      console.error("Error applying background image:", error);
      toast.error("Failed to apply background image. Please try again.");
    } finally {
      setProcessingMessage(null);
    }
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

        <Input
          value={aiPrompt}
          onChange={(e) => setAiPrompt(e.target.value)}
          placeholder="Generate background... - Snow Hills, Beach ..."
          onKeyDown={handleGenerateBackground}
          className="flex-1 bg-slate-700 my-4 border-white/20 text-white"
        />
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
        <TabsContent value="image" className="space-y-4 mt-6">
          <div>
            <h3 className="text-sm font-medium text-white mb-2">
              Image Background
            </h3>
            <p className="text-xs text-white/70 mb-4">
              Search and use high-quality images from Unsplash
            </p>
          </div>

          <div className="flex gap-2">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for backgrounds..."
              onKeyDown={handleSearchKeyPress}
              className="flex-1 bg-slate-700 border-white/20 text-white"
            />
            <Button
              onClick={searchUnsplashImages}
              disabled={isSearching || !searchQuery.trim()}
              variant={"primary"}
            >
              {isSearching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
          </div>

          {unsplashImages.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-white">Search Results ({unsplashImages.length})</h4>

              <div className="grid grid-cols-2 gap-3 max-h-96 overflow-y-auto" style={{ scrollbarWidth: "none"}}>
                {unsplashImages.map((image: UnsplashImage) => {
                  return (<div key={image.id} onClick={() => handleImageBackground(image.urls.regular, image.id)} className="relative group cursor-pointer rounded-sm overflow-hidden border border-white/10 hover:border-cyan-400 transition-colors">
                    <Image
                      src={image.urls.small}
                      alt={image.alt_description || "Background Image"}
                      className="w-full h-24 object-cover"
                      height={50}
                      width={50}
                    />
                    {selectedImageId === image.id && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <Loader2 className="h-5 w-5 animate-spin text-white" />
                      </div>
                    )}

                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <Download className="h-5 w-5 text-white" />
                    </div>

                    <div className="absolute bottom-0 left-0 right-0 bg-black/70 p-1">
                      <p className="text-xs text-white/80 truncate">
                        by {image.user.name}
                      </p>
                    </div>
                  </div>)
                })}
              </div>
            </div>
          )}

          {!isSearching && unsplashImages?.length === 0 && searchQuery && (
            <div className="text-center py-8">
              <ImageIcon className="h-12 w-12 text-white/30 mx-auto mb-3" />
              <p className="text-white/70 text-sm">
                No images found for {`"${searchQuery}"`}
              </p>
              <p className="text-white/50 text-xs">
                Try a different search term
              </p>
            </div>
          )}

          {!searchQuery && unsplashImages?.length === 0 && (
            <div className="text-center py-8">
              <Search className="h-12 w-12 text-white/30 mx-auto mb-3" />
              <p className="text-white/70 text-sm">
                Search for background images
              </p>
              <p className="text-white/50 text-xs">Powered by Unsplash</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <div className="pt-4 mb-12 border-t border-white/10 w-full">
        <Button
          onClick={handleRemoveCanvasBackground}
          className="w-full"
          variant="outline"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Clear Canvas Background
        </Button>
      </div>
      <hr />
    </div>
  )
}

export default AiBackground