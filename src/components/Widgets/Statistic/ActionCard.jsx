import React from 'react';

// react-bootstrap
import { Card, Button } from 'react-bootstrap';

// ==============================|| ACTION CARD ||============================== //

const ActionCard = ({ params }) => {
  let cardClass = ['order-card'];
  if (params.class) {
    cardClass = [...cardClass, params.class];
  }

  let iconClass = ['me-2'];
  if (params.icon) {
    iconClass = [...iconClass, params.icon];
  }

  return (
    <Card className={cardClass.join(' ')}>
      <Card.Body className="d-flex flex-column justify-content-center align-items-center" style={{ minHeight: '150px', padding: '1.5rem' }}>
        <h5 className="text-white mb-3 text-center">{params.title}</h5>
        <Button variant="light" size="lg" onClick={params.onClick} className="w-100" style={{ maxWidth: '280px' }}>
          <i className={iconClass.join(' ')} />
          {params.buttonText}
        </Button>
      </Card.Body>
    </Card>
  );
};

export default ActionCard;
