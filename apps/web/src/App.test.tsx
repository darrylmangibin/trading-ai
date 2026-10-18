import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StrictMode } from "react";
import App from "./App";

const healthy = { status: "ok", service: "trading-api" };
const help = "Start the backend, then check the connection again.";
const fetchMock = jest.fn<typeof fetch>();
const originalFetch = Object.getOwnPropertyDescriptor(globalThis, "fetch");

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;

    reject = rejectPromise;
  });

  return { promise, resolve, reject };
}

function responseWithBody(json: () => Promise<unknown>, ok = true): Response {
  // Only the HTTP status and JSON body are consumed at this boundary.
  return { ok, json } as Response;
}

function jsonResponse(body: unknown, ok = true) {
  const json = jest.fn<() => Promise<unknown>>().mockResolvedValue(body);

  return { response: responseWithBody(json, ok), json };
}

function pendingRequest() {
  const result = deferred<Response>();
  let signal: AbortSignal | null | undefined;
  const abort = jest.fn(() => {
    result.reject(new DOMException("The request was aborted", "AbortError"));
  });
  const handle: typeof fetch = (_input, init) => {
    signal = init?.signal;

    if (!signal) throw new Error("The health request must support cancellation");

    signal.addEventListener("abort", abort, { once: true });

    if (signal.aborted) abort();

    return result.promise.finally(() => {
      signal?.removeEventListener("abort", abort);
    });
  };

  return { ...result, handle, abort, getSignal: () => signal };
}

function expectUnavailable() {
  expect(screen.getByRole("status")).toHaveTextContent(/^Unable to connect$/);

  expect(screen.getByRole("button", { name: "Check again" })).toBeEnabled();

  expect(screen.getByText(help)).toBeVisible();

  expect(jest.getTimerCount()).toBe(0);
}

beforeEach(() => {
  // Keep React's scheduling microtasks real while controlling request deadlines.
  jest.useFakeTimers({ doNotFake: ["queueMicrotask"] });

  fetchMock.mockReset();

  fetchMock.mockRejectedValue(new Error("Unexpected health request"));

  Object.defineProperty(globalThis, "fetch", {
    configurable: true,
    writable: true,
    value: fetchMock,
  });
});

afterEach(async () => {
  // RTL unmounts first, while requests and timers are still controlled.
  await act(async () => {
    await jest.runOnlyPendingTimersAsync();
  });

  jest.useRealTimers();

  jest.restoreAllMocks();

  if (originalFetch) {
    Object.defineProperty(globalThis, "fetch", originalFetch);
  } else {
    Reflect.deleteProperty(globalThis, "fetch");
  }
});

