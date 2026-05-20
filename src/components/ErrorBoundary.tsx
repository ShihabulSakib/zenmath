import { Component, type ReactNode, type ErrorInfo } from 'react';

interface ErrorBoundaryProps {
    children: ReactNode;
    fallback?: ReactNode;
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('ErrorBoundary caught:', error, errorInfo);
        this.props.onError?.(error, errorInfo);
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="flex flex-col items-center justify-center min-h-screen bg-surface p-6">
                    <span className="material-symbols-outlined text-incorrect text-5xl mb-4" style={{ fontVariationSettings: "'FILL' 1" }}>error</span>
                    <h2 className="text-lg font-bold text-main mb-2">Something went wrong</h2>
                    <p className="text-sm text-secondary mb-6 text-center max-w-xs">
                        An unexpected error occurred. Please try refreshing the page.
                    </p>
                    <button
                        onClick={this.handleReset}
                        className="bg-primary text-on-primary font-bold px-6 py-3 rounded-xl"
                    >
                        Try Again
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}