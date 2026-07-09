import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ error, errorInfo });
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', background: '#ffebee', color: '#c62828', height: '100vh', boxSizing: 'border-box' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>Something went wrong.</h1>
          <p style={{ marginTop: '10px' }}>Please copy this error message and send it back to me so I can fix the issue:</p>
          <div style={{ marginTop: '20px', padding: '15px', background: '#ffcdd2', border: '1px solid #ef5350', borderRadius: '8px', overflowX: 'auto', fontFamily: 'monospace' }}>
            <strong style={{ display: 'block', marginBottom: '10px' }}>{this.state.error && this.state.error.toString()}</strong>
            <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontSize: '12px' }}>
              {this.state.errorInfo && this.state.errorInfo.componentStack}
            </pre>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
