import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Image as ImageIcon, X, Upload } from "lucide-react";
import { base44 } from "@/api/base44Client";

// Upload privado: sem URL pública, acesso segue as permissões do app.
export default function PhotoUploader({ label, value, onChange, required }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handleFile = async (file) => {
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file });
      onChange?.(file_uri);
    } catch (e) {
      setError("Falha no upload da imagem");
    } finally {
      setUploading(false);
    }
  };

  const [signedUrl, setSignedUrl] = useState(null);

  React.useEffect(() => {
    let active = true;
    if (!value) { setSignedUrl(null); return; }
    if (value.startsWith("data:")) { setSignedUrl(value); return; }
    base44.integrations.Core.CreateFileSignedUrl({ file_uri: value })
      .then(({ signed_url }) => { if (active) setSignedUrl(signed_url); })
      .catch(() => {});
    return () => { active = false; };
  }, [value]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-slate-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      </div>
      {signedUrl ? (
        <div className="relative rounded-lg overflow-hidden border border-slate-200 group">
          <img src={signedUrl} alt={label} className="w-full h-44 object-cover" />
          <button
            type="button"
            onClick={() => onChange?.(null)}
            className="absolute top-2 right-2 bg-white/90 rounded-full p-1.5 shadow hover:bg-white"
          >
            <X className="w-4 h-4 text-slate-700" />
          </button>
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center h-44 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors">
          <div className="flex flex-col items-center gap-2 text-slate-500">
            {uploading ? (
              <div className="w-6 h-6 border-2 border-slate-300 border-t-slate-700 rounded-full animate-spin" />
            ) : (
              <ImageIcon className="w-8 h-8" />
            )}
            <span className="text-sm">{uploading ? "Enviando..." : "Toque para tirar/enviar foto"}</span>
          </div>
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
        </label>
      )}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}