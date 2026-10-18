import { useEffect, useState } from "react";
import "./App.css";

type Connection = "checking" | "connected" | "unavailable";

const connectionLabels: Record<Connection, string> = {
  checking: "Checking connection...",
  connected: "Connected",
  unavailable: "Unable to connect",
};

function App() {
  const [connection, setConnection] = useState<Connection>("checking");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    const timeout = window.setTimeout(() => controller.abort(), 5000);

    async function checkConnection() {
      try {
        const response = await fetch("/api/health", {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Health check failed");
        }

        const health = await response.json();

        if (health.status !== "ok" || health.service !== "trading-api") {
          throw new Error("Unexpected health response");
        }

        if (active) setConnection("connected");
      } catch {
        if (active) setConnection("unavailable");
      } finally {
        window.clearTimeout(timeout);
      }
    }

    void checkConnection();

    return () => {
      active = false;

      controller.abort();

      window.clearTimeout(timeout);
    };
  }, [attempt]);

  return (
    <main className="workspace">
      <p className="eyebrow">Forex AI Trade Assistant</p>
      <h1>Your workspace is ready.</h1>
      <p className="intro">A starting point for your trading analysis and approval workspace.</p>

      <section className="connection" aria-label="API connection">
        <div>
          <h2>API connection</h2>
          <p className={`status status--${connection}`} role="status">
            <span className="status-dot" aria-hidden="true" />
            {connectionLabels[connection]}
          </p>
        </div>
        <button
          type="button"
          disabled={connection === "checking"}
          onClick={() => {
            setConnection("checking");

            setAttempt((value) => value + 1);
          }}
        >
          Check again
        </button>
      </section>

      {connection === "unavailable" ? (
        <p className="connection-help">Start the backend, then check the connection again.</p>
      ) : null}
    </main>
  );
}

export default App;
