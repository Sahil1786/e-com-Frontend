import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";

export default function StoreLogo({ logoUrl, className = "" }) {
  const [failed, setFailed] = useState(false);

  useEffect(() => setFailed(false), [logoUrl]);

  return (
    <span className={className}>
      {logoUrl && !failed ? (
        <img
          src={logoUrl}
          alt=""
          className="h-full w-full object-contain"
          onError={() => setFailed(true)}
        />
      ) : (
        <Sparkles size={18} />
      )}
    </span>
  );
}
