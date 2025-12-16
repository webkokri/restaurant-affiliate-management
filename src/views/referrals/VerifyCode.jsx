import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../firebase';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';

// react-bootstrap
import { Row, Col, Card, Alert, Button, Form } from 'react-bootstrap';

// ==============================|| VERIFY CODE PAGE ||============================== //

const VerifyCode = () => {
  const { currentUser } = useAuth();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (currentUser) {
      checkAdminRole();
    }
  }, [currentUser]);

  const checkAdminRole = async () => {
    try {
      const userDoc = await getDocs(query(collection(db, 'customers'), where('phoneNumber', '==', currentUser.phoneNumber)));

      if (!userDoc.empty) {
        const userData = userDoc.docs[0].data();
        setIsAdmin(userData.role === 'admin');
      }
    } catch (error) {
      console.error('Error checking admin role:', error);
    }
  };

  const handleVerify = async () => {
    if (!code || code.length !== 10) {
      setError('Please enter a valid 10-digit code.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Find the code in referral_codes collection
      const codeQuery = await getDocs(query(collection(db, 'referral_codes'), where('code', '==', code), where('status', '==', 'active')));

      if (codeQuery.empty) {
        setError('Code not found or already verified/used.');
        return;
      }

      const codeDoc = codeQuery.docs[0];
      const codeData = codeDoc.data();

      // Check if code is expired
      const now = new Date();
      const expiresAt = codeData.expiresAt?.toDate ? codeData.expiresAt.toDate() : new Date(codeData.expiresAt);

      if (now > expiresAt) {
        setError('Code has expired.');
        return;
      }

      // Mark code as verified
      await updateDoc(doc(db, 'referral_codes', codeDoc.id), {
        status: 'verified',
        verifiedAt: new Date()
      });

      setSuccess('Code verified successfully!');
      setCode('');
    } catch (error) {
      console.error('Error verifying code:', error);
      setError('Failed to verify code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) {
    return (
      <Row>
        <Col>
          <Card>
            <Card.Body>
              <Alert variant="danger">
                <h5>Access Denied</h5>
                <p>You do not have permission to access this page.</p>
              </Alert>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    );
  }

  return (
    <React.Fragment>
      <Row>
        <Col>
          <Card>
            <Card.Header>
              <h5>Verify Code</h5>
              <span className="text-muted">Verify 10-digit referral codes</span>
            </Card.Header>
            <Card.Body>
              {error && (
                <Alert variant="danger" className="mb-3">
                  {error}
                </Alert>
              )}

              {success && (
                <Alert variant="success" className="mb-3">
                  {success}
                </Alert>
              )}

              <Form.Group className="mb-3">
                <Form.Label>Enter 8-digit Code</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Enter code"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  maxLength={10}
                />
                <Form.Text className="text-muted">Enter the 10-digit code to verify.</Form.Text>
              </Form.Group>

              <Button variant="primary" onClick={handleVerify} disabled={loading || code.length !== 10}>
                {loading ? 'Verifying...' : 'Verify Code'}
              </Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </React.Fragment>
  );
};

export default VerifyCode;
