import type { ReactNode } from "react";

export function Guide({
  children,
  who,
  how,
}: {
  children: ReactNode;
  who?: ReactNode;
  how?: ReactNode;
}) {
  return (
    <div className="panel-guide">
      <p>{children}</p>
      {who ? (
        <p>
          <span className="guide-label">Qui</span> {who}
        </p>
      ) : null}
      {how ? (
        <p>
          <span className="guide-label">Comment</span> {how}
        </p>
      ) : null}
    </div>
  );
}
