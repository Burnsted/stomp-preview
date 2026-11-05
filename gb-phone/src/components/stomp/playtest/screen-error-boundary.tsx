/**
 * Per-screen error boundary — blank/crash surfaces recover without killing the shell.
 */
import { Component, type ErrorInfo, type ReactNode } from "react";
import { useStomp } from "@/lib/stomp/store";
import { resetDemoLocal } from "@/lib/stomp/playtest/reset-demo";

type Props = {
  children: ReactNode;
  label?: string;
};

type State = { error: Error | null };

export class ScreenErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    try {
      console.warn("[playtest] screen error", this.props.label, error.message, info.componentStack);
    } catch {
      /* ignore */
    }
  }

  private recoverHome = () => {
    this.setState({ error: null });
    try {
      useStomp.getState().setScreen("greet");
    } catch {
      /* ignore */
    }
  };

  private recoverReset = () => {
    try {
      resetDemoLocal();
    } catch {
      /* ignore */
    }
    this.setState({ error: null });
  };

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div
        data-testid="screen-error-boundary"
        className="flex min-h-[50dvh] flex-col items-center justify-center gap-3 px-6 py-16 text-center"
      >
        <p className="font-display text-2xl tracking-wide text-ink">That screen hiccuped</p>
        <p className="max-w-sm text-sm text-muted">
          Demo recovered. Nothing left this phone. You can go Home or Reset Demo.
        </p>
        <p className="max-w-sm break-words text-xs text-muted/80">
          {this.state.error.message || "Unexpected render error"}
        </p>
        <div className="mt-2 flex flex-wrap justify-center gap-2">
          <button
            type="button"
            data-testid="error-go-home"
            onClick={this.recoverHome}
            className="h-11 rounded-full bg-ink px-5 text-sm font-semibold text-snow"
          >
            Back to Home
          </button>
          <button
            type="button"
            data-testid="error-reset-demo"
            onClick={this.recoverReset}
            className="h-11 rounded-full bg-snow px-5 text-sm font-semibold text-ink ring-1 ring-line"
          >
            Reset Demo
          </button>
        </div>
      </div>
    );
  }
}
