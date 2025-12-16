import React from 'react';
import { NavLink } from 'react-router-dom';

// react-bootstrap
import { Card } from 'react-bootstrap';

// third party

// project import
import Breadcrumb from '../../../layouts/AdminLayout/Breadcrumb';
import PhoneLogin from './PhoneLogin';

// assets
import logoDark from '../../../assets/images/logo.png';

// ==============================|| SIGN IN 1 ||============================== //

const Signin1 = () => {
  return (
    <React.Fragment>
      <Breadcrumb />
      <div className="auth-wrapper">
        <div className="auth-content">
          <div className="auth-bg">
            <span className="r" />
            <span className="r s" />
            <span className="r s" />
            <span className="r" />
          </div>
          <Card className="borderless text-center">
            <Card.Body>
              <img src={logoDark} alt="" className="img-fluid mb-4" />
              <PhoneLogin />
              <p className="mb-0 text-muted">
                Don’t have an account?{' '}
                <NavLink to="/auth/signup" className="f-w-400">
                  Signup
                </NavLink>
              </p>
            </Card.Body>
          </Card>
        </div>
      </div>
    </React.Fragment>
  );
};

export default Signin1;
