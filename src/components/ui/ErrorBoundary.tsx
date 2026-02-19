import React, { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RefreshCcw } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4 animate-in fade-in zoom-in-95 duration-300">
          <div className="max-w-md w-full bg-surface border border-red-500/20 rounded-2xl p-8 shadow-2xl text-center">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="text-red-500" size={32} />
            </div>
            
            <h1 className="text-2xl font-black text-text-main mb-2">Algo salió mal</h1>
            <p className="text-text-muted mb-6">
              Ha ocurrido un error inesperado en la aplicación. No te preocupes, tus datos están seguros.
            </p>

            <div className="bg-background/50 rounded-lg p-3 mb-6 border border-border text-left overflow-auto max-h-32">
                 <code className="text-xs text-red-400 font-mono break-all">
                    {this.state.error?.message}
                 </code>
            </div>

            <button
              onClick={() => window.location.reload()}
              className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-bold transition-all duration-200 shadow-lg shadow-primary-600/20"
            >
              <RefreshCcw size={18} />
              Recargar Aplicación
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
