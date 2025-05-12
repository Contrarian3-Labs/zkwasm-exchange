import React from 'react';
import { MDBBtn } from 'mdb-react-ui-kit';

interface ErrorAlertProps {
  message: string;
  onClose: () => void;
}

const ErrorAlert: React.FC<ErrorAlertProps> = ({ message, onClose }) => {
  return (
    <div style={{ padding: '10px', backgroundColor: '#f8d7da', color: '#721c24', borderRadius: '5px', marginBottom: '10px' }}>
      <strong>Error: </strong> {message}
      <MDBBtn size="sm" color="danger" onClick={onClose} style={{ float: 'right' }}>
        Close
      </MDBBtn>
    </div>
  );
};

export default ErrorAlert;