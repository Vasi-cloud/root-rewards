const TRADEMARK_SEARCH_URL = "https://www.gov.uk/search-for-trademark";

/** UK trademark registration number → IPO search (opens in a new tab). */
export function TrademarkRegLink({
  className = "font-medium underline-offset-2 hover:underline",
}: {
  className?: string;
}) {
  return (
    <a
      href={TRADEMARK_SEARCH_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
    >
      UK00004226296
    </a>
  );
}
