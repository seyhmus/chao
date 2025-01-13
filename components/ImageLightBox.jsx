import { CrossCircledIcon } from "@radix-ui/react-icons";
import { Dialog, VisuallyHidden } from "@radix-ui/themes";
import { cn } from "@/lib/utils";
import Image from "next/image";

const ImageLightBox = ({ src, alt, style = "" }) => {
  if (!src) return;

  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <div
          className={cn(
            "cursor-zoom-in relative",
            "w-[50vw] h-[30vh]", // Container dimensions
            style
          )}
        >
          <Image
            src={src}
            alt={alt}
            fill
            className="object-contain rounded"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        </div>
      </Dialog.Trigger>

      <Dialog.Content>
        <VisuallyHidden>
          <Dialog.Title></Dialog.Title>
          <Dialog.Description></Dialog.Description>
        </VisuallyHidden>

        <div className="relative w-full h-[80vh]">
          <Image
            src={src}
            alt={alt}
            fill
            className="object-contain"
            sizes="100vw"
            priority
          />
        </div>

        <Dialog.Close>
          <CrossCircledIcon className="absolute top-4 right-4 cursor-pointer" />
        </Dialog.Close>
      </Dialog.Content>
    </Dialog.Root>
  );
};

export default ImageLightBox;
