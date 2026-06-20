import { supabase } from "./supabase";

const MAX_SOURCE_BYTES = 12 * 1024 * 1024;
const MAX_OUTPUT_BYTES = 450 * 1024;
const OUTPUT_SIZE = 640;

function assertImageFile(file: File) {
  if (!file.type.startsWith("image/")) {
    throw new Error("Selecione uma imagem válida.");
  }

  if (file.size > MAX_SOURCE_BYTES) {
    throw new Error("A imagem original deve ter no máximo 12 MB.");
  }
}

async function fileToImage(file: File) {
  const objectUrl = URL.createObjectURL(file);

  try {
    const image = new Image();
    image.decoding = "async";

    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("Não foi possível abrir a foto."));
      image.src = objectUrl;
    });

    return image;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number
) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Não foi possível comprimir a foto."));
          return;
        }

        resolve(blob);
      },
      type,
      quality
    );
  });
}

export async function compressStudentPhoto(file: File) {
  assertImageFile(file);

  const image = await fileToImage(file);
  const sourceWidth = image.naturalWidth;
  const sourceHeight = image.naturalHeight;

  if (sourceWidth < 240 || sourceHeight < 240) {
    throw new Error(
      "A foto está pequena demais. Use uma imagem com pelo menos 240 × 240 pixels."
    );
  }

  const cropSize = Math.min(sourceWidth, sourceHeight);
  const cropX = Math.max(0, (sourceWidth - cropSize) / 2);
  const cropY = Math.max(0, (sourceHeight - cropSize) / 2);

  const canvas = document.createElement("canvas");
  canvas.width = OUTPUT_SIZE;
  canvas.height = OUTPUT_SIZE;

  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Seu navegador não conseguiu preparar a foto.");
  }

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(
    image,
    cropX,
    cropY,
    cropSize,
    cropSize,
    0,
    0,
    OUTPUT_SIZE,
    OUTPUT_SIZE
  );

  let quality = 0.8;
  let blob = await canvasToBlob(canvas, "image/webp", quality);

  while (blob.size > MAX_OUTPUT_BYTES && quality > 0.5) {
    quality -= 0.08;
    blob = await canvasToBlob(canvas, "image/webp", quality);
  }

  if (blob.size > 512 * 1024) {
    throw new Error(
      "Não foi possível reduzir a imagem para o tamanho permitido. Escolha outra foto."
    );
  }

  return new File([blob], "student-profile.webp", {
    type: "image/webp",
    lastModified: Date.now(),
  });
}

async function getTeacherAuthorizationHeader(): Promise<
  Record<string, string>
> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    return {};
  }

  return {
    Authorization: `Bearer ${session.access_token}`,
  };
}

export async function uploadStudentPhoto({
  studentId,
  file,
  viewer,
}: {
  studentId: string;
  file: File;
  viewer: "teacher" | "student";
}) {
  const compressed = await compressStudentPhoto(file);
  const formData = new FormData();

  formData.append("studentId", studentId);
  formData.append("file", compressed);

  const headers =
    viewer === "teacher" ? await getTeacherAuthorizationHeader() : {};

  const response = await fetch("/api/student-photo", {
    method: "POST",
    body: formData,
    headers,
    credentials: "include",
  });

  const payload = (await response.json()) as {
    error?: string;
    student?: Record<string, unknown>;
    signedUrl?: string | null;
  };

  if (!response.ok) {
    throw new Error(payload.error || "Não foi possível enviar a foto.");
  }

  return payload;
}

export async function updateStudentIdentityPreference({
  studentId,
  identityMode,
  avatarKey,
}: {
  studentId: string;
  identityMode: "photo" | "avatar";
  avatarKey: string;
}) {
  const response = await fetch("/api/student-photo", {
    method: "PATCH",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      action: "preference",
      studentId,
      identityMode,
      avatarKey,
    }),
  });

  const payload = (await response.json()) as {
    error?: string;
    student?: Record<string, unknown>;
  };

  if (!response.ok) {
    throw new Error(payload.error || "Não foi possível salvar sua preferência.");
  }

  return payload;
}

export async function reviewStudentPhoto({
  studentId,
  status,
  reason,
}: {
  studentId: string;
  status: "approved" | "rejected";
  reason?: string;
}) {
  const headers = await getTeacherAuthorizationHeader();

  const response = await fetch("/api/student-photo", {
    method: "PATCH",
    credentials: "include",
    headers: {
      ...headers,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      action: "review",
      studentId,
      status,
      reason: reason || null,
    }),
  });

  const payload = (await response.json()) as {
    error?: string;
    student?: Record<string, unknown>;
  };

  if (!response.ok) {
    throw new Error(payload.error || "Não foi possível revisar a foto.");
  }

  return payload;
}

export async function getStudentPhotoMetadata({
  studentId,
  viewer,
}: {
  studentId: string;
  viewer: "teacher" | "student";
}) {
  const headers =
    viewer === "teacher" ? await getTeacherAuthorizationHeader() : {};

  const response = await fetch(
    `/api/student-photo?studentId=${encodeURIComponent(studentId)}`,
    {
      headers,
      credentials: "include",
      cache: "no-store",
    }
  );

  const payload = (await response.json()) as {
    error?: string;
    student?: Record<string, unknown>;
    signedUrl?: string | null;
  };

  if (!response.ok) {
    throw new Error(payload.error || "Não foi possível carregar a foto.");
  }

  return payload;
}
