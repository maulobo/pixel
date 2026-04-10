import { useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import {
  supabaseAdmin,
  signInAdmin,
  signOutAdmin,
  uploadAdminImage,
  isAllowedAdminEmail,
  IMAGE_BUCKET,
  CLIENT_ID,
} from "../lib/supabase";

type UploadResult = {
  path: string;
  publicUrl: string;
};

type FolderOption = "modelos" | "unidades" | "config" | "otro";

type PreparedImage = {
  file: File;
  previewUrl: string;
  originalSize: number;
  optimizedSize: number;
  width: number;
  height: number;
};

const MAX_DIMENSION = 1600;
const WEBP_QUALITY = 0.82;
const FOLDER_OPTIONS: Array<{ value: FolderOption; label: string }> = [
  { value: "modelos", label: "modelos" },
  { value: "unidades", label: "unidades" },
  { value: "config", label: "config" },
  { value: "otro", label: "otro" },
];

function UploadFolderIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-5 h-5"
      aria-hidden="true"
    >
      <path d="M3 7.5A1.5 1.5 0 0 1 4.5 6H9l2 2h8.5A1.5 1.5 0 0 1 21 9.5v8A1.5 1.5 0 0 1 19.5 19h-15A1.5 1.5 0 0 1 3 17.5z" />
      <path d="M12 11v5" />
      <path d="m9.5 13.5 2.5-2.5 2.5 2.5" />
    </svg>
  );
}

function SelectCaretIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-4 h-4"
      aria-hidden="true"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function sanitizeFolder(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9/-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function loadImage(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("No se pudo leer la imagen seleccionada."));
    };
    image.src = objectUrl;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, quality: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("No se pudo optimizar la imagen."));
          return;
        }
        resolve(blob);
      },
      "image/webp",
      quality,
    );
  });
}

async function prepareImage(file: File): Promise<PreparedImage> {
  const image = await loadImage(file);
  const scale = Math.min(1, MAX_DIMENSION / Math.max(image.width, image.height));
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("No se pudo preparar el canvas para optimizar la imagen.");
  }

  context.drawImage(image, 0, 0, width, height);

  const blob = await canvasToBlob(canvas, WEBP_QUALITY);
  const safeName = file.name.replace(/\.[^.]+$/, "") || "image";
  const optimizedFile = new File([blob], `${safeName}.webp`, {
    type: "image/webp",
  });
  const previewUrl = URL.createObjectURL(blob);

  return {
    file: optimizedFile,
    previewUrl,
    originalSize: file.size,
    optimizedSize: optimizedFile.size,
    width,
    height,
  };
}

