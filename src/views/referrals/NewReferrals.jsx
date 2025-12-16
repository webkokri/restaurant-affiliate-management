import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../firebase';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';

// react-bootstrap
import { Row, Col, Card, Table, Alert, Button, Badge } from 'react-bootstrap';

// ==============================|| NEW REFERRALS PAGE ||============================== //

const NewReferrals = () => {
  const { currentUser, customerData } = useAuth();
  const [newReferrals, setNewReferrals] = useState([]);
  const [referralCodes, setReferralCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [totalReferralCount, setTotalReferralCount] = useState(0);

  // Use ref to track last generated batch to prevent duplicate generations
  const lastGeneratedBatchRef = useRef(0);

  // Fetch referral codes
  const fetchReferralCodes = useCallback(async () => {
    try {
      if (!currentUser?.phoneNumber) return;

      // Fetch referral codes for current user
      const codesQuery = query(collection(db, 'referral_codes'), where('userId', '==', currentUser.phoneNumber));

      const codesSnapshot = await getDocs(codesQuery);
      const codes = codesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }));

      // Sort in memory instead of using orderBy to avoid index requirement
      const sortedCodes = codes
        .sort((a, b) => {
          const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
          const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
          return dateB - dateA;
        })
        .slice(0, 10); // Limit to 10 most recent

      setReferralCodes(sortedCodes);
    } catch (error) {
      console.error('Error fetching referral codes:', error);
      setReferralCodes([]);
    }
  }, [currentUser?.phoneNumber]);

  // Generate referral code
  const generateReferralCode = useCallback(
    async (referralCount) => {
      try {
        if (!currentUser?.phoneNumber || referralCount < 5) return;

        const batchNumber = Math.floor(referralCount / 5);

        // Check if we already generated for this batch
        if (lastGeneratedBatchRef.current >= batchNumber) {
          console.log('Code already generated for batch', batchNumber);
          return;
        }

        // Check if code already exists for this batch in database
        const codesQuery = query(
          collection(db, 'referral_codes'),
          where('userId', '==', currentUser.phoneNumber),
          where('batchNumber', '==', batchNumber)
        );
        const existingCodesSnapshot = await getDocs(codesQuery);

        if (!existingCodesSnapshot.empty) {
          console.log('Code already exists in database for batch', batchNumber);
          lastGeneratedBatchRef.current = batchNumber;
          return;
        }

        // Generate a new 10-digit code for this batch
        const code = Math.floor(1000000000 + Math.random() * 9000000000).toString();

        console.log('Generating new code for batch', batchNumber, '- Code:', code);

        await addDoc(collection(db, 'referral_codes'), {
          userId: currentUser.phoneNumber,
          code: code,
          batchNumber: batchNumber,
          status: 'active',
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          usedAt: null,
          verifiedAt: null
        });

        // Update the ref to prevent duplicate generation
        lastGeneratedBatchRef.current = batchNumber;

        // Refresh codes
        await fetchReferralCodes();

        console.log('Code generated successfully for batch', batchNumber);
      } catch (error) {
        console.error('Error generating referral code:', error);
      }
    },
    [currentUser?.phoneNumber, fetchReferralCodes]
  );

  // Fetch new referrals
  const fetchNewReferrals = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      if (!customerData?.referralId) {
        console.warn('No referralId found for current user');
        setNewReferrals([]);
        setTotalReferralCount(0);
        setLoading(false);
        return;
      }

      const referralId = customerData.referralId;

      // Fetch customers referred by current user
      const referredCustomersSnapshot = await getDocs(query(collection(db, 'customers'), where('referredBy', '==', referralId)));

      const totalCount = referredCustomersSnapshot.size;
      setTotalReferralCount(totalCount);

      const referrals = [];

      for (const doc of referredCustomersSnapshot.docs) {
        const customerData = doc.data();

        // Count how many customers this referral has referred
        const subReferrals = await getDocs(query(collection(db, 'customers'), where('referredBy', '==', customerData.phoneNumber)));

        referrals.push({
          id: doc.id,
          ...customerData,
          referredCount: subReferrals.size
        });
      }

      const recentReferrals = referrals
        .sort((a, b) => {
          const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
          const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
          return dateB - dateA;
        })
        .slice(0, 5);

      setNewReferrals(recentReferrals);

      // Trigger code generation if needed
      if (totalCount >= 5) {
        await generateReferralCode(totalCount);
      }
    } catch (error) {
      console.error('Error fetching new referrals:', error);
      setError('Failed to load new referrals. Please try again.');
      setTotalReferralCount(0);
    } finally {
      setLoading(false);
    }
  }, [customerData, generateReferralCode]);

  // Initial load
  useEffect(() => {
    if (currentUser && customerData) {
      fetchNewReferrals();
      fetchReferralCodes();
    }
  }, [currentUser, customerData, fetchNewReferrals, fetchReferralCodes]);

  // Auto-generate code when referral count changes
  useEffect(() => {
    if (totalReferralCount >= 5) {
      const currentBatch = Math.floor(totalReferralCount / 5);
      if (currentBatch > lastGeneratedBatchRef.current) {
        console.log('Triggering code generation for batch', currentBatch);
        generateReferralCode(totalReferralCount);
      }
    }
  }, [totalReferralCount, generateReferralCode]);

  const getStatusBadge = (code) => {
    const now = new Date();
    const expiresAt = code.expiresAt?.toDate ? code.expiresAt.toDate() : new Date(code.expiresAt);

    if (code.status === 'verified') {
      return <Badge bg="success">Verified</Badge>;
    } else if (code.status === 'used') {
      return <Badge bg="info">Used</Badge>;
    } else if (expiresAt < now) {
      return <Badge bg="danger">Expired</Badge>;
    } else {
      return <Badge bg="warning">Active</Badge>;
    }
  };

  if (loading) {
    return (
      <Row>
        <Col>
          <Card>
            <Card.Body>
              <div className="text-center">Loading new referrals...</div>
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
              <h5>New Referrals</h5>
              <span className="text-muted">Most recent 5 referrals</span>
            </Card.Header>
            <Card.Body>
              {error && (
                <Alert variant="danger" className="mb-3">
                  {error}
                </Alert>
              )}

              {newReferrals.length === 0 ? (
                <div className="text-center text-muted">
                  <p>No referrals found.</p>
                </div>
              ) : (
                <Table responsive hover>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Full Name</th>
                      <th>Phone Number</th>
                      <th>Referral Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {newReferrals.map((referral, index) => (
                      <tr key={referral.id}>
                        <td>{index + 1}</td>
                        <td>{referral.fullName || 'N/A'}</td>
                        <td>{referral.phoneNumber}</td>
                        <td>
                          {referral.createdAt?.toDate
                            ? referral.createdAt.toDate().toLocaleDateString()
                            : new Date(referral.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="mt-4">
        <Col>
          <Card>
            <Card.Header>
              <h5>Referral Codes</h5>
              <span className="text-muted">Generated codes for your referrals</span>
            </Card.Header>
            <Card.Body>
              {referralCodes.length === 0 ? (
                <div className="text-center text-muted">
                  <p>No referral codes generated yet.</p>
                </div>
              ) : (
                <Table responsive hover>
                  <thead>
                    <tr>
                      <th>Code</th>
                      <th>Status</th>
                      <th>Created Date</th>
                      <th>Expires Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {referralCodes.map((code) => (
                      <tr key={code.id}>
                        <td>
                          <strong>{code.code}</strong>
                        </td>
                        <td>{getStatusBadge(code)}</td>
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
                          {code.status === 'active' && (
                            <Button variant="outline-primary" size="sm">
                              Verify
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
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

export default NewReferrals;
