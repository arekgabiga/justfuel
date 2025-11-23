import { describe, it, expect } from "vitest";

describe("Example Unit Test", () => {
  it("should pass", () => {
    expect(true).toBe(true);
  });

  it("should support custom matchers", () => {
    document.body.innerHTML = '<div id="test">Hello</div>';
    const element = document.getElementById("test");
    expect(element).toBeInTheDocument();
    expect(element).toHaveTextContent("Hello");
  });
});
