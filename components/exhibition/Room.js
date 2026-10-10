// A themed exhibition space. Themes change surfaces and accents, not the visual system.
export default function Room({ theme = "deep", className = "", children, as: Tag = "section", ...rest }) {
  return (
    <Tag className={`room theme-${theme} ${className}`} {...rest}>
      <div className="wrap">{children}</div>
    </Tag>
  );
}
