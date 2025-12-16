import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../../contexts/AuthContext';

// react-bootstrap
import { ListGroup, Dropdown } from 'react-bootstrap';

// third party

// project import
import ChatList from './ChatList';

// assets
import avatar1 from '../../../../assets/images/user/avtar-1.jpg';

// ==============================|| NAV RIGHT ||============================== //

const NavRight = () => {
  const [listOpen, setListOpen] = useState(false);
  const { logout, customerData } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/auth/signin');
  };

  return (
    <React.Fragment>
      <ListGroup as="ul" bsPrefix=" " className="navbar-nav ml-auto">
        <ListGroup.Item as="li" bsPrefix=" "></ListGroup.Item>
        <ListGroup.Item as="li" bsPrefix=" ">
          <Dropdown align="end" className="drp-user">
            <Dropdown.Toggle as={Link} variant="link" to="#" id="dropdown-basic">
              <img src={avatar1} className="img-radius wid-40" alt="User Profile" />
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
              <button
                className="dud-logout"
                title="Logout"
                onClick={handleLogout}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                type="button"
              >
                <i className="feather icon-log-out custom" />
              </button>
            </Dropdown.Toggle>
            <Dropdown.Menu align="end" className="profile-notification">
              <div className="pro-head">
                <img src={avatar1} className="img-radius" alt="User Profile" />
                <span>{customerData?.fullName || 'John Doe'}</span>
                <button
                  className="dud-logout"
                  title="Logout"
                  onClick={handleLogout}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                  type="button"
                >
                  <i className="feather icon-log-out" />
                </button>
              </div>
            </Dropdown.Menu>
          </Dropdown>
        </ListGroup.Item>
      </ListGroup>
      <ChatList listOpen={listOpen} closed={() => setListOpen(false)} />
    </React.Fragment>
  );
};

export default NavRight;