describe("API connection", () => {
  it("shows checking and prevents another request while the check is pending", async () => {
    const request = pendingRequest();
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

    fetchMock.mockImplementationOnce(request.handle);

    render(<App />);

    const retry = screen.getByRole("button", { name: "Check again" });

    expect(screen.getByRole("status")).toHaveTextContent(/^Checking connection\.\.\.$/);

    expect(retry).toBeDisabled();

    expect(screen.queryByText(help)).not.toBeInTheDocument();

    expect(fetchMock).toHaveBeenCalledWith("/api/health", { signal: request.getSignal() });

    expect(request.getSignal()?.aborted).toBe(false);

    await user.click(retry);

    expect(fetchMock).toHaveBeenCalledTimes(1);

    expect(screen.getByRole("status")).toHaveTextContent(/^Checking connection\.\.\.$/);
  });

  it("shows connected for valid health JSON and clears the request deadline", async () => {
    const request = pendingRequest();
    const { response, json } = jsonResponse(healthy);

    fetchMock.mockImplementationOnce(request.handle);

    render(<App />);

    await act(async () => {
      request.resolve(response);
    });

    expect(screen.getByRole("status")).toHaveTextContent(/^Connected$/);

    expect(screen.getByRole("button", { name: "Check again" })).toBeEnabled();

    expect(screen.queryByText(help)).not.toBeInTheDocument();

    expect(json).toHaveBeenCalledTimes(1);

    expect(jest.getTimerCount()).toBe(0);

    await act(async () => {
      await jest.advanceTimersByTimeAsync(5000);
    });

    expect(request.getSignal()?.aborted).toBe(false);

    expect(screen.getByRole("status")).toHaveTextContent(/^Connected$/);
  });

  it("shows unavailable for a non-OK response without reading its body", async () => {
    const { response, json } = jsonResponse(healthy, false);

    fetchMock.mockResolvedValueOnce(response);

    await act(async () => {
      render(<App />);
    });

    expectUnavailable();

    expect(json).not.toHaveBeenCalled();
  });

  it("shows unavailable when the response contains malformed JSON", async () => {
    const json = jest
      .fn<() => Promise<unknown>>()
      .mockRejectedValue(new SyntaxError("Invalid JSON"));

    fetchMock.mockResolvedValueOnce(responseWithBody(json));

    await act(async () => {
      render(<App />);
    });

    expectUnavailable();

    expect(json).toHaveBeenCalledTimes(1);
  });

  it.each([
    { name: "null", body: null },
    { name: "an empty object", body: {} },
    { name: "a wrong status", body: { status: "unavailable", service: "trading-api" } },
    { name: "a wrong service", body: { status: "ok", service: "other-api" } },
    { name: "a missing service", body: { status: "ok" } },
    { name: "a missing status", body: { service: "trading-api" } },
    { name: "a string", body: "ok" },
    { name: "an array", body: [] },
  ])("shows unavailable for $name in the health response", async ({ body }) => {
    const { response } = jsonResponse(body);

    fetchMock.mockResolvedValueOnce(response);

    await act(async () => {
      render(<App />);
    });

    expectUnavailable();
  });

  it("shows unavailable when the network request fails", async () => {
    const request = pendingRequest();

    fetchMock.mockImplementationOnce(request.handle);

    render(<App />);

    await act(async () => {
      request.reject(new TypeError("Network failure"));
    });

    expectUnavailable();

    await act(async () => {
      await jest.advanceTimersByTimeAsync(5000);
    });

    expect(request.getSignal()?.aborted).toBe(false);

    expectUnavailable();
  });

  it("checks again after failure and removes the help when retry succeeds", async () => {
    const first = pendingRequest();
    const retryRequest = pendingRequest();
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const { response } = jsonResponse(healthy);

    fetchMock.mockImplementationOnce(first.handle).mockImplementationOnce(retryRequest.handle);

    render(<App />);

    await act(async () => {
      first.reject(new TypeError("Offline"));
    });

    expectUnavailable();

    await user.click(screen.getByRole("button", { name: "Check again" }));

    expect(screen.getByRole("status")).toHaveTextContent(/^Checking connection\.\.\.$/);

    expect(screen.getByRole("button", { name: "Check again" })).toBeDisabled();

    expect(screen.queryByText(help)).not.toBeInTheDocument();

    expect(first.getSignal()?.aborted).toBe(true);

    expect(retryRequest.getSignal()?.aborted).toBe(false);

    expect(fetchMock).toHaveBeenCalledTimes(2);

    await act(async () => {
      retryRequest.resolve(response);
    });

    expect(screen.getByRole("status")).toHaveTextContent(/^Connected$/);

    expect(screen.getByRole("button", { name: "Check again" })).toBeEnabled();

    expect(screen.queryByText(help)).not.toBeInTheDocument();

    expect(jest.getTimerCount()).toBe(0);
  });

  it("keeps checking before five seconds and aborts at the deadline", async () => {
    const request = pendingRequest();

    fetchMock.mockImplementationOnce(request.handle);

    render(<App />);

    await act(async () => {
      await jest.advanceTimersByTimeAsync(4999);
    });

    expect(screen.getByRole("status")).toHaveTextContent(/^Checking connection\.\.\.$/);

    expect(screen.getByRole("button", { name: "Check again" })).toBeDisabled();

    expect(request.getSignal()?.aborted).toBe(false);

    expect(request.abort).not.toHaveBeenCalled();

    await act(async () => {
      await jest.advanceTimersByTimeAsync(1);
    });

    expect(request.getSignal()?.aborted).toBe(true);

    expect(request.abort).toHaveBeenCalledTimes(1);

    expectUnavailable();
  });

  it("can recover on a manual retry after a timeout", async () => {
    const first = pendingRequest();
    const retryRequest = pendingRequest();
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const { response } = jsonResponse(healthy);

    fetchMock.mockImplementationOnce(first.handle).mockImplementationOnce(retryRequest.handle);

    render(<App />);

    await act(async () => {
      await jest.advanceTimersByTimeAsync(5000);
    });

    expectUnavailable();

    await user.click(screen.getByRole("button", { name: "Check again" }));

    expect(screen.getByRole("status")).toHaveTextContent(/^Checking connection\.\.\.$/);

    expect(retryRequest.getSignal()?.aborted).toBe(false);

    await act(async () => {
      retryRequest.resolve(response);
    });

    expect(screen.getByRole("status")).toHaveTextContent(/^Connected$/);

    expect(screen.queryByText(help)).not.toBeInTheDocument();

    expect(jest.getTimerCount()).toBe(0);
  });

  it("cancels a pending request and clears its deadline on unmount", async () => {
    const request = pendingRequest();

    fetchMock.mockImplementationOnce(request.handle);

    const { unmount } = render(<App />);

    expect(jest.getTimerCount()).toBe(1);

    unmount();

    expect(request.getSignal()?.aborted).toBe(true);

    expect(request.abort).toHaveBeenCalledTimes(1);

    expect(jest.getTimerCount()).toBe(0);

    expect(screen.queryByRole("status")).not.toBeInTheDocument();

    await act(async () => {
      await jest.advanceTimersByTimeAsync(5000);
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);

    expect(request.abort).toHaveBeenCalledTimes(1);

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
});

describe("StrictMode request cleanup", () => {
  it("ignores the cancelled setup request and keeps the active request until its own deadline", async () => {
    const obsolete = pendingRequest();
    const current = pendingRequest();

    fetchMock.mockImplementationOnce(obsolete.handle).mockImplementationOnce(current.handle);

    await act(async () => {
      render(
        <StrictMode>
          <App />
        </StrictMode>,
      );
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);

    expect(obsolete.getSignal()?.aborted).toBe(true);

    expect(obsolete.abort).toHaveBeenCalledTimes(1);

    expect(current.getSignal()?.aborted).toBe(false);

    expect(screen.getByRole("status")).toHaveTextContent(/^Checking connection\.\.\.$/);

    expect(screen.getByRole("button", { name: "Check again" })).toBeDisabled();

    expect(jest.getTimerCount()).toBe(1);

    await act(async () => {
      await jest.advanceTimersByTimeAsync(4999);
    });

    expect(current.getSignal()?.aborted).toBe(false);

    expect(screen.getByRole("status")).toHaveTextContent(/^Checking connection\.\.\.$/);

    await act(async () => {
      await jest.advanceTimersByTimeAsync(1);
    });

    expect(current.getSignal()?.aborted).toBe(true);

    expect(current.abort).toHaveBeenCalledTimes(1);

    expectUnavailable();
  });

  it("keeps checking when an obsolete response body succeeds", async () => {
    // Headers are already delivered; late body completion must still respect cleanup.
    const obsoleteBody = deferred<unknown>();
    const obsoleteJson = jest.fn<() => Promise<unknown>>(() => obsoleteBody.promise);
    const current = pendingRequest();

    fetchMock
      .mockResolvedValueOnce(responseWithBody(obsoleteJson))
      .mockImplementationOnce(current.handle);

    await act(async () => {
      render(
        <StrictMode>
          <App />
        </StrictMode>,
      );
    });

    expect(obsoleteJson).toHaveBeenCalledTimes(1);

    expect(fetchMock.mock.calls[0]?.[1]?.signal?.aborted).toBe(true);

    await act(async () => {
      obsoleteBody.resolve(healthy);
    });

    expect(screen.getByRole("status")).toHaveTextContent(/^Checking connection\.\.\.$/);

    expect(screen.getByRole("button", { name: "Check again" })).toBeDisabled();

    expect(current.getSignal()?.aborted).toBe(false);

    expect(jest.getTimerCount()).toBe(1);

    await act(async () => {
      current.resolve(jsonResponse(null, false).response);
    });

    expectUnavailable();
  });

  it("keeps unavailable when an obsolete response body succeeds later", async () => {
    const obsoleteBody = deferred<unknown>();
    const obsoleteJson = jest.fn<() => Promise<unknown>>(() => obsoleteBody.promise);

    fetchMock
      .mockResolvedValueOnce(responseWithBody(obsoleteJson))
      .mockResolvedValueOnce(jsonResponse(null, false).response);

    await act(async () => {
      render(
        <StrictMode>
          <App />
        </StrictMode>,
      );
    });

    expect(obsoleteJson).toHaveBeenCalledTimes(1);

    expectUnavailable();

    await act(async () => {
      obsoleteBody.resolve(healthy);
    });

    expectUnavailable();
  });

  it("keeps connected when an obsolete response body fails later", async () => {
    const obsoleteBody = deferred<unknown>();
    const obsoleteJson = jest.fn<() => Promise<unknown>>(() => obsoleteBody.promise);

    fetchMock
      .mockResolvedValueOnce(responseWithBody(obsoleteJson))
      .mockResolvedValueOnce(jsonResponse(healthy).response);

    await act(async () => {
      render(
        <StrictMode>
          <App />
        </StrictMode>,
      );
    });

    expect(obsoleteJson).toHaveBeenCalledTimes(1);

    expect(screen.getByRole("status")).toHaveTextContent(/^Connected$/);

    await act(async () => {
      obsoleteBody.reject(new SyntaxError("Obsolete body failure"));
    });

    expect(screen.getByRole("status")).toHaveTextContent(/^Connected$/);

    expect(screen.getByRole("button", { name: "Check again" })).toBeEnabled();

    expect(screen.queryByText(help)).not.toBeInTheDocument();

    expect(jest.getTimerCount()).toBe(0);
  });
});
