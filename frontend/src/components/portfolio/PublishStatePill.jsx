import './portfolioDialogs.css';
/**
 * Live / Draft pill (editor toolbar and portfolio cards).
 * `dirty` = there are local edits not yet saved, so they can't be live either.
 */
export default function PublishStatePill({ publishing, dirty = false }) {
  if (!publishing?.published) return <span className="pf-pill">Draft</span>;
  if (publishing.hasUnpublishedChanges || dirty) {
    return (
      <span className="pf-pill pf-pill--changes" title="Your latest edits aren’t live yet - click Publish to update the site">
        Live · unpublished changes
      </span>
    );
  }
  return <span className="pf-pill pf-pill--live">Live</span>;
}
