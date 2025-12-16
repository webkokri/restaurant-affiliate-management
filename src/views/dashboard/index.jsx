import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../firebase';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';

// react-bootstrap
import { Row, Col, Card, Table, Button, Alert, Modal, Form, Badge } from 'react-bootstrap';

// third party
import PerfectScrollbar from 'react-perfect-scrollbar';

// project import
import OrderCard from '../../components/Widgets/Statistic/OrderCard';
import ActionCard from '../../components/Widgets/Statistic/ActionCard';

// assets

// ==============================|| DASHBOARD ANALYTICS ||============================== //

const DashAnalytics = () => {
  const { currentUser, customerData, setCustomerData } = useAuth();

  const [newReferrals, setNewReferrals] = useState([]);
  const [totalReferrals, setTotalReferrals] = useState(0);
  const [recentReferrals, setRecentReferrals] = useState([]);
  const [referralCodes, setReferralCodes] = useState([]);
  // Removed unused pendingCode state
  const [alertMessage, setAlertMessage] = useState('');
  const [referralCode, setReferralCode] = useState(null); // New state to store persisted referral code
  const [showNameModal, setShowNameModal] = useState(false);
  const [fullName, setFullName] = useState('');

  // New state for admin verify code input
  const [adminVerifyCodeInput, setAdminVerifyCodeInput] = useState('');
  const [adminVerifyMessage, setAdminVerifyMessage] = useState('');

  // Fetch recent referred customers
  const fetchRecentReferrals = useCallback(async () => {
    try {
      if (!currentUser || !customerData) return;
      const referralId = customerData.referralId;
      if (!referralId) {
        setRecentReferrals([]);
        return;
      }

      // Fetch customers referred by this user
      const referredCustomersQuery = query(collection(db, 'customers'), where('referredBy', '==', referralId));
      const referredCustomersSnapshot = await getDocs(referredCustomersQuery);

      const referralsData = [];
      for (const docSnap of referredCustomersSnapshot.docs) {
        const data = docSnap.data();

        // Count how many customers this referred customer has referred
        const subReferralQuery = query(collection(db, 'customers'), where('referredBy', '==', data.referralId || ''));
        const subReferralSnapshot = await getDocs(subReferralQuery);

        referralsData.push({
          id: docSnap.id,
          fullName: data.fullName || 'N/A',
          phoneNumber: docSnap.id,
          referredCount: subReferralSnapshot.size,
          status: data.status || 'active',
          createdAt: data.createdAt
        });
      }

      // Sort by creation date (most recent first) and limit to 20
      referralsData.sort((a, b) => {
        const dateA = a.createdAt?.toDate?.() || new Date(0);
        const dateB = b.createdAt?.toDate?.() || new Date(0);
        return dateB - dateA;
      });

      setRecentReferrals(referralsData.slice(0, 20));
    } catch (error) {
      console.error('Error fetching recent referrals:', error);
      setRecentReferrals([]);
    }
  }, [currentUser, customerData]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const fetchTotalReferrals = useCallback(async () => {
    try {
      if (!currentUser || !customerData) return;
      const referralId = customerData.referralId;
      if (!referralId) {
        setTotalReferrals(0);
        return;
      }
      const referredCustomersSnapshot = await getDocs(query(collection(db, 'customers'), where('referredBy', '==', referralId)));
      setTotalReferrals(referredCustomersSnapshot.size);
    } catch (error) {
      console.error('Error fetching total referrals:', error);
      setTotalReferrals(0);
    }
  });

  // Fetch referral codes
  const fetchReferralCodes = useCallback(async () => {
    try {
      if (!currentUser?.phoneNumber) return;

      const codesQuery = query(collection(db, 'referral_codes'), where('userId', '==', currentUser.phoneNumber));

      const codesSnapshot = await getDocs(codesQuery);
      const codes = codesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }));

      // Sort by creation date (most recent first)
      const sortedCodes = codes.sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
        return dateB - dateA;
      });

      setReferralCodes(sortedCodes);
    } catch (error) {
      console.error('Error fetching referral codes:', error);
      setReferralCodes([]);
    }
  }, [currentUser?.phoneNumber]);

  useEffect(() => {
    fetchTotalReferrals();
    fetchRecentReferrals();
    fetchReferralCodes();
  }, [fetchTotalReferrals, fetchRecentReferrals, fetchReferralCodes]);

  const verifyCode = async () => {
    if (!referralCode) return;

    try {
      // Update user's total referrals count
      const userRef = doc(db, 'customers', currentUser.phoneNumber);

      // Find the referral code doc id corresponding to referralCode
      const codesQuery = query(
        collection(db, 'referral_codes'),
        where('userId', '==', currentUser.phoneNumber),
        where('code', '==', referralCode),
        where('status', '==', 'active')
      );
      const codesSnapshot = await getDocs(codesQuery);
      if (!codesSnapshot.empty) {
        const codeDoc = codesSnapshot.docs[0];
        // Update status to verified
        await updateDoc(codeDoc.ref, {
          status: 'verified',
          verifiedAt: new Date()
        });
      }

      // Optionally update customer totalReferrals etc.
      await updateDoc(userRef, {
        lastCodeVerification: new Date()
      });

      // Reset new referrals count and referralCode state
      setNewReferrals([]);
      setReferralCode(null);
      setTotalReferrals((prev) => prev + 5);
      setAlertMessage('Code verified successfully! 5 referrals added to your total count.');
    } catch (error) {
      console.error('Error verifying code:', error);
      setAlertMessage('Error verifying code. Please try again.');
    }
  };

  const dismissAlert = () => {
    setAlertMessage('');
  };

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

  const handleSaveName = async () => {
    if (!fullName.trim()) return;

    try {
      const userRef = doc(db, 'customers', currentUser.phoneNumber);
      await updateDoc(userRef, {
        fullName: fullName.trim(),
        nameUpdatedAt: new Date()
      });

      // Update local customerData state
      setCustomerData((prev) => ({
        ...prev,
        fullName: fullName.trim()
      }));

      setShowNameModal(false);
      setFullName('');
      setAlertMessage('Name updated successfully!');
    } catch (error) {
      console.error('Error updating name:', error);
      setAlertMessage('Error updating name. Please try again.');
    }
  };

  if (!customerData) {
    return (
      <div className="text-center p-4">
        <span>Loading...</span>
      </div>
    );
  }

  return (
    <React.Fragment>
      {/* Name Update Modal */}
      <Modal show={showNameModal} onHide={() => {}} backdrop="static" keyboard={false}>
        <Modal.Header>
          <Modal.Title>Complete Your Profile</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Full Name</Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter your full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={handleSaveName} disabled={!fullName.trim()}>
            Save Name
          </Button>
        </Modal.Footer>
      </Modal>

      {alertMessage && (
        <Row className="mb-3">
          <Col>
            <Alert variant={alertMessage.includes('Error') ? 'danger' : 'success'} dismissible onClose={dismissAlert}>
              {alertMessage}
              {referralCode && (
                <div className="mt-2">
                  <strong>Verification Code: {referralCode}</strong>
                  <Button variant="primary" size="sm" className="ms-2" onClick={verifyCode}>
                    Verify Code
                  </Button>
                </div>
              )}
            </Alert>
          </Col>
        </Row>
      )}

      {/* New Admin Verify Code Card */}
      {customerData?.role === 'admin' && (
        <Row className="mb-4">
          <Col sm={12}>
            <Card>
              <Card.Header>
                <Card.Title as="h5">Admin: Verify Referral Code</Card.Title>
              </Card.Header>
              <Card.Body>
                {adminVerifyMessage && (
                  <Alert variant="info" dismissible onClose={() => setAdminVerifyMessage('')}>
                    {adminVerifyMessage}
                  </Alert>
                )}
                <Form className="d-flex">
                  <Form.Control
                    type="text"
                    placeholder="Enter referral code"
                    value={adminVerifyCodeInput}
                    onChange={(e) => setAdminVerifyCodeInput(e.target.value)}
                  />
                  <Button
                    variant="primary"
                    className="ms-2"
                    onClick={async () => {
                      if (!adminVerifyCodeInput.trim()) return;
                      // Verify the code: find the referral_codes doc and update status to verified
                      try {
                        const codesQuery = query(
                          collection(db, 'referral_codes'),
                          where('code', '==', adminVerifyCodeInput.trim()),
                          where('status', '==', 'active')
                        );
                        const codesSnapshot = await getDocs(codesQuery);
                        if (!codesSnapshot.empty) {
                          const codeDoc = codesSnapshot.docs[0];
                          await updateDoc(codeDoc.ref, {
                            status: 'verified',
                            verifiedAt: new Date()
                          });
                          setAdminVerifyMessage('Code verified successfully.');
                          setAdminVerifyCodeInput('');
                          // Refresh referral data
                          fetchTotalReferrals();
                          fetchRecentReferrals();
                        } else {
                          setAdminVerifyMessage('Invalid or already verified code.');
                        }
                      } catch (error) {
                        setAdminVerifyMessage('Error verifying code. Please try again.');
                      }
                    }}
                  >
                    Verify
                  </Button>
                </Form>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* Action Cards */}
      <Row className="mb-3">
        <Col xs={12} sm={6} md={6} xl={6} className="mb-3 mb-sm-0">
          <ActionCard
            params={{
              title: 'Visit Our Website',
              class: 'bg-c-yellow',
              icon: 'feather icon-globe',
              buttonText: 'Visit Website',
              onClick: () => window.open('https://tasteofindiaexpress.ca/', '_blank')
            }}
          />
        </Col>
        <Col xs={12} sm={6} md={6} xl={6}>
          <ActionCard
            params={{
              title: 'Order Food Online',
              class: 'bg-c-red',
              icon: 'feather icon-shopping-bag',
              buttonText: 'Place Orders',
              onClick: () => {
                // Trigger the Glutenfree ordering widget
                const glfButton = document.querySelector('.glf-button');
                if (glfButton) {
                  glfButton.click();
                }
              }
            }}
          />
        </Col>
      </Row>

      <Row>
        {/* order cards */}
        <Col xs={12} sm={6} md={6} xl={6} className="mb-3 mb-sm-0">
          <OrderCard
            params={{
              title: 'New Referrals',
              class: 'bg-c-blue',
              icon: 'feather icon-shopping-cart',
              primaryText: newReferrals.length.toString()
            }}
          />
        </Col>
        <Col xs={12} sm={6} md={6} xl={6}>
          <OrderCard
            params={{
              title: 'Total Referrals',
              class: 'bg-c-green',
              icon: 'feather icon-tag',
              primaryText: totalReferrals.toString()
            }}
          />
        </Col>

        {/* Generated Redemption Codes Card */}
        <Col sm={12} className="mt-4">
          <Card>
            <Card.Header>
              <Card.Title as="h5">Generated Redemption Codes</Card.Title>
              <span className="text-muted">Your redemption codes for verified referrals</span>
            </Card.Header>
            <Card.Body>
              {referralCodes.length === 0 ? (
                <div className="text-center text-muted py-4">
                  <i className="feather icon-gift" style={{ fontSize: '48px', opacity: 0.3 }}></i>
                  <p className="mt-3">No redemption codes generated yet.</p>
                  <p className="small">Codes are automatically generated when you refer 5 people.</p>
                </div>
              ) : (
                <>
                  {/* Status Indicators */}
                  <div className="mb-3 d-flex flex-wrap gap-3 align-items-center">
                    <span className="text-muted me-2">Status Indicators:</span>
                    <div className="d-flex align-items-center">
                      <Badge bg="warning" className="me-1">
                        Active
                      </Badge>
                      <span className="small text-muted">- Ready to use</span>
                    </div>
                    <div className="d-flex align-items-center">
                      <Badge bg="success" className="me-1">
                        Verified
                      </Badge>
                      <span className="small text-muted">- Confirmed by admin</span>
                    </div>
                    <div className="d-flex align-items-center">
                      <Badge bg="info" className="me-1">
                        Used
                      </Badge>
                      <span className="small text-muted">- Already redeemed</span>
                    </div>
                    <div className="d-flex align-items-center">
                      <Badge bg="danger" className="me-1">
                        Expired
                      </Badge>
                      <span className="small text-muted">- No longer valid</span>
                    </div>
                  </div>

                  <Table responsive hover>
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Redemption Code</th>
                        <th>Batch</th>
                        <th>Status</th>
                        <th>Created Date</th>
                        <th>Expires Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {referralCodes.map((code, index) => (
                        <tr key={code.id}>
                          <td>{index + 1}</td>
                          <td>
                            <strong style={{ fontSize: '1.1em', color: '#04a9f5' }}>{code.code}</strong>
                          </td>
                          <td>
                            <Badge bg="secondary">Batch {code.batchNumber}</Badge>
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
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col sm={12}>
          <Card>
            <Card.Header>
              <Card.Title as="h5">Recent 20 Referrals</Card.Title>
            </Card.Header>
            <Card.Body className="p-0">
              <div className="table-card" style={{ height: '362px' }}>
                <PerfectScrollbar>
                  <Table responsive>
                    <thead>
                      <tr>
                        <th>
                          <span>Name</span>
                        </th>
                        <th>
                          <span>Number</span>
                        </th>
                        <th>
                          <span>Number of Referred Customers</span>
                        </th>
                        <th>
                          <span>Status</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentReferrals.length > 0 ? (
                        recentReferrals.map((referral, index) => (
                          <tr key={referral.id || index}>
                            <td>{referral.fullName || 'Hidden ***'}</td>
                            <td>{referral.phoneNumber || 'N/A'}</td>
                            <td>{referral.referredCount || 0}</td>
                            <td>
                              <span className={`badge ${referral.status === 'active' ? 'bg-success' : 'bg-secondary'}`}>
                                {referral.status || 'active'}
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="4" className="text-center">
                            No recent referrals found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </Table>
                </PerfectScrollbar>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </React.Fragment>
  );
};

export default DashAnalytics;
