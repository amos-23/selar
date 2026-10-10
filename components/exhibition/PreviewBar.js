import { isPreview } from "@/lib/exhibition/content";

export default function PreviewBar() {
  if (!isPreview()) return null;
  return (
    <p className="preview-banner" role="note">
      Team preview: unpublished and unverified items are shown with status labels. This bar and those items do not appear on the public site.
    </p>
  );
}
