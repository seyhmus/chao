"use client";

import { Flex, Link, Tooltip } from "@radix-ui/themes";
import ImageLightBox from "./ImageLightBox";
import { useEffect } from "react";
import { DownloadIcon, OpenInNewWindowIcon } from "@radix-ui/react-icons";

const BlobView = ({ blob, fileName, fileType, className }) => {
  // const newBlob = new Blob([blob], { type: fileType });
  const file = new File([blob], fileName, { type: fileType });

  const fileUrl = URL.createObjectURL(file);

  // Helper function to determine file type
  const getFileCategory = () => {
    if (!fileType) return "unknown";
    if (fileType.startsWith("image/")) return "image";
    if (fileType.startsWith("video/")) return "video";
    if (fileType.startsWith("audio/")) return "audio";
    if (fileType === "application/pdf") return "pdf";
    if (fileType === "text/plain") return "text";
    if (fileType.includes("sheet") || fileType.includes("excel"))
      return "spreadsheet";
    if (fileType.includes("document") || fileType.includes("word"))
      return "document";
    return "unknown";
  };

  const renderFallback = (fileUrl, fileName) => {
    return (
      <Flex align={"center"} gap="3" mb={"4"}>
        📄 {fileName}
        <Tooltip content="Download">
          <Link href={fileUrl} download={fileName}>
            <DownloadIcon />
          </Link>
        </Tooltip>
        <Tooltip content="Open in new tab">
          <Link href="#" onClick={() => window.open(fileUrl, "_blank")}>
            <OpenInNewWindowIcon />
          </Link>
        </Tooltip>
      </Flex>
    );
  };

  const renderContent = () => {
    const category = getFileCategory();

    switch (category) {
      case "image":
        return (
          <ImageLightBox className={className} src={fileUrl} alt={fileName} />
        );

      case "video":
        return (
          <video className={className} controls>
            <source src={fileUrl} type={fileType} />
            Your browser does not support video playback.
          </video>
        );

      case "audio":
        return (
          <audio className={className} controls>
            <source src={fileUrl} type={fileType} />
            Your browser does not support audio playback.
          </audio>
        );

      case "pdf":
        return (
          <object
            className={className}
            data={fileUrl}
            type="application/pdf"
            width="100%"
          >
            {renderFallback(fileUrl, fileName)}
          </object>
        );

      case "text":
        return (
          <div className={className}>
            <iframe src={fileUrl} title={fileName} width="100%" />
          </div>
        );

      // For files that can't be previewed directly
      case "spreadsheet":
      case "document":
      case "unknown":
      default:
        return renderFallback(fileUrl, fileName);
    }
  };

  // Cleanup URL when component unmounts
  useEffect(() => {
    return () => {
      URL.revokeObjectURL(fileUrl);
    };
  }, [fileUrl]);

  return <div className="file-viewer">{renderContent()}</div>;
};

export default BlobView;
