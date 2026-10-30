import React from "react";
import PropTypes from "prop-types";
import { Result, Button } from "antd";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an unhandled error:", error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex orientation-center items-center justify-center p-6">
          <div className="bg-card border border-border rounded-2xl shadow-lg p-8 max-w-lg w-full text-center">
            <Result
              status="500"
              title={<span className="text-navy font-bold text-2xl">Something went wrong</span>}
              subTitle={
                <span className="text-text text-sm">
                  {this.state.error?.message ||
                    "An unexpected application error occurred. You can reload the page or return to the home screen."}
                </span>
              }
              extra={[
                <Button
                  type="primary"
                  key="reload"
                  onClick={this.handleReload}
                  className="bg-primary hover:bg-secondary font-semibold rounded-lg"
                >
                  Reload Page
                </Button>,
                <Button
                  key="home"
                  onClick={this.handleGoHome}
                  className="border-border text-navy font-semibold rounded-lg hover:border-primary hover:text-primary"
                >
                  Return Home
                </Button>,
              ]}
            />
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
};

export default ErrorBoundary;

