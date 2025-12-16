import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

// react-bootstrap
import { Row, Col, Card, Table, Alert, Badge } from 'react-bootstrap';

// ==============================|| REDEEMED CODES PAGE ||============================== //

const RedeemedCodes = () => {
  const { currentUser } = useAuth();
  const [codes, setCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const fetchCodes = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch all referral codes for current user
      const codesQuery = await getDocs(query(collection(db, 'referral_codes'), where('userId', '==', currentUser.phoneNumber)));

      const codesData = codesQuery.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }));

      // Sort by creation date (newest first)
      const sortedCodes = codesData.sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
        return dateB - dateA;
      });

      // Mark expired if not used or verified and past expiry date
      const now = new Date();
      const updatedCodes = sortedCodes.map((code) => {
        const expiresAt = code.expiresAt?.toDate ? code.expiresAt.toDate() : new Date(code.expiresAt);
        let status = code.status;
        if (status !== 'used' && status !== 'verified' && now > expiresAt) {
          status = 'expired';
        }
        return { ...code, status };
      });

      setCodes(updatedCodes);
    } catch (error) {
      console.error('Error fetching codes:', error);
      setError('Failed to load redeemed codes. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchCodes();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  const getStatus = (code) => {
    if (code.status === 'verified') {
      return { text: 'Verified', variant: 'success' };
    } else if (code.status === 'used') {
      return { text: 'Used', variant: 'info' };
    }

    const now = new Date();
    const expiresAt = code.expiresAt?.toDate ? code.expiresAt.toDate() : new Date(code.expiresAt);

    if (now > expiresAt) {
      return { text: 'Expired', variant: 'danger' };
    }

    return { text: 'Active', variant: 'warning' };
  };

  if (loading) {
    return (
      <Row>
        <Col>
          <Card>
            <Card.Body>
              <div className="text-center">Loading redeemed codes...</div>
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
              <h5>Redeemed Codes</h5>
              <span className="text-muted">Codes generated from your referrals</span>
            </Card.Header>
            <Card.Body>
              {error && (
                <Alert variant="danger" className="mb-3">
                  {error}
                </Alert>
              )}

              {codes.length === 0 ? (
                <div className="text-center text-muted">
                  <p>No codes generated yet.</p>
                </div>
              ) : (
                <Table responsive hover>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Code</th>
                      <th>Generated Date</th>
                      <th>Expiry Date</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {codes.map((code, index) => {
                      const status = getStatus(code);
                      return (
                        <tr key={code.id}>
                          <td>{index + 1}</td>
                          <td>
                            <code>{code.code}</code>
                          </td>
                          <td>
                            {code.createdAt?.toDate
                              ? code.createdAt.toDate().toLocaleDateString()
                              : new Date(code.createdAt).toLocaleDateString()}
                          </td>
                          <td>
                            {code.expiresAt?.toDate
                              ? code.expiresAt.toDate().toLocaleDateString()
                              : new Date(code.expiresAt).toLocaleDateString()}
                          </td>
                          <td>
                            <Badge bg={status.variant}>{status.text}</Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </React.Fragment>
  );
};

export default RedeemedCodes;
