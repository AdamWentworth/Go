import { act, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, useLocation, useNavigate } from "react-router";
import { beforeEach, describe, expect, it } from "vitest";

import {
  ContextBackProvider,
  useContextBackHandler,
} from "@/contexts/ContextBackContext";

const BackNavigationHarness = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useContextBackHandler(true, () => {
    navigate("/raid");
    return true;
  });

  return <span>{location.pathname}</span>;
};

describe("ContextBackProvider", () => {
  beforeEach(() => {
    window.history.replaceState({}, "", "/");
  });

  it("keeps a handled back action instead of restoring the previous URL", async () => {
    render(
      <MemoryRouter initialEntries={["/raid/methodology"]}>
        <ContextBackProvider>
          <BackNavigationHarness />
        </ContextBackProvider>
      </MemoryRouter>,
    );

    expect(screen.getByText("/raid/methodology")).toBeInTheDocument();

    act(() => {
      window.dispatchEvent(new PopStateEvent("popstate"));
    });

    await waitFor(() => {
      expect(screen.getByText("/raid")).toBeInTheDocument();
    });

    await act(async () => {
      await new Promise((resolve) => window.setTimeout(resolve, 0));
    });

    expect(screen.getByText("/raid")).toBeInTheDocument();
  });
});
