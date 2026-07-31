import type { PrismTheme } from "prism-react-renderer"

export const conceptMasterPrismTheme: PrismTheme = {
  plain: { color: "var(--c-txt)", backgroundColor: "transparent" },
  styles: [
    { types: ["comment", "prolog", "doctype", "cdata"], style: { color: "var(--c-com)", fontStyle: "italic" } },
    { types: ["keyword", "operator", "tag", "bold", "important", "atrule"], style: { color: "var(--c-kw)" } },
    { types: ["string", "char", "attr-value", "regex", "url"], style: { color: "var(--c-str)" } },
    { types: ["number", "boolean", "constant", "symbol", "deleted", "inserted"], style: { color: "var(--c-num)" } },
    { types: ["function", "class-name", "decorator", "builtin", "attr-name"], style: { color: "var(--c-fn)" } },
    { types: ["punctuation", "plain"], style: { color: "var(--c-txt)" } },
  ],
}
