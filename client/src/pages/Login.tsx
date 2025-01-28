import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/index.css";

export default function LoginPage(): React.JSX.Element {
  const [shouldRender, setShouldRender] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    async function checkForExistingSession() {
      try {
        const response = await fetch("/auth/validate", { method: "POST" });
        const result = await response.json();
        if (response.status === 200 && result.redirectTo) {
          return navigate(result.redirectTo);
        }
        setShouldRender(true);
      } catch (e) {
        setShouldRender(true);
      }
    }

    checkForExistingSession();
  }, [navigate]);

  return (
    <div className="container d-flex flex-column h-100 justify-content-center align-items-center">
      {shouldRender === true ? <Login /> : <div>Loading...</div>}
    </div>
  );
}

/**
 * 
 * @returns React.JSX.Element
 */
function Login() {
  return (
    <>
      <div className="row">
        <div className="text-center mb-3">
          <h1 className="display-5">Welcome to RTChat!</h1>
        </div>
      </div>
      {/*  */}
      <div className="row" style={{ maxHeight: "400px" }}>
        <div className="col mh-100">
          <div id="alert-display" className="alert d-none d-flex flex-row align-items-center justify-content-between mh-100" role="alert">
            <i></i>
            <div id="alert-message" className="mb-0 max-h-100px overf-scroll"></div>
            <button className="btn-close" type="button" data-bs-dismiss="alert">
              Close
            </button>
          </div>
        </div>
      </div>
      {/*  */}
      <div className="row w-100">
        <div className="col-lg-6 offset-lg-3">
          <div className="form-group">
            <form id="login-form">
              <div className="form-floating mb-3">
                <input id="login-email-input" className="form-control" type="text" placeholder="Email Address" required></input>
                <label className="form-label" htmlFor="login-email-input">
                  Email
                </label>
                <div className="invalid-feedback">Email is required!</div>
              </div>
              <div className="form-floating mb-3">
                <input id="login-email-input" className="form-control" type="password" placeholder="Password" required></input>
                <label className="form-label" htmlFor="login-email-input">
                  Password
                </label>
                <div className="invalid-feedback">Email is required!</div>
              </div>
              <div className="d-flex justify-content-end">
                <button id="open-create-account-modal-btn" className="btn btn-outline-secondary me-2" type="button">
                  Create Account
                </button>
                <button id="login-btn" className="btn btn-primary">
                  Login
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
