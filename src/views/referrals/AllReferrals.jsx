import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

// react-bootstrap
import { Row, Col, Card, Table, Alert, Pagination } from 'react-bootstrap';

// ==============================|| ALL REFERRALS PAGE ||============================== //

const AllReferrals = () => {
  const { currentUser, customerData } = useAuth();
  const [allReferrals, setAllReferrals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    if (currentUser && customerData) {
      fetchAllReferrals(1);
    }
  }, [currentUser, customerData]);

  const fetchAllReferrals = async (page = 1) => {
    try {
      setLoading(true);
      setError('');

      // Fetch customers referred by current user (using referral code)
      const referralId = customerData?.referralId;
      if (!referralId) {
        console.warn('No referralId found for current user');
        setAllReferrals([]);
        setTotalPages(1);
        return;
      }

      // First, get total count for pagination
      const totalQuery = query(collection(db, 'customers'), where('referredBy', '==', referralId));
      const totalSnapshot = await getDocs(totalQuery);
      const totalCount = totalSnapshot.size;
      const calculatedTotalPages = Math.ceil(totalCount / itemsPerPage);
      setTotalPages(calculatedTotalPages);

      // First, get all referrals for this user (without ordering to avoid index requirement)
      const allReferralsQuery = query(collection(db, 'customers'), where('referredBy', '==', referralId));
      const allReferralsSnap = await getDocs(allReferralsQuery);

      // Sort by createdAt descending in memory
      const sortedReferrals = allReferralsSnap.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .sort((a, b) => {
          const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
          const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
          return dateB - dateA;
        });

      // Apply pagination in memory
      const startIndex = (page - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const paginatedReferrals = sortedReferrals.slice(startIndex, endIndex);

      // Process referrals with sub-referral counts
      const referrals = [];

      for (const referral of paginatedReferrals) {
        // Count how many customers this referral has referred
        const subReferrals = await getDocs(query(collection(db, 'customers'), where('referredBy', '==', referral.phoneNumber)));

        referrals.push({
          ...referral,
          referredCount: subReferrals.size
        });
      }

      setAllReferrals(referrals);
      setCurrentPage(page);
    } catch (error) {
      console.error('Error fetching all referrals:', error);
      setError('Failed to load all referrals. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (pageNumber) => {
    if (pageNumber !== currentPage) {
      fetchAllReferrals(pageNumber);
    }
  };

  if (loading) {
    return (
      <Row>
        <Col>
          <Card>
            <Card.Body>
              <div className="text-center">Loading all referrals...</div>
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
              <h5>All Referrals</h5>
              <span className="text-muted">List of all your referrals with pagination (10 per page)</span>
            </Card.Header>
            <Card.Body>
              {error && (
                <Alert variant="danger" className="mb-3">
                  {error}
                </Alert>
              )}

              {allReferrals.length === 0 ? (
                <div className="text-center text-muted">
                  <p>No referrals found.</p>
                </div>
              ) : (
                <Table responsive hover>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Name</th>
                      <th>Number</th>
                      <th>Number of Referred Customers</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allReferrals.map((referral, index) => (
                      <tr key={referral.id}>
                        <td>{(currentPage - 1) * itemsPerPage + index + 1}</td>
                        <td>{referral.fullName || 'N/A'}</td>
                        <td>{referral.phoneNumber}</td>
                        <td>{referral.referredCount || 0}</td>
                        <td>
                          <span className={`badge ${referral.status === 'active' ? 'bg-success' : 'bg-secondary'}`}>
                            {referral.status || 'active'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}

              {totalPages > 1 && (
                <div className="d-flex justify-content-center mt-3">
                  <Pagination>
                    <Pagination.First disabled={currentPage === 1} onClick={() => handlePageChange(1)} />
                    <Pagination.Prev disabled={currentPage === 1} onClick={() => handlePageChange(currentPage - 1)} />

                    {[...Array(totalPages)].map((_, index) => {
                      const pageNumber = index + 1;
                      const isCurrentPage = pageNumber === currentPage;
                      const isNearCurrent = Math.abs(pageNumber - currentPage) <= 2;

                      if (isCurrentPage || isNearCurrent || pageNumber === 1 || pageNumber === totalPages) {
                        return (
                          <Pagination.Item key={pageNumber} active={isCurrentPage} onClick={() => handlePageChange(pageNumber)}>
                            {pageNumber}
                          </Pagination.Item>
                        );
                      } else if (pageNumber === currentPage - 3 || pageNumber === currentPage + 3) {
                        return <Pagination.Ellipsis key={pageNumber} />;
                      }
                      return null;
                    })}

                    <Pagination.Next disabled={currentPage === totalPages} onClick={() => handlePageChange(currentPage + 1)} />
                    <Pagination.Last disabled={currentPage === totalPages} onClick={() => handlePageChange(totalPages)} />
                  </Pagination>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </React.Fragment>
  );
};

export default AllReferrals;
