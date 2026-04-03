import React from 'react';

type ErrorBoundaryProps = {
  children: React.ReactNode;
  title?: string;
  message?: string;
};

type ErrorBoundaryState = {
  hasError: boolean;
};

export default class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    hasError: false,
  };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Dashboard error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <section className="rounded-3xl border border-rose-300/20 bg-rose-500/10 p-5 text-sm text-rose-100">
          <p className="font-semibold text-white">{this.props.title ?? 'Dashboard unavailable'}</p>
          <p className="mt-2">{this.props.message ?? 'Something went wrong while rendering this section. Refresh and try again.'}</p>
        </section>
      );
    }

    return this.props.children;
  }
}
