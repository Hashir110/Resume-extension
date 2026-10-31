import { describe, expect, it } from "vitest";
import { parseHtml } from "../../test-utils";
import { rozeeAdapter } from "./rozee";

const URL = "https://www.rozee.pk/senior-full-stack-developer-remote-contractual-hr214-pk-karachi-jobs-1894839";

describe("rozeeAdapter", () => {
  it("matches rozee.pk URLs only", () => {
    expect(rozeeAdapter.canHandle(URL)).toBe(true);
    expect(rozeeAdapter.canHandle("https://www.linkedin.com/jobs/view/1")).toBe(false);
  });

  // Real markup shape as served today: title/company text is nested inside
  // a <bdi>, and the description lives in the #jbDetail tab pane — not
  // inside any <main> element (rozee's pages don't have one at all), which
  // is exactly what broke extraction before this fix.
  it("extracts title, company, and description from the current rozee.pk layout", () => {
    const doc = parseHtml(`
      <h1 class="jtitle font24 text-dark"><bdi>Senior Full Stack Developer (Remote, Contractual) [HR214] PK</bdi></h1>
      <h2 class="cname im1 font18 mr5 text-dark">
        <a class="text-dark" href="javascript:;"><bdi>Smart Working Solutions</bdi></a>
      </h2>
      <div class="tab-pane fade show active" id="jbDetail" role="tabpanel">
        <div class="jblk ul18">
          <div dir="ltr">
            <p>Smart Working is seeking a Senior Full-Stack Developer with over 8 years of experience.</p>
          </div>
        </div>
      </div>
    `);

    const result = rozeeAdapter.extractJob(doc, URL);
    expect(result?.title).toBe("Senior Full Stack Developer (Remote, Contractual) [HR214] PK");
    expect(result?.company).toBe("Smart Working Solutions");
    expect(result?.description).toContain("Senior Full-Stack Developer");
  });

  it("returns null when no description container exists at all (no #jbDetail, no main)", () => {
    const doc = parseHtml(`<h1 class="jtitle">Some Job</h1>`);
    expect(rozeeAdapter.extractJob(doc, URL)).toBeNull();
  });

  it("does not throw on a malformed/empty document", () => {
    const doc = parseHtml("");
    expect(() => rozeeAdapter.extractJob(doc, URL)).not.toThrow();
    expect(rozeeAdapter.extractJob(doc, URL)).toBeNull();
  });
});
