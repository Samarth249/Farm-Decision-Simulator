import { StrictMode, Component } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("AgriSim Error Boundary caught error:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
          <div className="bg-white border border-slate-200 shadow-md rounded-2xl p-6 max-w-md text-center">
            <span className="material-symbols-outlined text-amber-500 text-4xl mb-2">warning</span>
            <h2 className="text-lg font-bold text-slate-800 mb-2">Application View Error</h2>
            <p className="text-xs text-slate-600 mb-4">{this.state.error?.message || "An error occurred rendering this page."}</p>
            <button onClick={() => window.location.href = '/'} className="px-4 py-2 bg-emerald-600 text-white font-semibold text-xs rounded-xl hover:bg-emerald-700 cursor-pointer">Return to Dashboard</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
