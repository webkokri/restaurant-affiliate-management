import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Row, Col, Alert, Button } from 'react-bootstrap';
import * as Yup from 'yup';
import { Formik } from 'formik';
import { useAuth } from '../../../contexts/AuthContext';

const PhoneLogin = () => {
  const [step, setStep] = useState('phone'); // 'phone', 'otp', or 'name'
  const [error, setError] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const { sendOTP, verifyOTP, saveCustomerName } = useAuth();
  const navigate = useNavigate();

  const handleSendOTP = async (values) => {
    try {
      setError('');
      setPhoneNumber(`+1${values.phone}`);
      // Store form values for later use in name step
      console.log('PhoneLogin handleSendOTP - storing values:', values);
      localStorage.setItem('phoneFormValues', JSON.stringify(values));
      await sendOTP(`+1${values.phone}`, values.referralCode);
      setStep('otp');
    } catch (err) {
      setError('Failed to send OTP. Please try again.');
      console.error(err);
    }
  };

  // Get referral code from URL parameters
  const getReferralFromUrl = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const refCode = urlParams.get('ref');
    console.log('PhoneLogin getReferralFromUrl - URL ref param:', refCode);
    return refCode;
  };

  const handleVerifyOTP = async (values) => {
    try {
      setError('');
      const result = await verifyOTP(values.otp);
      if (result.isNewCustomer) {
        setStep('name');
      } else {
        navigate('/app/dashboard');
      }
    } catch (err) {
      setError('Invalid OTP. Please try again.');
      console.error(err);
    }
  };

  const handleSaveName = async (values) => {
    try {
      setError('');
      // Get referral code from the phone form step
      const phoneFormValues = JSON.parse(localStorage.getItem('phoneFormValues') || '{}');
      console.log('PhoneLogin handleSaveName - phoneFormValues:', phoneFormValues);
      console.log('PhoneLogin handleSaveName - referralCode:', phoneFormValues.referralCode);
      await saveCustomerName(phoneNumber, values.fullName, phoneFormValues.referralCode);
      localStorage.removeItem('phoneFormValues');
      navigate('/app/dashboard');
    } catch (err) {
      setError('Failed to save information. Please try again.');
      console.error(err);
    }
  };

  return (
    <>
      <div id="recaptcha-container"></div>
      {step === 'phone' ? (
        <Formik
          key="phone-form"
          initialValues={{
            phone: '',
            referralCode: getReferralFromUrl() || '',
            submit: null
          }}
          validationSchema={Yup.object().shape({
            phone: Yup.string()
              .matches(/^\d{10}$/, 'Please enter a valid 10-digit mobile number')
              .required('Mobile number is required'),
            referralCode: Yup.string()
              .matches(/^[A-Z0-9]{6}$/, 'Referral code must be 6 characters (letters and numbers only)')
              .optional()
          })}
          onSubmit={handleSendOTP}
        >
          {({ errors, handleBlur, handleChange, handleSubmit, isSubmitting, touched, values }) => (
            <form noValidate onSubmit={handleSubmit}>
              <div className="form-group mb-1">
                <span className="d-block mb-2"><b>Refer 5 people to Generate $10 OFF code. Bring it to us @ Taste Of India Express</b></span>
                <label htmlFor="phone">Mobile Number</label>
                <div className="input-group">
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
                </div>
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
                {touched.referralCode && errors.referralCode && <small className="text-danger form-text">{errors.referralCode}</small>}
              </div>

              {error && (
                <Col sm={12}>
                  <Alert variant="danger">{error}</Alert>
                </Col>
              )}

              <Row>
                <Col>
                  <Button className="btn-block mb-4" color="primary" disabled={isSubmitting} size="large" type="submit" variant="primary">
                    Continue
                  </Button>
                </Col>
              </Row>
            </form>
          )}
        </Formik>
      ) : step === 'otp' ? (
        <Formik
          key="otp-form"
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
                <Col sm={12}>
                  <Alert variant="danger">{error}</Alert>
                </Col>
              )}

              <Row>
                <Col>
                  <Button className="btn-block mb-4" color="primary" disabled={isSubmitting} size="large" type="submit" variant="primary">
                    Verify OTP
                  </Button>
                </Col>
              </Row>
              <Row>
                <Col>
                  <Button className="btn-block" variant="outline-secondary" onClick={() => setStep('phone')}>
                    Back to Phone Number
                  </Button>
                </Col>
              </Row>
            </form>
          )}
        </Formik>
      ) : step === 'name' ? (
        <Formik
          key="name-form"
          initialValues={{
            fullName: '',
            submit: null
          }}
          validationSchema={Yup.object().shape({
            fullName: Yup.string().min(2, 'Name must be at least 2 characters').required('Full name is required')
          })}
          onSubmit={handleSaveName}
        >
          {({ errors, handleBlur, handleChange, handleSubmit, isSubmitting, touched, values }) => (
            <form noValidate onSubmit={handleSubmit}>
              <div className="form-group mb-3">
                <label htmlFor="fullName">Full Name</label>
                <input
                  className="form-control"
                  id="fullName"
                  name="fullName"
                  onBlur={handleBlur}
                  onChange={handleChange}
                  type="text"
                  placeholder="Enter your full name"
                  value={values.fullName}
                />
                {touched.fullName && errors.fullName && <small className="text-danger form-text">{errors.fullName}</small>}
              </div>

              {error && (
                <Col sm={12}>
                  <Alert variant="danger">{error}</Alert>
                </Col>
              )}

              <Row>
                <Col>
                  <Button className="btn-block mb-4" color="primary" disabled={isSubmitting} size="large" type="submit" variant="primary">
                    Complete Registration
                  </Button>
                </Col>
              </Row>
              <Row>
                <Col>
                  <Button className="btn-block" variant="outline-secondary" onClick={() => setStep('otp')}>
                    Back to OTP
                  </Button>
                </Col>
              </Row>
            </form>
          )}
        </Formik>
      ) : null}
    </>
  );
};

export default PhoneLogin;
