import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { defaultContent } from "../data/defaultContent";
import { api } from "../lib/api";
import type { SiteContent } from "../types";

interface SiteContentState {
  content: SiteContent;
  loading: boolean;
  refresh: () => Promise<void>;
}

const SiteContentContext = createContext<SiteContentState | null>(null);

export function SiteContentProvider({ children }: { children: ReactNode }) {
  const [content, setContent] = useState<SiteContent>(defaultContent);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    try {
      setContent(await api.getContent());
    } catch {
      setContent(defaultContent);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  useEffect(() => {
    const brandName = content.brandName.trim() || defaultContent.brandName;
    document.title = `${brandName}｜山东校园代理招募`;
    document
      .querySelector('meta[name="description"]')
      ?.setAttribute("content", `${brandName}面向山东高校，连接真实校园需求与可靠服务，招募愿意共创校园价值的学生代理。`);
  }, [content.brandName]);

  const value = useMemo(() => ({ content, loading, refresh }), [content, loading]);
  return <SiteContentContext.Provider value={value}>{children}</SiteContentContext.Provider>;
}

export function useSiteContent() {
  const context = useContext(SiteContentContext);
  if (!context) throw new Error("useSiteContent must be used within SiteContentProvider");
  return context;
}
