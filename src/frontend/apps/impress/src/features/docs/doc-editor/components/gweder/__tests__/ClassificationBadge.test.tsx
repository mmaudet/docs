import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ClassificationBadge } from "../ClassificationBadge";

describe("ClassificationBadge", () => {
  it("renders the current classification", () => {
    render(<ClassificationBadge value="PUBLIC" onChange={vi.fn()} />);
    expect(screen.getByText("PUBLIC")).toBeInTheDocument();
  });

  it("renders with correct label for CONFIDENTIEL", () => {
    render(<ClassificationBadge value="CONFIDENTIEL" onChange={vi.fn()} />);
    expect(screen.getByText(/CONFID/)).toBeInTheDocument();
  });

  it("shows dropdown on click", () => {
    render(<ClassificationBadge value="PUBLIC" onChange={vi.fn()} />);
    fireEvent.click(screen.getByRole("button"));
    expect(screen.getByText("RESTREINT")).toBeInTheDocument();
    expect(screen.getByText("CONFIDENTIEL")).toBeInTheDocument();
    expect(screen.getByText("SECRET")).toBeInTheDocument();
  });

  it("calls onChange when a level is selected", () => {
    const onChange = vi.fn();
    render(<ClassificationBadge value="PUBLIC" onChange={onChange} />);
    fireEvent.click(screen.getByRole("button"));
    fireEvent.click(screen.getByText("SECRET"));
    expect(onChange).toHaveBeenCalledWith("SECRET");
  });
});