export default function AdminUploadPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [loginStatus, setLoginStatus] = useState<string | null>(null);
  const [folderOption, setFolderOption] = useState<FolderOption>("modelos");
  const [customFolder, setCustomFolder] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preparedImage, setPreparedImage] = useState<PreparedImage | null>(null);
  const [preparing, setPreparing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let active = true;

    supabaseAdmin.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setAuthLoading(false);
    });

    const {
      data: { subscription },
    } = supabaseAdmin.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
      setAuthLoading(false);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const currentEmail = session?.user.email ?? null;
  const allowed = useMemo(() => isAllowedAdminEmail(currentEmail), [currentEmail]);
  const resolvedFolder = folderOption === "otro" ? customFolder : folderOption;

  useEffect(() => {
    if (!copied) return;
    const timeout = window.setTimeout(() => setCopied(false), 1800);
    return () => window.clearTimeout(timeout);
  }, [copied]);

  useEffect(() => {
    return () => {
      if (preparedImage?.previewUrl) {
        URL.revokeObjectURL(preparedImage.previewUrl);
      }
    };
  }, [preparedImage]);

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoginStatus(null);

    try {
      await signInAdmin(email);
      setLoginStatus("Te enviamos un magic link por email para entrar al uploader.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo iniciar sesion.");
    }
  }

  async function handleLogout() {
    setError(null);
    try {
      await signOutAdmin();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cerrar sesion.");
    }
  }

  async function handleUpload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!preparedImage) {
      setError("Selecciona una imagen antes de subir.");
      return;
    }

    setError(null);
    setUploading(true);
    setUploadResult(null);

    try {
      const result = await uploadAdminImage(
        preparedImage.file,
        sanitizeFolder(resolvedFolder) || "misc",
      );
      setUploadResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo subir la imagen.");
    } finally {
      setUploading(false);
    }
  }

  async function handleCopyUrl() {
    if (!uploadResult?.publicUrl) return;
    await navigator.clipboard.writeText(uploadResult.publicUrl);
    setCopied(true);
  }

  async function handleFileChange(file: File | null) {
    setSelectedFile(file);
    setUploadResult(null);
    setError(null);

    if (preparedImage?.previewUrl) {
      URL.revokeObjectURL(preparedImage.previewUrl);
    }
    setPreparedImage(null);

    if (!file) return;

    setPreparing(true);

    try {
      const nextPrepared = await prepareImage(file);
      setPreparedImage(nextPrepared);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo preparar la imagen.");
    } finally {
      setPreparing(false);
    }
  }

  if (authLoading) {
    return (
      <main className="max-w-3xl mx-auto px-6 py-16">
        <div className="px-8 py-16 text-center">
          <p className="text-sm text-slate-600">Cargando acceso al uploader...</p>
        </div>
      </main>
    );
  }

  if (!session) {
    return (
      <main className="max-w-3xl mx-auto px-6 py-12 animate-rise">
        <section className="px-8 py-10">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 mb-3">
            Backoffice
          </p>
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-slate-950">
            Ingresar al uploader
          </h1>
          <p className="text-slate-600 mt-4 max-w-2xl leading-relaxed">
            Esta pantalla sirve para subir una imagen a Supabase Storage y copiar la URL publica para pegarla en Sheets.
          </p>

          <form onSubmit={handleLogin} className="mt-8 space-y-5">
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                Email autorizado
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                className="mt-2 w-full border border-slate-300 bg-white px-4 py-3 text-slate-950 focus:outline-none focus:border-slate-700"
                required
              />
            </label>

            <button
              type="submit"
              className="inline-flex items-center justify-center bg-slate-950 px-6 py-3 text-white font-medium hover:bg-slate-800 transition-colors"
            >
              Enviar magic link
            </button>
          </form>

          {loginStatus && <p className="mt-5 text-sm text-emerald-700">{loginStatus}</p>}
          {error && <p className="mt-5 text-sm text-red-700">{error}</p>}
        </section>
      </main>
    );
  }

  if (!allowed) {
    return (
      <main className="max-w-3xl mx-auto px-6 py-12 animate-rise">
        <section className="px-8 py-10">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 mb-3">
            Backoffice
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
            Acceso no autorizado
          </h1>
          <p className="text-slate-600 mt-4 leading-relaxed">
            Iniciaste sesion como {currentEmail}, pero ese email no esta en la lista permitida para este uploader.
          </p>
          <button
            onClick={handleLogout}
            className="mt-6 inline-flex items-center justify-center border border-slate-300 bg-white px-6 py-3 text-slate-900 font-medium hover:bg-slate-50 transition-colors"
          >
            Cerrar sesion
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="relative max-w-5xl mx-auto px-6 py-10 md:py-14 animate-rise">
      <div className="pointer-events-none absolute inset-x-6 top-0 h-40 bg-[linear-gradient(180deg,rgba(15,23,42,0.05),transparent)]" />
      <div className="pointer-events-none absolute right-6 top-10 h-24 w-24 rounded-full bg-[radial-gradient(circle,rgba(37,99,235,0.14),transparent_68%)]" />

      {uploadResult && (
        <section className="relative mb-8 border border-emerald-200 bg-emerald-50 px-5 py-5 overflow-hidden">
          <div className="absolute left-0 top-0 h-full w-1 bg-emerald-500" />
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700 mb-2">
                Link listo para copiar
              </p>
              <p className="text-sm text-slate-900 mb-3">
                Este es el link que tenés que pegar en Sheets en la columna de imagen.
              </p>
              <div className="border border-emerald-200 bg-white px-3 py-3 text-sm text-slate-700 break-all">
                {uploadResult.publicUrl}
              </div>
            </div>

            <button
              onClick={handleCopyUrl}
              className="shrink-0 inline-flex items-center justify-center bg-slate-950 px-5 py-3 text-white font-medium hover:bg-slate-800 transition-colors"
            >
              {copied ? "Link copiado" : "Copiar link"}
            </button>
          </div>
        </section>
      )}

      <section className="relative border-b border-slate-200 pb-6 mb-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 mb-3">
              Backoffice / Uploader
            </p>
            <h1 className="text-3xl md:text-5xl font-semibold tracking-[-0.04em] text-slate-950">
              Subir imagen y copiar URL
            </h1>
            <p className="text-slate-600 mt-4 max-w-2xl leading-7">
              Sube una imagen al bucket de Supabase, copia el link publico y pegalo en Sheets como `imagen_url`.
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="inline-flex items-center justify-center border border-slate-300 bg-white px-5 py-3 text-slate-900 font-medium hover:bg-slate-50 transition-colors shadow-[0_10px_30px_-20px_rgba(15,23,42,0.45)]"
          >
            Cerrar sesion
          </button>
        </div>
      </section>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section className="relative">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-slate-300 via-slate-800 to-slate-300" />
          <div className="grid md:grid-cols-[180px_minmax(0,1fr)] border-t border-slate-200">
            <div className="border-b md:border-b-0 md:border-r border-slate-200 px-5 py-6 bg-[linear-gradient(180deg,rgba(248,250,252,0.95),rgba(255,255,255,0.4))]">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                Carga
              </p>
            </div>
            <form onSubmit={handleUpload} className="px-5 py-6 space-y-6 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,250,252,0.7))]">
            <div className="grid gap-4 md:grid-cols-[220px_minmax(0,1fr)]">
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Carpeta
                </span>
                <div className="relative mt-2">
                  <select
                    value={folderOption}
                    onChange={(e) => setFolderOption(e.target.value as FolderOption)}
                    className="w-full appearance-none border border-slate-300 bg-white px-4 pr-11 py-3 text-slate-950 focus:outline-none focus:border-slate-700 shadow-[0_8px_20px_-18px_rgba(15,23,42,0.5)]"
                  >
                    {FOLDER_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-slate-500">
                    <SelectCaretIcon />
                  </span>
                </div>
              </label>

              {folderOption === "otro" && (
                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Carpeta personalizada
                  </span>
                  <input
                    type="text"
                    value={customFolder}
                    onChange={(e) => setCustomFolder(e.target.value)}
                    placeholder="ej: banners/home"
                    className="mt-2 w-full border border-slate-300 bg-white px-4 py-3 text-slate-950 focus:outline-none focus:border-slate-700 shadow-[0_8px_20px_-18px_rgba(15,23,42,0.5)]"
                  />
                </label>
              )}
            </div>

            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                Imagen
              </span>
              <label className="mt-2 block cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => void handleFileChange(e.target.files?.[0] ?? null)}
                  className="sr-only"
                  required
                />
                <div className="group border border-slate-300 bg-white px-4 py-4 transition-all hover:border-slate-500 hover:bg-slate-50 hover:shadow-[0_16px_28px_-22px_rgba(15,23,42,0.45)]">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center border border-slate-300 bg-slate-50 text-slate-700 transition-colors group-hover:border-slate-500 group-hover:bg-white">
                      <UploadFolderIcon />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-950">
                        {selectedFile ? "Cambiar imagen" : "Seleccionar imagen"}
                      </p>
                      <p className="mt-1 text-sm text-slate-600">
                        {selectedFile
                          ? selectedFile.name
                          : "Haz click para abrir el explorador y elegir un archivo."}
                      </p>
                      <p className="mt-2 text-xs uppercase tracking-[0.14em] text-slate-500">
                        JPG, PNG, HEIC o WebP
                      </p>
                    </div>
                  </div>
                </div>
              </label>
            </label>

            <div className="border-t border-dashed border-slate-300 pt-4 text-sm text-slate-600">
              <p className="text-xs uppercase tracking-[0.18em] font-semibold mb-2 text-slate-500">
                Optimizacion automatica
              </p>
              <p>
                Convierte a WebP, calidad {Math.round(WEBP_QUALITY * 100)}% y limita el lado mayor a {MAX_DIMENSION}px.
              </p>
            </div>

            <button
              type="submit"
              disabled={uploading || preparing || !preparedImage}
              className="inline-flex items-center justify-center bg-slate-950 px-6 py-3 text-white font-medium hover:bg-slate-800 transition-colors disabled:opacity-60 disabled:pointer-events-none shadow-[0_18px_36px_-24px_rgba(15,23,42,0.8)]"
            >
              {preparing ? "Optimizando..." : uploading ? "Subiendo..." : "Subir imagen"}
            </button>
            </form>
          </div>

          {error && <p className="px-5 pb-5 text-sm text-red-700">{error}</p>}
        </section>

        <aside className="h-fit">
          <div className="px-5 py-4 border-t border-b border-slate-200 bg-[linear-gradient(180deg,rgba(248,250,252,0.95),rgba(255,255,255,0.55))]">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
              Estado actual
            </p>
          </div>
          <div className="px-5 py-5 space-y-4">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between gap-3 border-b border-slate-100 pb-2">
                <span className="text-slate-500">Bucket</span>
                <span className="text-slate-950 font-medium text-right">{IMAGE_BUCKET}</span>
              </div>
              <div className="flex justify-between gap-3 border-b border-slate-100 pb-2">
                <span className="text-slate-500">Cliente</span>
                <span className="text-slate-950 font-medium text-right">{CLIENT_ID}</span>
              </div>
              <div className="flex justify-between gap-3 border-b border-slate-100 pb-2">
                <span className="text-slate-500">Usuario</span>
                <span className="text-slate-950 font-medium text-right break-all">{currentEmail}</span>
              </div>
            </div>

          {preparedImage || uploadResult ? (
            <div className="mt-6 space-y-4">
              {uploadResult && (
                <div className="border-l-2 border-emerald-500 pl-4 py-1 bg-[linear-gradient(90deg,rgba(236,253,245,0.8),transparent)]">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.14em] text-emerald-700 font-semibold mb-1">
                        Subida completada
                      </p>
                      <p className="text-sm text-slate-900">
                        Copia la URL desde aca o desde el aviso flotante.
                      </p>
                    </div>
                    <button
                      onClick={handleCopyUrl}
                      className="shrink-0 inline-flex items-center justify-center bg-slate-950 px-4 py-2 text-white text-sm font-medium hover:bg-slate-800 transition-colors"
                    >
                      {copied ? "Copiado" : "Copiar"}
                    </button>
                  </div>
                </div>
              )}

              <div className="border-t border-b border-slate-200 py-6 flex items-center justify-center min-h-[220px] bg-[linear-gradient(180deg,rgba(248,250,252,0.6),rgba(255,255,255,0.4))]">
                <img
                  src={uploadResult?.publicUrl ?? preparedImage?.previewUrl}
                  alt="Preview preparada"
                  className="max-h-[220px] w-full object-contain"
                />
              </div>

              {preparedImage && selectedFile && (
                <div className="border-t border-dashed border-slate-300 pt-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500 font-semibold mb-3">
                    Resultado de optimizacion
                  </p>
                  <div className="grid gap-2 text-sm text-slate-900">
                    <p>Original: {formatBytes(preparedImage.originalSize)}</p>
                    <p>Optimizada: {formatBytes(preparedImage.optimizedSize)}</p>
                    <p>Formato final: WebP</p>
                    <p>
                      Resolucion final: {preparedImage.width} × {preparedImage.height}
                    </p>
                    <p>
                      Ahorro: {Math.max(
                        0,
                        Math.round(
                          (1 - preparedImage.optimizedSize / preparedImage.originalSize) * 100,
                        ),
                      )}%
                    </p>
                  </div>
                </div>
              )}

              {uploadResult && (
                <>
                  <div className="border-t border-dashed border-slate-300 pt-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500 font-semibold mb-2">
                      Path interno
                    </p>
                    <p className="text-sm text-slate-900 break-all">{uploadResult.path}</p>
                  </div>

                  <div className="border-t border-dashed border-slate-300 pt-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500 font-semibold mb-2">
                      URL publica
                    </p>
                    <p className="text-sm text-slate-900 break-all">{uploadResult.publicUrl}</p>
                  </div>

                  <button
                    onClick={handleCopyUrl}
                    className="w-full inline-flex items-center justify-center bg-slate-950 px-6 py-3 text-white font-medium hover:bg-slate-800 transition-colors shadow-[0_18px_36px_-24px_rgba(15,23,42,0.8)]"
                  >
                    {copied ? "URL copiada" : "Copiar URL"}
                  </button>
                </>
              )}
            </div>
          ) : (
            <p className="mt-6 text-sm text-slate-600 leading-relaxed">
              Cuando subas una imagen, vas a ver aca la preview, la ruta interna y la URL publica para pegar directo en Sheets.
            </p>
          )}
          </div>
        </aside>
      </div>
    </main>
  );
}
