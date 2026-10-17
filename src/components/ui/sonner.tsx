"use client"

import { useEffect, useState } from "react"
import { Toaster as Sonner, ToasterProps } from "sonner"

/**
 * অ্যাপ next-themes প্রোভাইডার ব্যবহার করে না — ডার্ক মোড হাতে-করা `.dark`
 * ক্লাসে চলে (documentElement, key: bwp-theme — app-header টগল করে, layout.tsx-এর
 * pre-hydration স্ক্রিপ্ট ফ্ল্যাশ আটকায়)। তাই useTheme-এর বদলে MutationObserver
 * দিয়ে ক্লাস পর্যবেক্ষণ করে সনারের theme প্রপ হাতে সিঙ্ক করা হয়।
 */
function useHtmlTheme(): "dark" | "light" {
  const [theme, setTheme] = useState<"dark" | "light">(() =>
    typeof document !== "undefined" && document.documentElement.classList.contains("dark")
      ? "dark"
      : "light",
  )

  useEffect(() => {
    const root = document.documentElement
    const sync = () => setTheme(root.classList.contains("dark") ? "dark" : "light")
    sync()
    const obs = new MutationObserver(sync)
    obs.observe(root, { attributes: true, attributeFilter: ["class"] })
    return () => obs.disconnect()
  }, [])

  return theme
}

const Toaster = ({ ...props }: ToasterProps) => {
  const theme = useHtmlTheme()

  return (
    <Sonner
      theme={theme}
      className="toaster group"
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
