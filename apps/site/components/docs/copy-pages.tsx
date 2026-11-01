import { CopyButton } from "@reuse-sh/interactions/react";
import { basicCode } from "./basic-code";
import { ExampleCode } from "./parts";

const command = "npm install @reuse-sh/interactions";
const link = "https://prints.example/coral-sky";

export function CopyCodeBlock() {
  const [js, react] = basicCode.codeBlock;
  return (
    <>
      <div className="x-copy-code re-card re-card-code re-shadow-ring-sm">
        <pre className="x-copy-pre">
          <code>
            <span className="x-copy-prompt" aria-hidden="true">
              ${" "}
            </span>
            {command}
          </code>
        </pre>
        <CopyButton
          text={command}
          className="c-copy c-copy-icon"
          aria-label="Copy command"
        />
      </div>
      <ExampleCode js={js} react={react} />
    </>
  );
}

export function CopyShareLink() {
  const [js, react] = basicCode.shareLink;
  return (
    <>
      <div className="x-share re-card re-shadow-ring-md">
        <p className="x-share-title">Share Coral sky</p>
        <p className="x-share-text">
          Anyone with the link can see the print and order a proof.
        </p>
        <div className="x-share-row">
          <input
            className="x-share-url"
            value={link}
            readOnly
            aria-label="Link to the print"
          />
          <CopyButton text={link} className="c-copy">
            Copy link
          </CopyButton>
        </div>
      </div>
      <ExampleCode js={js} react={react} />
    </>
  );
}
