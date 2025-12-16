import React, { useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { Modal, Button, Alert } from 'react-bootstrap';
import * as Yup from 'yup';
import { Formik } from 'formik';
import { useAuth } from '../../../contexts/AuthContext';

// react-bootstrap
import { Card, Row, Col } from 'react-bootstrap';

// project import
import Breadcrumb from '../../../layouts/AdminLayout/Breadcrumb';

// assets
import logoDark from '../../../assets/images/logo.png';

// ==============================|| SIGN UP 1 ||============================== //

const SignUp1 = () => {
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [error, setError] = useState('');
  const [signupData, setSignupData] = useState(null);
  const { sendOTP, verifyOTP, saveCustomerName } = useAuth();
  const navigate = useNavigate();

  // Get referral code from URL parameters
  const getReferralFromUrl = () => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('ref');
  };

  const handleSignUp = async (values) => {
    try {
      setError('');
      setSignupData(values);
      await sendOTP(`+1${values.phone}`);
      setShowOTPModal(true);
    } catch (err) {
      setError('Failed to send OTP. Please try again.');
      console.error(err);
    }
  };

  const handleVerifyOTP = async (values) => {
    try {
      setError('');
      await verifyOTP(values.otp);
      // Save customer data with full name
      await saveCustomerName(`+1${signupData.phone}`, signupData.fullName, signupData.referralCode);
      setShowOTPModal(false);
      navigate('/app/dashboard');
    } catch (err) {
      setError('Invalid OTP. Please try again.');
      console.error(err);
    }
  };

  return (
    <React.Fragment>
      <Breadcrumb />
      <div className="auth-wrapper">
        <div className="auth-content text-center">
          <Card className="borderless">
            <Row className="align-items-center text-center">
              <Col>
                <Card.Body className="card-body">
                  <img src={logoDark} alt="" className="img-fluid mb-4" />
                  <h4 className="mb-3 f-w-400">Sign up</h4>
                  <Formik
                    initialValues={{
                      fullName: '',
                      phone: '',
                      referralCode: getReferralFromUrl() || '',
                      submit: null
                    }}
                    validationSchema={Yup.object().shape({
                      fullName: Yup.string().min(2, 'Name must be at least 2 characters').required('Full name is required'),
                      phone: Yup.string()
                        .matches(/^\d{10}$/, 'Please enter a valid 10-digit mobile number')
                        .required('Mobile number is required'),
                      referralCode: Yup.string()
                        .matches(/^[A-Z0-9]{6}$/, 'Referral code must be 6 characters (letters and numbers only)')
                        .optional()
                    })}
                    onSubmit={handleSignUp}
                  >
                    {({ errors, handleBlur, handleChange, handleSubmit, isSubmitting, touched, values }) => (
                      <form noValidate onSubmit={handleSubmit}>
                        <div className="input-group mb-3">
                          <input
                            className="form-control"
                            id="fullName"
                            name="fullName"
                            onBlur={handleBlur}
                            onChange={handleChange}
                            type="text"
                            placeholder="Full Name"
                            value={values.fullName}
                          />
                          {touched.fullName && errors.fullName && <small className="text-danger form-text">{errors.fullName}</small>}
                        </div>
                        <div className="input-group mb-3">
                          <span className="input-group-text">+1</span>
                          <input
                            className="form-control"
                            id="phone"
                            name="phone"
                            onBlur={handleBlur}
                            onChange={handleChange}
                            type="tel"
                            placeholder="Enter 10-digit mobile number"
                            value={values.phone}
                          />
                          {touched.phone && errors.phone && <small className="text-danger form-text">{errors.phone}</small>}
                        </div>
                        <div className="input-group mb-3">
                          <input
                            className="form-control"
                            id="referralCode"
                            name="referralCode"
                            onBlur={handleBlur}
                            onChange={handleChange}
                            type="text"
                            placeholder="Referral Code (optional)"
                            value={values.referralCode}
                            maxLength={6}
                            style={{ textTransform: 'uppercase' }}
                          />
                          {touched.referralCode && errors.referralCode && (
                            <small className="text-danger form-text">{errors.referralCode}</small>
                          )}
                        </div>
                        <div className="custom-control custom-checkbox text-start mb-4 mt-2">
                          <input type="checkbox" className="custom-control-input" id="customCheck1" defaultChecked={false} />
                          <label className="custom-control-label mx-2" htmlFor="customCheck1">
                            Send me the <Link to="#"> Newsletter</Link> weekly.
                          </label>
                        </div>
                        {error && (
                          <Col sm={12} className="mb-3">
                            <Alert variant="danger">{error}</Alert>
                          </Col>
                        )}
                        <button className="btn btn-primary btn-block mb-4" disabled={isSubmitting} type="submit">
                          Sign up
                        </button>
                        <p className="mb-2">
                          Already have an account?{' '}
                          <NavLink to={`/auth/signin${values.referralCode ? `?ref=${values.referralCode}` : ''}`} className="f-w-400">
                            Signin
                          </NavLink>
                        </p>
                      </form>
                    )}
                  </Formik>
                </Card.Body>
              </Col>
            </Row>
          </Card>
        </div>
      </div>

      {/* OTP Verification Modal */}
      <Modal show={showOTPModal} onHide={() => setShowOTPModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Verify Your Phone Number</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Formik
            initialValues={{
              otp: '',
              submit: null
            }}
            validationSchema={Yup.object().shape({
              otp: Yup.string().length(6, 'OTP must be 6 digits').required('OTP is required')
            })}
            onSubmit={handleVerifyOTP}
          >
            {({ errors, handleBlur, handleChange, handleSubmit, isSubmitting, touched, values }) => (
              <form noValidate onSubmit={handleSubmit}>
                <div className="form-group mb-3">
                  <label htmlFor="otp">Enter OTP</label>
                  <input
                    className="form-control"
                    id="otp"
                    name="otp"
                    onBlur={handleBlur}
                    onChange={handleChange}
                    type="text"
                    placeholder="Enter 6-digit OTP"
                    value={values.otp}
                    maxLength={6}
                  />
                  {touched.otp && errors.otp && <small className="text-danger form-text">{errors.otp}</small>}
                </div>
                {error && (
                  <Col sm={12} className="mb-3">
                    <Alert variant="danger">{error}</Alert>
                  </Col>
                )}
                <div className="d-flex justify-content-between">
                  <Button variant="secondary" onClick={() => setShowOTPModal(false)}>
                    Cancel
                  </Button>
                  <Button variant="primary" disabled={isSubmitting} type="submit">
                    Verify OTP
                  </Button>
                </div>
              </form>
            )}
          </Formik>
        </Modal.Body>
      </Modal>
    </React.Fragment>
  );
};

export default SignUp1;
