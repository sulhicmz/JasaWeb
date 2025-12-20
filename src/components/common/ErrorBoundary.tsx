import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
    children?: ReactNode;
    fallback?: ReactNode;
    className?: string;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

/**
 * React Error Boundary component
 * Prevents a single component crash from breaking the whole page.
 */
class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    };

    public static getDerivedStateFromError(error: Error): State {
        // Update state so the next render will show the fallback UI.
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className={`p-4 border border-red-200 bg-red-50 rounded-lg ${this.props.className}`}>
                    <h2 className="text-red-700 font-semibold mb-2">Terjadi kesalahan</h2>
                    <p className="text-red-600 text-sm">
                        Maaf, komponen ini gagal dimuat. Silakan coba muat ulang halaman.
                    </p>
                    {process.env.NODE_ENV === 'development' && (
                        <details className="mt-2 text-xs text-red-500 cursor-pointer">
                            <summary>Detail Error</summary>
                            <pre className="mt-1 whitespace-pre-wrap">
                                {this.state.error?.message}
                            </pre>
                        </details>
                    )}
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
