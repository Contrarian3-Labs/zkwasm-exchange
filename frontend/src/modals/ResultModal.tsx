import React from "react";
import { Alert, Modal, Button } from "react-bootstrap";

interface Props {
  infoMessage: string;
  show: boolean;
  onClose: () => void;
}

export const ResultModal = ({ infoMessage, show, onClose }: Props) => {
  const closeModal = () => {
    onClose();
  }

  return (
    <Modal show={show} onHide={closeModal} backdrop="static" style={{ zIndex: 1051 }}>
      <Modal.Header closeButton>
        <Modal.Title>Result</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {infoMessage && <Alert variant="primary" style={{ whiteSpace: 'pre-wrap' }}>{infoMessage}</Alert>}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={closeModal}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
};