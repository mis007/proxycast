import {
  useCallback,
  useRef,
  useState,
  type ChangeEvent,
  type ClipboardEvent,
  type DragEvent,
} from "react";
import { toast } from "sonner";
import type { MessageImage } from "../../../types";

function readImageAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      const result = event.target?.result;
      if (typeof result !== "string") {
        reject(new Error("invalid_result"));
        return;
      }

      const [, base64Data = ""] = result.split(",");
      resolve(base64Data);
    };

    reader.onerror = () => {
      reject(reader.error ?? new Error("read_failed"));
    };

    reader.readAsDataURL(file);
  });
}

export function useImageAttachments() {
  const [pendingImages, setPendingImages] = useState<MessageImage[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const appendImageFile = useCallback(
    async (file: File, successMessage?: string) => {
      if (!file.type.startsWith("image/")) {
        toast.info(`暂不支持该文件类型: ${file.type}`);
        return;
      }

      try {
        const base64Data = await readImageAsBase64(file);
        setPendingImages((prev) => [
          ...prev,
          {
            data: base64Data,
            mediaType: file.type,
          },
        ]);
        toast.success(successMessage ?? `已添加图片: ${file.name}`);
      } catch {
        toast.error(`图片读取失败: ${file.name}`);
      }
    },
    [],
  );

  const appendImageFiles = useCallback(
    (files: FileList | File[]) => {
      Array.from(files).forEach((file) => {
        void appendImageFile(file);
      });
    },
    [appendImageFile],
  );

  const handleFileSelect = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (!files || files.length === 0) {
        return;
      }

      appendImageFiles(files);
      event.target.value = "";
    },
    [appendImageFiles],
  );

  const handlePaste = useCallback(
    (event: ClipboardEvent) => {
      const items = event.clipboardData?.items;
      if (!items) {
        return;
      }

      for (const item of items) {
        if (!item.type.startsWith("image/")) {
          continue;
        }

        event.preventDefault();
        const file = item.getAsFile();
        if (file) {
          void appendImageFile(file, "已粘贴图片");
        }
        break;
      }
    },
    [appendImageFile],
  );

  const handleDragOver = useCallback((event: DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (event: DragEvent) => {
      event.preventDefault();
      event.stopPropagation();

      const files = event.dataTransfer.files;
      if (!files || files.length === 0) {
        return;
      }

      appendImageFiles(files);
    },
    [appendImageFiles],
  );

  const handleRemoveImage = useCallback((index: number) => {
    setPendingImages((prev) => prev.filter((_, currentIndex) => currentIndex !== index));
  }, []);

  const clearPendingImages = useCallback(() => {
    setPendingImages([]);
  }, []);

  const openFileDialog = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return {
    pendingImages,
    fileInputRef,
    handleFileSelect,
    handlePaste,
    handleDragOver,
    handleDrop,
    handleRemoveImage,
    clearPendingImages,
    openFileDialog,
  };
}
