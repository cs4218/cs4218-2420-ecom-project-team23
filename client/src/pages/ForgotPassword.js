import React from "react";
import { Link } from "react-router-dom";
import Layout from "./../components/Layout";

const ForgotPassword = () => {
  return (
    <Layout title={"go back - coming soon!"}>
      <div className="pnf">
        <h1 className="pnf-title">Coming Soon!</h1>
        <h2 className="pnf-heading">
          Forgot Password Function is coming soon!
        </h2>
        <Link to="/" className="pnf-btn">
          Go Back
        </Link>
      </div>
    </Layout>
  );
};

export default ForgotPassword;
