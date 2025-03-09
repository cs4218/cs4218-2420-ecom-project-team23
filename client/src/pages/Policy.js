import React from "react";
import Layout from "../components/Layout";

const Policy = () => {
  return (
    <Layout title={"Privacy Policy"}>
      <div className="row privacy-policy">
        <div className="col-md-6 ">
          <img
            src="/images/policy.jpeg"
            alt="policy"
            style={{ width: "100%" }}
          />
        </div>
        <div className="col-md-5">
          <h1 className="bg-dark p-2 text-white text-center">PRIVACY POLICY</h1>
          <p>
            1. Our website uses cookies to improve user experience. You can
            disable cookies through your browser settings.
          </p>
          <p>
            2. We do not store credit card details nor do we share customer
            details with any 3rd parties.
          </p>
          <p>
            3.We may update this privacy policy from time to time. Any changes
            will be posted on this page.
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default Policy;
