import { U2G_PORTAL_URL } from "../app-config";
import "./u2g-portal-link.css";

export default function U2GPortalLink() {
  return (
    <a
      className="u2g-portal-link"
      href={U2G_PORTAL_URL}
      aria-label="返回 U2G智慧养老"
    >
      返回 U2G智慧养老
    </a>
  );
}
