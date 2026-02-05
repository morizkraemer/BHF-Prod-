import { Component } from 'react';

export default class ErrorBoundary extends Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            padding: 24,
            maxWidth: 480,
            margin: '24px auto',
            background: '#ffe0e0',
            borderRadius: 8,
            color: '#c00',
          }}
        >
          <h2 style={{ marginTop: 0 }}>Fehler</h2>
          <p>
            {this.state.error?.message || 'Backend nicht erreichbar oder unerwarteter Fehler.'}
          </p>
          <button type="button" onClick={this.handleRetry}>
            Seite neu laden
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
