type CellWiseLogoProps = {
  size?: "compact" | "regular";
};

export function CellWiseLogo({ size = "regular" }: CellWiseLogoProps) {
  return (
    <span className={`cellwise-logo ${size}`} aria-hidden="true">
      <svg viewBox="0 0 48 48" role="img">
        <path
          d="M24 5.5c3.8 0 6.9 2.1 8.5 5.1 3.4-.2 6.8 1.4 8.7 4.7 1.9 3.3 1.6 7-.3 9.8 1.9 2.8 2.2 6.5.3 9.8-1.9 3.3-5.3 4.9-8.7 4.7-1.6 3-4.7 5.1-8.5 5.1s-6.9-2.1-8.5-5.1c-3.4.2-6.8-1.4-8.7-4.7-1.9-3.3-1.6-7 .3-9.8-1.9-2.8-2.2-6.5-.3-9.8 1.9-3.3 5.3-4.9 8.7-4.7 1.6-3 4.7-5.1 8.5-5.1Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="3.6"
          strokeLinejoin="round"
        />
        <path
          d="M16.1 12.4 24 17l7.9-4.6M16.1 35.6 24 31l7.9 4.6M8.7 25.1h9.1L24 17l6.2 8.1h9.1M17.8 25.1 24 31l6.2-5.9"
          fill="none"
          stroke="currentColor"
          strokeWidth="3.1"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}
